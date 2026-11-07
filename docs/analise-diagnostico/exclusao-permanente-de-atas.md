# Investigação da exclusão permanente de atas

## Objeto da investigação

Verificar se o sistema permite retirar uma ata excluída do histórico e do acesso do grupo, mantendo acesso administrativo ao registro, e avaliar como isso se relaciona com exclusão lógica e exclusão física.

## Contexto

A captura enviada mostra `/responsavel/atas?historico=1`, com uma ata marcada como “Excluída”. O menu de ações permite visualizar e abrir o PDF, enquanto “Excluir” aparece indisponível. A solicitação é investigar a possibilidade de uma exclusão permanente restrita ao administrador, sem implementar a funcionalidade nesta etapa.

## Evidências examinadas

- Captura de tela enviada na conversa: histórico de atas em viewport responsivo, com uma linha “Excluída” e menu de ações aberto.
- `src/lib/sheets/ata-lifecycle.ts:49-59, 363-394`: o ciclo de vida exige colunas de auditoria e a exclusão atual atualiza `status_registro` para `excluida`, registra motivo, ator e horários; não apaga a linha.
- `src/lib/sheets/schemas.ts:266-273` e `src/lib/sheets/contract-v2.ts:7-19, 57-58, 129-150`: o contrato aceita somente `ativa`, `substituida` e `excluida` em `status_registro`.
- `src/app/atas/ata-delete-action.tsx:47-59`: a confirmação atual declara que a exclusão retira a ata das listagens normais e preserva o registro e dados vinculados no histórico.
- `src/app/responsavel/atas/responsavel-atas-data.ts:47-73` e `src/app/responsavel/atas/page.tsx:57-62`: o histórico do grupo inclui registros não ativos, inclusive atas excluídas.
- `src/app/atas/[ataId]/page.tsx:26-36` e `src/lib/auth/access.ts:69-73`: a página de detalhe verifica acesso ao grupo, mas não bloqueia atas pelo estado do registro; o administrador pode acessar qualquer grupo.
- `src/app/atas/[ataId]/pdf/page.tsx:17-24`, `src/app/api/atas/[ataId]/pdf/route.ts:13-26` e `src/app/api/atas/[ataId]/pdf/email/route.ts:20-44`: visualização, download e envio do PDF também verificam o grupo, sem bloquear status excluído.
- `src/app/admin/atas/admin-atas-data.ts:46-64` e `src/app/admin/atas/page.tsx:24-29`: a listagem administrativa atual gera as atas enviadas a partir dos registros ativos.
- `src/domain/aggregate.ts:84-99, 211-237, 269-288`: as atas são registros-pai referenciados por linhas de servidores, participação, visitantes, ingressos e trocas; referências sem ata válida são diagnosticadas e filtradas da agregação.
- `docs/README.md`: aponta documentação local de refatoração visual. O caminho de documentação informado nas instruções do agente (`/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`) não está presente neste ambiente.

## Estado observado

- A exclusão disponível hoje é lógica: o registro permanece na aba de atas e recebe o status `excluida`, além de motivo e metadados de auditoria.
- A ata excluída permanece no histórico do grupo.
- O grupo que já tem acesso à ata consegue abrir a página de detalhe e recursos de PDF de uma ata excluída se obtiver seu identificador. O acesso direto é condicionado ao grupo, não ao status de exclusão.
- A listagem administrativa principal não inclui atas excluídas. A página de detalhe aceita qualquer registro encontrado e permite ao administrador atravessar a verificação de grupo, mas isso não fornece uma lista administrativa para localizar os registros.
- Um novo valor para `status_registro` não é aceito pelo schema atual. A linha que o contiver deixa de satisfazer o contrato de ata atual.
- Os dados relacionados à ata são armazenados em outras linhas e referenciados por `ata_id`; a exclusão física somente da linha-pai deixaria referências sem ata válida para a agregação.

## Análise

O sistema já tem retenção de registros e trilha de auditoria para a exclusão atual; portanto, o objetivo de preservar a ata para administração é compatível com o modelo de dados existente. A barreira principal não é persistência, e sim a separação de visibilidade: o histórico do responsável, o detalhe da ata e os endpoints de PDF não diferenciam hoje uma ata excluída que ainda pode ser consultada pelo grupo de uma ata que deveria ficar restrita à administração.

A listagem administrativa também não resolve essa separação atualmente, pois apresenta somente atas ativas. Assim, o estado pode estar preservado e ser alcançável por um administrador que conheça o identificador, mas não está disponível como histórico administrativo navegável.

A exclusão física da linha-pai não equivale a ocultar o registro do grupo mantendo recuperação administrativa. Além de remover a trilha do próprio registro, ela deixa dados dependentes com referências órfãs, salvo se todos os registros relacionados também forem tratados. Os dados examinados não demonstram política de retenção ou recuperação para esse tipo de remoção física.

## Hipóteses avaliadas

- **Incluir um novo literal apenas em `status_registro`:** incompatível com o contrato atual, que valida uma enumeração fechada de três estados. Se persistido sem atualização do schema, o registro não seria tratado como uma ata válida.
- **Remover fisicamente somente a linha da ata:** não preserva o requisito de consulta administrativa e conflita com as referências de dados vinculados observadas na agregação.
- **Manter o registro e separá-lo do acesso comum:** compatível em princípio com a persistência atual, mas o comportamento completo não existe hoje; detalhes, PDF e lista administrativa também precisam respeitar a distinção de acesso.

## Diagnóstico

A ideia é tecnicamente viável e faz sentido como retenção administrativa com restrição de acesso. O sistema já implementa exclusão lógica e mantém os dados, mas ainda expõe atas excluídas ao grupo por rotas diretas e não oferece uma listagem administrativa própria para encontrá-las. A exclusão física não atende simultaneamente aos requisitos de retenção administrativa e integridade dos dados relacionados.

## Grau de certeza

Alto quanto ao comportamento atual e à compatibilidade geral com retenção lógica: schema, persistência, listagem e verificações de acesso foram inspecionados diretamente. Médio quanto a impactos operacionais de eventual exclusão física, pois não foi examinada a planilha ativa nem eventual rotina externa de backup ou retenção.

## Pontos ainda não comprovados

- Não foi examinada a planilha Google Sheets ativa nem o número e conteúdo dos registros relacionados a uma ata específica.
- A política de auditoria, retenção legal e restauração de dados não está documentada nas fontes disponíveis nesta investigação.
- A documentação referenciada em `AGENTS.md` não estava no caminho informado; os arquivos locais disponíveis foram usados para delimitar a investigação.
