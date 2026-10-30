# Diagnóstico do total de Conquistas no relatório do Responsável

## Objeto da investigação

Investigar por que o card `Total` da seção `Conquistas` em `/responsavel/relatorios?mes=9&ano=2026` exibe `85`, quando a soma das oito categorias visíveis é `57`.

## Contexto

A tela exibida é o relatório mensal do Responsável para setembro de 2026. O recorte fornecido mostra as categorias `30 dias`, `60 dias`, `90 dias`, `6 meses`, `9 meses`, `1 ano`, `18 meses` e `múltiplos anos`, além do card `Total`.

## Evidências examinadas

- Screenshot fornecido pelo usuário da seção `Conquistas` em `/responsavel/relatorios?mes=9&ano=2026`.
- `src/app/relatorios/monthly-group-dashboard-data.ts:180-205`, que soma as categorias e define `total` como `subtotal + ingressos`.
- `src/app/relatorios/monthly-group-dashboard-data.ts:270-273`, que calcula `totalIngressos` a partir de `sentAtas`.
- `src/app/relatorios/monthly-group-dashboard-data.ts:399`, que passa `totalIngressos` para o cálculo de `achievements`.
- `src/app/relatorios/monthly-group-dashboard.tsx:269-287`, que, no modo Responsável, renderiza as oito categorias e `data.achievements.total`, sem renderizar o card `Ingresso` nessa seção.
- `src/app/relatorios/monthly-group-dashboard.tsx:290-326`, que, no modo Admin, renderiza explicitamente `Ingresso`, as oito categorias, `Subtotal` e `Total`.
- `src/app/relatorios/monthly-group-dashboard-data.test.ts:187-201`, que testa o total do objeto compartilhado como subtotal de conquistas mais ingressos.
- Leitura HTTP somente leitura da rota local, que retornou `307` para `/login`; não houve leitura autenticada adicional da tela.
- A diretriz indicada em `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/` não estava disponível neste ambiente. O checkout atual possui `docs/README.md` e a especificação de apresentação do relatório.

## Estado observado

Na imagem, os valores visíveis são:

`3 + 6 + 6 + 9 + 8 + 8 + 6 + 11 = 57`.

O card `Total` exibe `85`. A diferença é `28`.

No código, as categorias visíveis são acumuladas em `rows`; `subtotal` é a soma dessas linhas. Em seguida, o objeto compartilhado define `total` como `subtotal + ingressos`.

No ramo visual do Responsável, são renderizados `data.achievements.rows` e `data.achievements.total`. Não existe, nesse ramo, uma linha ou card `Ingresso` que explique a parcela adicionada ao total.

No ramo Admin, `Ingresso` é renderizado antes das categorias, e o mesmo `total` é apresentado depois de `Subtotal`.

## Análise

O valor `57` é o subtotal das oito categorias de conquistas exibidas. O valor `85` é compatível com a fórmula atualmente implementada:

`85 = 57 + 28 ingressos`.

Portanto, o número exibido não resulta de uma soma incorreta das oito categorias. Ele resulta da reutilização, no layout do Responsável, de um total com semântica mais ampla, originalmente compatível com a tabela Admin, que inclui ingressos.

A inconsistência é de correspondência entre cálculo e apresentação: o cálculo inclui `Ingresso`, mas a apresentação do Responsável o oculta. Assim, o usuário vê oito parcelas que totalizam `57` e um total que inclui uma nona parcela não exibida.

## Hipóteses avaliadas

- **Total incluindo ingressos:** sustentada e confirmada pelo código em `monthly-group-dashboard-data.ts:195-204` e pelo uso de `totalIngressos` em `:399`.
- **Erro na soma das categorias de tempo limpo:** enfraquecida pelos valores da imagem; as oito categorias somam exatamente `57`, sem divergência interna.
- **Duplicação causada pelo filtro de setembro de 2026:** não sustentada pelo material examinado. O filtro mensal é aplicado antes do cálculo, e a diferença observada coincide exatamente com uma parcela de ingressos não exibida.

## Diagnóstico

O `Total` da seção `Conquistas` do relatório do Responsável está usando `subtotal + ingressos`. Em setembro de 2026, o subtotal visível é `57` e os ingressos contabilizados são `28`, produzindo `85`. Como o ramo Responsável não exibe `Ingresso` dentro dessa seção, o total aparenta estar errado.

O diagnóstico confirmado é uma inconsistência de semântica entre o total compartilhado e a composição visual específica do Responsável. Para a composição mostrada na imagem, o total coerente com as parcelas visíveis é `57`.

## Grau de certeza

Alto. A fórmula, a origem dos ingressos e os dois ramos de renderização estão demonstrados no código; a aritmética da imagem confirma a diferença de `28`. A tela autenticada não foi reaberta nesta execução porque a rota local redirecionou para `/login`, mas isso não limita a identificação da causa no código.

## Pontos ainda não comprovados

- Não foi feita uma leitura autenticada da rota para confirmar independentemente o valor `28` no card de Ingressos; ele é deduzido pela diferença `85 - 57` e pela fórmula observada.
- Não foi alterado código, teste, configuração ou dado externo nesta investigação.
