# Diagnóstico da largura dos campos de data nos filtros de atas mobile

## Objeto da investigação

Investigar por que os campos “De” e “Até” aparentam se estender horizontalmente na página de histórico de atas em um aparelho iPhone.

## Contexto

O usuário apresentou duas capturas da rota de atas do Responsável e esclareceu que produção e desenvolvimento aparecem normais no desktop, inclusive com perfil de iPhone, enquanto o problema aparece no telefone físico. Na captura do iPhone, os campos exibem datas localizadas por extenso (“1 de nov. de 2026” e “2 de nov. de 2026”); na captura do Chrome DevTools em viewport de 400 px, exibem datas numéricas (“01/11/2026” e “02/11/2026”). A versão do iOS e do navegador móvel não está visível.

## Evidências examinadas

- Captura 1 fornecida na conversa: página “Histórico de Atas” aberta em iPhone; campos “De” e “Até” exibem datas localizadas por extenso lado a lado.
- Captura 2 fornecida na conversa: `/responsavel/atas` em Chrome DevTools, viewport de 400 × 700; campos exibem valores numéricos e permanecem dentro dos respectivos limites da grade.
- Esclarecimento do usuário: o mesmo comportamento visual normal é observado em produção e desenvolvimento no desktop; a divergência ocorre no telefone físico, que não está disponível para inspeção remota.
- `src/app/responsavel/atas/responsavel-atas-table.tsx:421-438`: os dois filtros são `<input type="date">` dentro da seção `.responsavel-atas-filters`.
- `src/app/globals.css:130-132`: a regra global aplica `width: 100%` e `padding: .7rem .75rem` a todos os inputs.
- `src/app/globals.css:747-750`: o cartão limita o conteúdo com `overflow: hidden`; os filtros usam grade com colunas `minmax(0, 1fr)`, os rótulos usam `min-width: 0`, e inputs/selects recebem `width: 100%` e `min-width: 0`.
- `src/app/globals.css:978`: abaixo de 720 px os filtros passam a duas colunas, também com `minmax(0, 1fr)`.
- `src/app/globals.css:989-1000`: há regras móveis específicas de aparência e largura para `.ata-date-input` do formulário de nova ata, mas essa classe e esse seletor não se aplicam aos filtros de histórico.
- Registro oficial do WebKit [bug 301648](https://bugs.webkit.org/show_bug.cgi?id=301648): descreve campos de data e outros controles temporais cuja largura `100%` é calculada incorretamente no iOS quando há padding. O registro identifica iOS 26/Safari 26 e informa reprodução no iOS, sem afetar desktop.
- Documentação do MDN sobre [`<input type="date">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date): o formato apresentado ao usuário varia conforme a localidade do navegador, embora o valor do controle permaneça normalizado como `yyyy-mm-dd`.

## Estado observado

O componente usa controles nativos `type="date"`. O CSS define larguras fluidas e limites mínimos reduzidos tanto para a grade quanto para os campos. A captura mobile do iPhone mostra a data em formato localizado e uma apresentação horizontal maior que a observada no Chrome DevTools. A captura de desktop emulado não reproduz o mesmo formato visual.

## Análise

A diferença do texto exibido é compatível com a formatação local do controle nativo, não com alteração do valor da data: o próprio componente recebe e atualiza strings de data nos campos, enquanto a aparência pode variar por navegador e sistema operacional.

A grade e os campos têm declarações explícitas para encolher (`minmax(0, 1fr)` e `min-width: 0`). O desktop, inclusive em perfil de viewport de iPhone, apresenta o controle normalmente nas duas versões do site. Isso indica que o breakpoint e o layout responsivo funcionam nesse ambiente, mas não representa o navegador e os controles nativos do telefone. O padding global alcança os campos `type="date"`; o relato oficial do WebKit descreve um erro de cálculo de largura no iOS para controles temporais com padding e largura `100%`. Essa coincidência torna a interação entre o controle nativo do iOS e o CSS atual uma hipótese plausível. Não demonstra, sem medidas do aparelho ou sua versão de sistema, que esse seja o mecanismo exato.

## Hipóteses avaliadas

- **O formato longo do texto é produzido pela localidade do controle nativo — sustentada.** A captura do iPhone contrasta com o valor numérico do Chrome DevTools, e o MDN documenta que o formato visível depende da localidade.
- **O problema é uma diferença entre o código de produção e o de desenvolvimento — enfraquecida.** Segundo o usuário, ambos aparecem normais no desktop, e o comportamento divergente só foi visto no telefone físico.
- **O campo cresce por falta de restrição no grid — enfraquecida.** CSS existente limita as colunas e os inputs; a simulação desktop também se mantém dentro da grade. As medidas computadas no iPhone não foram capturadas.
- **O comportamento vem do renderizador/controle nativo no iOS, possivelmente em interação com padding e `width: 100%` — hipótese plausível, ainda não confirmada no aparelho.** O CSS do projeto tem essa combinação, e o bug oficial do WebKit descreve erro semelhante no iOS 26.

## Diagnóstico

As evidências não apontam para diferença entre produção e desenvolvimento nem para falha do breakpoint: ambos se apresentam corretamente no desktop, mesmo com perfil de iPhone. A divergência aparece apenas no telefone físico, cujo navegador renderiza o controle de data de modo diferente da simulação desktop. O formato localizado é comportamento esperado do controle nativo; o alargamento pode envolver a renderização ou o cálculo de largura do `input[type="date"]` no iOS. O relato do WebKit sobre controles com padding e `width: 100%` é compatível com o CSS presente, mas não confirma que seja a causa neste aparelho.

## Grau de certeza

**Médio para a origem na renderização do navegador no telefone; baixo para o mecanismo exato.** A comparação entre desktop e telefone foi relatada pelo usuário, mas não há inspeção remota do aparelho, versão do sistema ou medições do controle físico.

## Pontos ainda não comprovados

- A versão do iOS e do navegador na captura do iPhone.
- A largura CSS e o retângulo visual dos inputs no aparelho.
- Se a ocorrência corresponde especificamente ao bug 301648 ou a outra diferença de renderização do controle nativo.
