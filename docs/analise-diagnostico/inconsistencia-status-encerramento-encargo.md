# Inconsistência no status de encerramento de encargo

## Objeto da investigação

Investigar por que a ação de corrigir o encerramento é oferecida para um encargo apresentado como encerrado, mas retorna “Somente encargos encerrados podem ser corrigidos.”

## Contexto

A captura enviada mostra a tela Histórico de Encargos do grupo `8806319f-dd2d-4b67-9416-ab42bb991870`. Na linha de Carlão, a situação está como “Encerrado”, as colunas “Até” e “Motivo do encerramento” estão vazias, e a tentativa de correção exibe a mensagem de erro.

## Evidências examinadas

- Captura de tela enviada nesta conversa: linha `RSG – Carlão`, status “Encerrado”, sem data final e sem motivo; diálogo de correção com a mensagem apresentada.
- `src/app/grupos/mesa-servers-history.tsx`, linhas 60–88: a situação e a ação de correção são determinadas por `!item.ativo`.
- `src/lib/sheets/group-admin.ts`, linhas 854–869: a função de correção rejeita o registro quando `ativo` é verdadeiro **ou** quando `data_encerramento` não existe.
- `src/app/grupos/mesa-server-closure-dialog.tsx`, linhas 68–81 e 116–135: ao abrir a correção, a data inicial usa `item.data_encerramento` ou, se ausente, a data de hoje.
- `src/lib/sheets/schemas.ts`, linhas 198–224: o esquema aceita `data_encerramento` e `motivo_encerramento` ausentes, sem exigir que registros inativos tenham esses campos preenchidos.

## Estado observado

- O registro mostrado na captura é renderizado como encerrado e recebe o botão para corrigir.
- A captura mostra que esse registro não apresenta data de encerramento nem motivo.
- Ao tentar corrigir, a interface apresenta literalmente “Somente encargos encerrados podem ser corrigidos.”

## Análise

A tela usa somente o campo `ativo` para classificar o registro: `!item.ativo` resulta em “Encerrado” e também libera o botão. A operação de correção aplica uma condição mais restritiva: além de exigir `ativo = false`, exige `data_encerramento` preenchida. Portanto, um registro inativo sem data aparece encerrado na tabela, mas é rejeitado no servidor.

O formulário preencher a data de hoje quando a data do registro está ausente não satisfaz essa validação: a função consulta o registro já persistido antes de aplicar os dados submetidos. Isso explica por que a data visível no diálogo não impede a mensagem.

## Diagnóstico

Há uma inconsistência entre os critérios de status da tela e de elegibilidade da operação. No registro de Carlão mostrado, `ativo = false` faz a interface exibi-lo como encerrado, mas a ausência de `data_encerramento` faz a função de correção rejeitá-lo. O código e a captura explicam a mensagem observada.

## Grau de certeza

Alto para a causa da mensagem e da divergência de interface: a condição está explícita no código e corresponde aos campos visíveis na captura.

## Pontos ainda não comprovados

O valor bruto da linha correspondente na planilha não foi consultado nesta investigação. A captura demonstra os valores apresentados pela aplicação; não comprova por si só a origem ou o histórico que deixou o registro inativo sem data de encerramento.
