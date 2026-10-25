# Diagnóstico do alinhamento entre o menu e o cabeçalho do Responsável

## Objeto da investigação

Verificar se o texto “GS Mapeamento” do menu está deslocado para cima ou se o rótulo “Relatórios” está deslocado para baixo, e determinar se o alinhamento pode ser ajustado de forma compartilhada nas páginas de Configurações, Histórico de Atas e Relatórios.

## Contexto

A comparação foi solicitada a partir da interface visível do GS Mapeamento, especialmente da navegação lateral do Responsável e do cabeçalho das páginas que exibem o nome do grupo.

## Evidências examinadas

- `src/app/globals.css:589-606`: estrutura visual compartilhada do layout, sidebar, marca e área principal.
- `src/app/globals.css:665-667`: estilo compartilhado de `.responsavel-page-header` e seus títulos.
- `src/app/globals.css:837-868` e `src/app/globals.css:995-996`: ajustes responsivos compartilhados.
- `src/app/grupos/group-editor.tsx:757-762`: cabeçalho de Configurações.
- `src/app/responsavel/atas/page.tsx:65-68`: cabeçalho de Histórico de Atas.
- `src/app/relatorios/monthly-group-dashboard.tsx:129-136`: cabeçalho do relatório verde.
- `src/app/responsavel/relatorios-azul/page.tsx:24-30`: cabeçalho separado do relatório azul.
- Captura visual da rota local `/responsavel/relatorios`: o texto “RELATÓRIOS” aparece abaixo da altura visual do texto “GS Mapeamento”.

## Estado observado

- O menu lateral é renderizado pelo `AppShell` e usa a mesma estrutura para o Responsável.
- A marca “GS Mapeamento” está dentro de `.responsavel-brand`.
- O conteúdo das páginas usa `.responsavel-main`.
- Configurações, Histórico de Atas e o relatório verde usam `.responsavel-page-header`.
- O rótulo de seção é um `<p class="eyebrow">` antes do `<h1>`.
- `.eyebrow` define cor, tamanho, peso e espaçamento entre letras, mas não redefine `margin`.
- O relatório azul usa `.responsavel-relatorios-azul-demo-header`, portanto não compartilha integralmente o cabeçalho das três páginas regulares.

## Análise

Na versão desktop, a sidebar recebe `padding: 1.5rem 1rem`, enquanto a área principal recebe `padding: 2.5rem 1.75rem`. Portanto, a área do conteúdo começa 1rem abaixo da área interna inicial do menu.

Além disso, o primeiro elemento do cabeçalho é um parágrafo `.eyebrow` sem margem explicitamente zerada. A margem vertical padrão de um `<p>` aumenta o deslocamento inicial do bloco do cabeçalho. A combinação desses dois fatores explica por que “Relatórios” aparece visualmente abaixo de “GS Mapeamento”; não há evidência de que a marca do menu esteja usando `top`, `transform` ou outra posição que a desloque para cima.

Configurações, Histórico de Atas e o relatório verde usam exatamente o mesmo seletor estrutural `.responsavel-page-header`, com o mesmo `.responsavel-page-header h1`. Isso torna viável um ajuste compartilhado para as três páginas, sem alterar margem individual em cada página.

## Hipóteses avaliadas

- **“GS Mapeamento está deslocado para cima”: enfraquecida.** A marca está em um bloco comum com padding e altura mínima definidos; não há deslocamento posicional específico identificado.
- **“Relatórios está deslocado para baixo por offsets do conteúdo”: sustentada.** A diferença de padding entre sidebar e conteúdo e a margem não redefinida do primeiro `<p>` são compatíveis com a captura e com o CSS.
- **“É necessário ajustar cada página separadamente”: descartada para Configurações, Histórico de Atas e relatório verde.** As três páginas compartilham o mesmo cabeçalho.
- **“O relatório azul será automaticamente afetado”: descartada.** O cabeçalho azul possui uma classe própria e regras tipográficas próprias.

## Diagnóstico

O desalinhamento principal está no cabeçalho do conteúdo, que começa mais abaixo em relação à marca do menu. É viável alinhar Configurações, Histórico de Atas e o relatório verde por meio do estilo compartilhado do cabeçalho, sem mexer página por página. O relatório azul é uma exceção estrutural e precisaria ser considerado separadamente caso também deva seguir o mesmo alinhamento.

## Grau de certeza

Alto para a viabilidade de um ajuste compartilhado e médio-alto para a causa estrutural. A conclusão combina a captura visual com os seletores e espaçamentos efetivamente usados; não foi feita medição pixel a pixel por DevTools nesta investigação.

## Pontos ainda não comprovados

- A diferença exata em pixels entre o topo visual de “GS Mapeamento” e “Relatórios” em cada viewport.
- Se o alinhamento desejado deve valer também para o cabeçalho azul separado e para as versões responsivas em que a sidebar vira barra superior.
