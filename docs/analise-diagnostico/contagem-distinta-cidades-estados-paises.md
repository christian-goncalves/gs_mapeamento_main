# Diagnóstico da contagem de cidades, estados e países

## Objeto da investigação

Contagem dos cartões Cidades, Estados e Outros Países no relatório mensal do responsável.

## Contexto

A rota `/responsavel/relatorios?mes=10&ano=2026` exibe 1.558 cidades, 27 estados e 56 outros países. O responsável informou que cada cartão deve contar nomes distintos dentro do mês, sem somar ocorrências repetidas em atas diferentes.

## Evidências examinadas

- Página local autenticada em `/responsavel/relatorios?mes=10&ano=2026`, com os valores 1.558, 27 e 56.
- `src/app/relatorios/monthly-group-dashboard-data.ts`, funções de deduplicação e seleção das atas aprovadas do mês.
- `src/app/relatorios/monthly-group-dashboard.tsx`, associação dos cartões às métricas consolidadas.
- Anexo `Texto colado.txt`, com a coluna `localidade` fornecida pelo responsável.

## Estado observado

- O cálculo mensal considera atas ativas do grupo e mês selecionados; as métricas consolidadas usam as atas aprovadas.
- Estados são deduplicados por nome após `trim()` e conversão para minúsculas.
- Outros países são deduplicados pelo nome após a mesma normalização, excluindo `Brasil`.
- Cidades são deduplicadas pela combinação normalizada de localidade, estado e país.
- O anexo contém 4.860 valores de localidade não vazios, 3.139 nomes únicos após comparação sem diferenciar maiúsculas/minúsculas e 1.721 ocorrências repetidas além da primeira.

## Análise

O código não soma todas as ocorrências para os cartões de estados e países: usa conjuntos de nomes normalizados. Para cidades, também elimina a repetição da mesma combinação localidade/estado/país, mas pode contar o mesmo nome de localidade mais de uma vez quando estado ou país diferem. Isso não corresponde à regra confirmada pelo responsável, que define cidade pelo nome da localidade.

O anexo não inclui estado, país, mês nem status de aprovação. Portanto, seu total de nomes únicos não pode ser comparado diretamente ao valor 1.558 da rota, que é mensal e usa atas aprovadas. Se o anexo cobrisse exatamente o mesmo recorte, 3.139 nomes únicos não seriam compatíveis com 1.558 cidades; o escopo do anexo permanece indeterminado.

## Hipóteses avaliadas

- A métrica soma todas as ocorrências nas atas: descartada para estados e países, pois o código usa `Set`; também descartada para cidades, que igualmente usam `Set`.
- A métrica de cidades conta somente o nome localidade: descartada pelo código atual, que inclui estado e país na chave.

## Diagnóstico

Estados e países são contados como nomes distintos no mês. Cidades são contadas como combinações distintas de localidade, estado e país, não somente pelo nome da localidade. A implementação atual de cidades difere da regra declarada pelo responsável.

## Grau de certeza

Alto para as regras implementadas e para a diferença na deduplicação de cidades, pois ambas estão explícitas no código. Médio para a relação entre os 1.558 exibidos e a coluna colada, pois o anexo não informa o mesmo recorte mensal e de aprovação da rota.

## Pontos ainda não comprovados

Não é possível reconciliar o número 1.558 com os valores do anexo sem confirmar que a coluna veio das mesmas atas aprovadas de outubro de 2026 e ter os campos estado e país dessas linhas.
