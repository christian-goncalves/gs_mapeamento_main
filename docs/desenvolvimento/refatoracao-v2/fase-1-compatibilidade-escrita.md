# F1 — Compatibilidade e fundamento de escrita

## Estado e autorização

Detalhamento preparado como entrega F00-T07. F1 ainda não começou; depende da conferência e do aceite do CP-00. A arquitetura recomendada nesta proposta é o gateway Apps Script único descrito nas [evidências F0](evidencias-f0-2026-10-16.md). Nenhum serviço será provisionado por este documento.

## Objetivo e limites

Preparar leitores, serializadores e escritores para uma transição compatível entre o contrato atual e o contrato V2, preservando o comportamento e os dados existentes. Implantar a coordenação compartilhada escolhida, garantir repetição segura e demonstrar retorno operacional em ambiente DEV isolado.

F1 não habilita revisão, aprovação, edição versionada, exclusão lógica, nova interface, mudança de indicador ou migração de dados. Nenhuma funcionalidade incompleta fica acessível ao usuário. Produção e sua planilha permanecem fora dos testes.

## Pré-condições

1. CP-00 aceito, com schema físico e arquitetura de coordenação registrados.
2. Conta responsável pelo gateway e modo de autenticação aprovados; quotas e monitoramento verificados.
3. Cutover aprovado: writers antigos, scripts administrativos e edição manual mapeados, suspensos ou explicitamente delimitados.
4. Planilha exclusiva de teste identificada; `GOOGLE_SHEETS_TEST_ID` está ausente no checkout observado em 16/10/2026. A planilha DEV atual contém dados e não é fixture de escrita. Não escrever nela sem delimitação e autorização específicas.
5. Backup/export e procedimento de recuperação aprovados para o teste de compatibilidade.
6. Nenhum uso do valor local `GOOGLE_SHEETS_ID` como prova de DEV/PROD; cada alvo é confirmado por título/metadados no momento da operação.

Se alguma pré-condição falhar, continuar apenas testes puros/localmente seguros e parar o trabalho dependente de Sheets.

## Tarefas

| ID | Trabalho | Arquivos/proprietários principais | Evidência |
| --- | --- | --- | --- |
| F10-T01 | Fechar inventário de escritores por chamada de escrita, papel, ambiente, versão de deployment e operação manual. Registrar janela de corte e proibir fallback direto fora do gateway. | `src/lib/sheets/*`, `scripts/*`, Vercel deployments e política da planilha | Inventário com fluxo, ator, alvo, transição, status de suspensão e prova de que todos os writers cobertos usam o mesmo coordenador. |
| F10-T02 | Implementar leitores e adaptadores de compatibilidade v1/v2; campos novos opcionais para leitura de legado, defaults canônicos e cabeçalhos derivados do contrato. Estender intervalos além de Z sem relaxar validação da ordem dos campos. | `src/lib/sheets/contract.ts`, `rows.ts`, `schemas.ts`, `repository.ts`, `domain/schemas.ts`, reconciliação | Testes sintéticos de cabeçalho atual/novo, aba com colunas > Z, campos opcionais ausentes, aliases de visitantes e round-trip de valores. |
| F10-T03 | Implementar operação idempotente e gateway escolhido. O caller cria um `operacao_id` estável; gateway adquire lock global, relê dados, autorização, versão e conjunto; reserva operação; aplica alterações com `batchUpdate` e registra resultado atômico. Falha ou estado indeterminado nunca libera escrita direta. | Novo módulo server-only e projeto Apps Script; `src/lib/sheets/client.ts` e camada de serviço | Mesmo `operacao_id` reconhece sucesso anterior; hash diferente para ID repetido é recusado; estado pendente bloqueia repetição; ledger e dados concluem juntos no lote. |
| F10-T04 | Roteiar todos os escritores atuais através do gateway, inclusive criação de ata, usuários, grupos, horários e scripts de negócio que permanecerem autorizados. Reconciliação estrutural/proteções/reset continuam rotinas de operador separadas. | `create-ata.ts`, `group-admin.ts`, `group-users.ts`, `ata-admin.ts`, scripts e testes | Varredura dos pontos de escrita; teste de que caminho legado não chama cliente Sheets diretamente; contratos de criação preservados. |
| F10-T05 | Fechar repetição, timeout, revalidação, lock, queda do processo e recuperação. Estados desconhecidos são consultados pelo ID; não gerar outra operação automaticamente. | Gateway, ledger, erros de domínio e logs redigidos | Cenários de fault injection e reconciliação; evidência de que tentativas duplicadas não duplicam linha nem sequência e falhas fecham. |
| F10-T06 | Medir payload serializado em operações unitárias e de lote. Aplicar inicialmente 50 atas e 1,5 MiB, um único `batchUpdate`; ajustar somente com evidência e decisão registrada. | Serializador do gateway e fluxo de seleção | Testes no limite, logo abaixo e acima; pedido acima do teto rejeitado antes de gravar; lote nunca fracionado. |
| F10-T07 | Validar compatibilidade com snapshot isolado e planilha exclusiva de teste; provar releitura, atualização, backup e retorno sem escrever em produção. | Testes unitários/integrados, roteiro manual e checklist | Resultados por cenário, identificação de ambiente/título, commit, revisão do export e totais sem dados pessoais. |
| F10-T08 | Preparar pacote para CP-01, consolidando evidência, falhas anteriores, limitações e autorizações necessárias para migração/ativação. | Checklist e documentação V2 | CP-01 apresentado ao usuário. F2 não começa automaticamente. |

## Cenários mínimos de verificação

### Contrato e compatibilidade

- Cabeçalhos atuais são lidos sem mudança; cabeçalhos novos e campos ausentes em linhas legadas são convertidos conforme defaults aprovados.
- Campo adicional após Z é lido pelo adaptador novo; a versão atual estrita não é colocada em produção depois de qualquer migração que ultrapasse seu alcance.
- Nenhum campo livre (`preenchido_por`, `servidores.nome`, `duracao`, `formato_outros`) vira enum ou dropdown.
- UUIDs, índices, dependentes e campos históricos permanecem iguais no round-trip. Aliases históricos não criam duas colunas ou dois valores.
- Campos de aprovação/versão ausentes mantêm semântica legada aprovada/ativa, até a tarefa de ativação da fase correspondente.

### Coordenação, permissões e repetição

- Dois criadores concorrentes disputam mesma linha/índice: resultado serializado e segunda operação revalida o estado atual.
- Dois grupos distintos concorrem pela mesma primeira linha vazia: não há colisão, porque o lock cobre a planilha inteira.
- Responsável autorizado não altera grupo alheio; administrador usa autorização apropriada; submissão pública não recebe operação administrativa.
- Item alterado, removido ou inacessível cancela o lote inteiro antes de qualquer escrita.
- Reenvio confirmado usa o mesmo ID e retorna o resultado existente; reutilização do ID com hash diferente falha.
- Perda de resposta depois do envio do lote consulta ledger. Se a execução ainda for incerta, nenhuma repetição nova é aceita até reconciliação.
- Serviço indisponível, quota, lock esgotado, timeout ou resposta inválida resultam em erro controlado e nenhuma chamada direta alternativa.
- Edição manual e deployment antigo durante o corte são detectados ou bloqueados conforme política aprovada. Não recebem garantia enquanto fora do gateway.

### Limites e retorno

- 50 atas / 1,5 MiB e payload maior são avaliados sem escrever; o lote é único e rejeitado integralmente se ultrapassar o teto.
- Falha explícita de validação da API não marca operação como aplicada.
- Cenário de timeout após aceitação potencial não é tratado como falha definitiva nem como sucesso sem consulta ao ledger.
- Snapshot é restaurado apenas numa planilha de teste vazia/isolada; itens posteriores ao snapshot são preservados por UUID e `operacao_id`.

## Plano de verificação

1. Rodar testes unitários sintéticos para adaptadores, serialização, contrato e coordenação simulada.
2. Rodar `npm test`, `npm run lint` e `npm run build` no commit F1 preparado.
3. Validar o gateway em teste isolado, após provisionamento aprovado; não usar endpoint de produção.
4. Fazer leitura antes/depois na planilha exclusiva de teste e comparar UUIDs, totais, cabeçalhos e hashes de conteúdo.
5. Executar o roteiro de conflito controlado um cenário por vez; após resultado não esperado, parar e registrar `operacao_id`.
6. Demonstrar recuperação na planilha de teste e revalidar dados posteriores ao backup.
7. Atualizar a matriz requisito→tarefa→cenário→checkpoint e apresentar CP-01.

## Checkpoint CP-01

Aceite somente quando compatibilidade anterior e nova for demonstrada, todos os writers no corte estiverem cobertos, operações desconhecidas forem recuperáveis sem repetição cega, teste isolado confirmar escrita/leitura, e o retorno para versão compatível com os dados estiver comprovado. A aprovação do CP-01 não autoriza migração ou disponibilidade em produção; essas mudanças exigem procedimento e autorização próprios.

## Retorno da F1

1. Parar novos pedidos no gateway e manter o snapshot confirmado.
2. Voltar apenas para versão capaz de ler o esquema atual presente; nunca apontar leitor antigo estrito para cabeçalho novo.
3. Se dados de teste forem incompatíveis, recuperar somente a planilha exclusiva de teste. Não apagar colunas/linhas da planilha compartilhada para tentar reverter código.
4. Conferir ledger e diferenças por UUID antes de reabrir qualquer writer.
