# Diagnóstico dos cabeçalhos das tabelas no relatório mobile

## Objeto da investigação

Verificar por que os cabeçalhos das tabelas “Servidores” e “Consolidados por Reunião” quebram em telas estreitas e medir o efeito de reduzir em 20% as fontes das duas tabelas abaixo de 500 px.

## Contexto

Investigação visual no relatório do Responsável em 2026-11-01, usando o Playwright na rota local `/responsavel/relatorios`. Foram examinadas larguras de viewport de 430 px e 500 px. A proposta de redução foi simulada temporariamente no navegador e removida após a medição; nenhum arquivo de interface foi alterado.

## Evidências examinadas

- `src/app/globals.css:1535-1570`: padding, `overflow-wrap: anywhere` e tamanhos base das fontes para as células e cabeçalhos das duas tabelas.
- `src/app/globals.css:1590-1603`: regras responsivas existentes em `max-width: 600px`.
- `src/app/globals.css:1625-1632`: regras posteriores de tamanho para células do corpo.
- `src/app/relatorios/monthly-group-dashboard.tsx:88-106`: estrutura e cabeçalhos da tabela de Servidores.
- `src/app/relatorios/meeting-results-section.tsx:50-59`: estrutura e texto dos cabeçalhos de Consolidados por Reunião, incluindo quebras explícitas após “Presenças”.
- Playwright, viewport 500 px: tabela de Servidores com 427 px de largura; seus cabeçalhos mediram 35,45 px de altura. A tabela de Consolidados por Reunião mediu 427 px; cabeçalho mais alto de 51,72 px.
- Playwright, viewport 430 px: ambas as tabelas mediram 357 px. Os cabeçalhos de Servidores mediram 35,45 px; o cabeçalho de Consolidados por Reunião chegou a 67,98 px.
- Playwright, estilos temporários de fonte a 80% do tamanho computado, viewport 500 px: o cabeçalho de Servidores mediu 32,19 px; o de Consolidados por Reunião, 45,19 px. As fontes computadas passaram de 13,01 px para 10,41 px nos cabeçalhos e de 14,93 px para 11,95 px nas células do corpo.
- Playwright, estilos temporários de fonte a 80%, viewport 430 px: o cabeçalho de Consolidados por Reunião passou de 67,98 px para 45,19 px; o de Servidores passou de 35,45 px para 32,19 px.

## Estado observado

O CSS atual aplica `overflow-wrap: anywhere` e padding vertical de 9,6 px às células. O cabeçalho de Consolidados por Reunião inclui uma quebra explícita depois de “Presenças”.

Há uma regra de fonte de `.7rem` para as tabelas dentro de `max-width: 600px`, mas os tamanhos mais específicos e posteriores de `thead th` e das células do corpo vencem essa regra no navegador. Em 500 px, o Playwright ainda computou 13,01 px nos cabeçalhos e 14,93 px no corpo. O CSS não tem um breakpoint dedicado em 500 px.

Na simulação de 20%, o cabeçalho consolidado ficou menor nos dois viewports, com um ganho particularmente visível em 430 px. O cabeçalho de Servidores também encolheu, mas menos. A altura das linhas não caiu na mesma proporção que a fonte: o padding permaneceu fixo.

## Análise

A causa demonstrada da escala mobile não corresponder à regra `.7rem` é a cascata: seletores com maior especificidade e regras posteriores definem novamente a fonte. Isso explica por que os valores atuais do navegador permanecem em 13,01 px e 14,93 px mesmo abaixo de 600 px.

A quebra do cabeçalho consolidado é sensível à largura e à redução da fonte. Em 430 px, reduzir todas as fontes em 20% diminuiu a altura observada de 67,98 px para 45,19 px; em 500 px, de 51,72 px para 45,19 px. A diferença entre os resultados decorre da mudança de linha do texto, portanto não se pode extrapolar uma redução de altura fixa para todas as larguras.

## Hipóteses avaliadas

- **Uma redução de 20% melhora a leitura do cabeçalho consolidado em telas abaixo de 500 px — sustentada pela simulação.** O cabeçalho reduziu sua altura observada em 6,53 px a 500 px e em 22,80 px a 430 px.
- **A mesma redução corta em 20% a altura das linhas — descartada.** A tipografia foi reduzida em 20%, mas o padding vertical fixo limitou a redução medida das alturas.
- **A regra mobile existente já está diminuindo as fontes das duas tabelas — descartada pela medição.** Os estilos computados não refletem `.7rem` nos cabeçalhos nem no corpo.

## Diagnóstico

A proposta de reduzir as fontes em 20% melhora de forma mensurável o cabeçalho de “Consolidados por Reunião”, sobretudo perto de 430 px. Em 500 px, a melhora de altura é mais discreta. A tabela de Servidores também fica um pouco mais compacta, mas seu cabeçalho já ocupa uma única linha nessa faixa. O CSS responsivo atual não está aplicando a redução de fonte prevista porque regras mais específicas a sobrescrevem.

## Grau de certeza

**Alto** para os tamanhos e alturas medidos e para a precedência observada no navegador. **Médio** para o julgamento de suficiência visual: a simulação demonstrou a geometria nos viewports medidos, mas a percepção de legibilidade precisa ser confirmada na tela física pretendida.

## Pontos ainda não comprovados

- A legibilidade percebida de 10,41 px nos cabeçalhos e 11,95 px no corpo em aparelho físico.
- O comportamento em larguras abaixo de 430 px e em dados de tabela com textos mais longos.
