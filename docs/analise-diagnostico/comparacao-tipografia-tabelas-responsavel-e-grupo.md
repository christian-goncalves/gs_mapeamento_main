# Diagnóstico de tipografia em tabelas do Responsável e do grupo

## Objeto da investigação

Comparar, no código-fonte, os tamanhos de fonte entre colunas e células nas rotas `/responsavel/atas`, `/responsavel/relatorios` e `/grupos/[grupoId]`, incluindo as larguras abaixo e a partir de 500 px quando aplicável.

## Contexto

Foi relatada a impressão de que valores de data e de outras colunas de dados aparecem maiores que os rótulos da primeira coluna. A solicitação foi verificar as regras no código, sem usar o navegador como fonte da conclusão.

O `AGENTS.md` fornecido aponta para `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs`, caminho que não existe neste ambiente. Foram consultados os documentos disponíveis em `docs/` no checkout atual, incluindo `docs/LAYOUT-TIPOGRAFIA.md`.

## Evidências examinadas

- `src/app/globals.css:13` define a fonte base do `body` em 16 px; as expressões com `rem` e `pt` abaixo são calculadas com essa base.
- `src/app/responsavel/atas/responsavel-atas-table.tsx:262-270,571-578` identifica as colunas Ata e Data e sua ordem.
- `src/app/globals.css:1986-2022,2632-2650,2710-2755,2758-2807` contém a tipografia-base e os breakpoints da tabela de atas do Responsável.
- `src/app/responsavel/relatorios/page.tsx:64-77` passa `showResponsavelHeader` ao dashboard desta rota.
- `src/app/relatorios/monthly-group-dashboard.tsx:87-119,165-208,210-215` define a tabela Servidores e a seção Consolidado como cartões, e inclui a seção de Consolidados por Reunião.
- `src/app/relatorios/meeting-results-section.tsx:50-127,157-167` define a tabela de Consolidados por Reunião para o perfil Responsável.
- `src/app/globals.css:1632-1652,1671-1686,1708-1715,1722-1799` define os tamanhos das tabelas do relatório e suas regras responsivas.
- `src/app/grupos/[grupoId]/page.tsx:20-54` carrega o `GroupEditor` na variante `responsavel`.
- `src/app/grupos/group-editor.tsx:321-348,872-889,962-973` define a tabela-resumo de Servidores e a inclusão do editor de Horários de Reunião.
- `src/app/grupos/group-schedules-editor.tsx:191-216,393-450,452-538` define a escolha entre tabela-resumo e tabela de gerenciamento de horários.
- `src/app/globals.css:2403-2436,2478-2490,2907-2942` define tipografia e breakpoints das tabelas da página de configurações do grupo.

## Estado observado

- Na tabela de atas, as células de Ata e Data têm regras distintas; Data recebe valor maior nos dois breakpoints.
- Na tabela Servidores do relatório, o nome do encargo é uma célula `tbody th`; Nome e Desde são células `tbody td`.
- A seção chamada Consolidado nessa rota é um conjunto de cartões de métricas, não uma tabela.
- A tabela chamada Consolidados por Reunião tem uma célula de rótulo da linha (`tbody th`) e células de valores (`tbody td`).
- Na configuração do grupo, a tabela-resumo de Servidores e a tabela-resumo de Horários de Reunião usam `tbody th` para rótulos da linha e `tbody td` para dados.
- No modo de gerenciamento de horários, a célula Dia é um `td` com classe `schedule-day-cell`; não é um `th` de rótulo.

## Análise

Na rota `/responsavel/atas`, o CSS define a célula Ata (`td:first-child`) em 14,9333 px e a célula Data (`td:nth-child(2)`) em 17,3333 px para larguras a partir de 500 px. Abaixo de 500 px, as regras específicas definem Ata em 11,2 px e Data em 12,5 px. Portanto, Data é maior por 2,4 px no breakpoint largo e 1,3 px no estreito.

Os cabeçalhos dessa tabela também diferem a partir de 500 px: Ata é reduzida a 11,5 px; Data conserva 13,0133 px. Abaixo de 500 px, a regra geral do cabeçalho fixa ambas em 11,5 px.

Na tabela Servidores de `/responsavel/relatorios`, os cabeçalhos permanecem em 13,0133 px. As células de rótulo de encargo (`tbody th`) usam `calc(.85rem + 1pt)`, equivalente a 13,6 px; as células Nome e Desde (`tbody td`) usam `calc(1rem + 1pt)`, equivalente a 17,3333 px. Há uma regra anterior de redução para telas de até 600 px, mas as declarações posteriores em `globals.css:1708-1715` restabelecem os dois tamanhos da escala em todas as larguras.

A seção Consolidado da rota de relatórios usa rótulos de cartão em 11 px e números em `1.875rem` (30 px na base de 16 px). A diferença é entre rótulo e métrica, não entre colunas de uma tabela.

Na tabela Consolidados por Reunião, os rótulos de dia (`tbody th`) também usam 13,6 px e os valores (`tbody td`) 17,3333 px. Os cabeçalhos são 13,0133 px, salvo o cabeçalho compacto abaixo de 361 px: nessa variante, os rótulos agrupados usam 11,2 px e as subcolunas Total/Média usam 10,4 px. A redução genérica para telas de até 600 px é superada pela escala de corpo declarada posteriormente.

Na tabela-resumo de Servidores de `/grupos/[grupoId]`, Encargo usa 14,9333 px e os dados Servidor/Desde usam 17,3333 px a partir de 500 px. Abaixo de 500 px, ficam em 11,2 px e 12,5 px, respectivamente. Os cabeçalhos são 13,0133 px a partir de 500 px e 11,5 px abaixo disso.

Na tabela-resumo de Horários de Reunião, Dia usa 14,9333 px e os horários usam 17,3333 px a partir de 500 px; abaixo de 500 px, usam 11,2 px e 12,5 px. O cabeçalho não recebe redução tipográfica específica para mobile e permanece em 13,0133 px.

O editor de horários inicia no modo de resumo quando há horários ativos (`activeRows.length > 0`) e no modo de edição quando não há horários ativos. No modo de edição, Dia, Hora de Início e Hora de Término são `td` com 17,3333 px em todas as larguras. A regra de Dia altera apenas peso para negrito e alinhamento, não o tamanho.

## Diagnóstico

A impressão está confirmada pelo código nas tabelas de visualização: valores de dados têm fonte maior que os rótulos da primeira coluna. Na tabela `/responsavel/atas`, Data é maior que Ata tanto abaixo de 500 px quanto a partir de 500 px. O mesmo padrão aparece nas tabelas Servidores e Consolidados por Reunião do relatório e nas tabelas-resumo Servidores e Horários de Reunião da página do grupo.

Há duas distinções importantes: a seção Consolidado do relatório é composta por cartões e não por uma tabela; e, no modo de edição de Horários de Reunião, a célula Dia tem o mesmo tamanho de fonte das demais células de dados, apenas com peso maior.

## Grau de certeza

Alto para os valores configurados no CSS: as regras aplicáveis estão explícitas e os breakpoints e seletores foram rastreados até a marcação JSX. Não foi feita medição de estilos computados em navegador, conforme o escopo solicitado.

## Pontos ainda não comprovados

- O tamanho computado em uma sessão específica do navegador não foi medido. A conclusão registra os valores declarados no código e a precedência entre as regras CSS examinadas.
- Na página do grupo, o modo visível do editor de horários depende da existência de horários ativos; foram documentadas as regras dos dois modos.
