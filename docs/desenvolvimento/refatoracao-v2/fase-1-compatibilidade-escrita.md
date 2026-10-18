# F1 — Compatibilidade e fundamento de escrita

## Estado e autorização

F1 autorizada pelo usuário em 16/10/2026, após conferência do CP-00. Execução iniciada com inventário e trabalho local. O usuário autorizou usar a planilha compartilhada por DEV/PROD como alvo da validação F1. Antes de qualquer escrita, devem ser concluídos e registrados backup/export, confirmação do alvo e procedimento de recuperação; escrita de teste limitada ao escopo F1. A arquitetura escolhida é o gateway Apps Script único descrito nas [evidências F0](evidencias-f0-2026-10-16.md). Esta autorização não inclui publicação do Apps Script nem ativação de funcionalidades.

Em 16/10/2026, após a gravação no-op confirmada, o usuário decidiu que as pendências operacionais do CP-01 não devem bloquear o desenvolvimento local da F2. CP-01 permanece gate para novas gravações reais em Sheets, migração, cutover, publicação e ativação. A autorização para escrever na planilha compartilhada cobriu somente a validação F1 já registrada; não autoriza gravações de negócio da F2. O andamento está no [checklist](checklist-execucao.md) e nas [evidências F1](evidencias-f1-2026-10-16.md).

## Objetivo e limites

Preparar localmente leitores, serializadores e escritores para uma transição compatível entre o contrato atual e o contrato V2, preservando o comportamento e os dados existentes. O teste no-op já comprovou o caminho mínimo do Gateway; isolamento, retorno operacional e coordenação ampla continuam como gate antes de novas gravações reais e cutover, sem bloquear implementação local de fases seguintes.

F1 não habilita revisão, aprovação, edição versionada, exclusão lógica, nova interface, mudança de indicador ou migração de dados. Nenhuma funcionalidade incompleta fica acessível ao usuário. Excepcionalmente, o usuário autorizou testar F1 na planilha compartilhada por DEV/PROD; ela não é um ambiente isolado e qualquer escrita afeta o mesmo arquivo usado por ambos. A autorização não inclui publicação do gateway ou ativação de funcionalidades.

## Pré-condições

1. CP-00 aceito, com schema físico e arquitetura de coordenação registrados.
2. Conta responsável pelo gateway e modo de autenticação aprovados; quotas e monitoramento verificados.
3. Cutover aprovado: writers antigos, scripts administrativos e edição manual mapeados, suspensos ou explicitamente delimitados.
4. **Exceção autorizada pelo usuário em 16/10/2026:** a planilha compartilhada de DEV/PROD pode ser usada para validação F1. Confirmar título/metadados no momento da operação e manter a escrita dentro dos cenários autorizados desta fase.
5. Backup/export e procedimento de recuperação concluídos e registrados antes da primeira escrita.
6. Nenhum uso do valor local `GOOGLE_SHEETS_ID` como prova suficiente do alvo; confirmar título/metadados no momento da operação.

As pré-condições de ambiente, backup, alvo e coordenação aplicam-se a novas operações reais em Sheets. Enquanto estiverem pendentes, pode-se continuar desenvolvimento local, testes sintéticos e revisão de código. A autorização para o teste F1 na planilha compartilhada não autoriza gravações de negócio da F2, migração, publicação ou ativação.

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
| F10-T08 | Registrar o gate operacional CP-01 e as pendências para futuras gravações reais, migração/cutover e ativação. | Checklist e documentação V2 | CP-01 permanece aberto para operações reais; desenvolvimento local da F2 pode avançar. |

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

CP-01 não é pré-requisito para desenvolvimento local da F2. Antes de qualquer nova gravação real, migração ou cutover, exige-se comprovar compatibilidade do contrato relevante, autorização/guard e leitura posterior da operação específica, além de identificar o alvo e seu retorno seguro. A coordenação de todos os writers e a restauração isolada permanecem necessárias antes de habilitar o fluxo compartilhado de forma ampla. CP-01 não autoriza por si só migração, publicação ou ativação; essas ações exigem procedimento e autorização próprios.

## Retorno da F1

1. Parar novos pedidos no gateway e manter o snapshot confirmado.
2. Voltar apenas para versão capaz de ler o esquema atual presente; nunca apontar leitor antigo estrito para cabeçalho novo.
3. Se dados de teste forem incompatíveis, recuperar somente a planilha exclusiva de teste. Não apagar colunas/linhas da planilha compartilhada para tentar reverter código.
4. Conferir ledger e diferenças por UUID antes de reabrir qualquer writer.
