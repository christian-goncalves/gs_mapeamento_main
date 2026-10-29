# Plano executivo da Fase 1: refatoração visual do relatório verde

**Execução em uma única etapa de trabalho para aplicar a tipologia visual aprovada somente a `/responsavel/relatorios`.**

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Status**     | Plano para execução, sem implementação iniciada                 |
| **Responsável**| Responsável pelo projeto e pessoa implementadora                 |
| **Escopo**     | Apresentação do relatório real do Responsável                   |
| **Fora do escopo** | Rota azul, Admin, atas, shell, menu, navegação, autenticação, backend, Google Sheets, regras de negócio e breakpoints |
| **Relacionado**| [Roteiro de refatoração](../roteiro-de-refatoracao.md) e [especificação da Fase 1](../especificacao/fase-1-relatorio-verde.md) |
| **Público**    | Responsável pelo projeto, implementador e revisor visual         |

---

## 1. Decisão executiva

A Fase 1 deve ser executada como uma única etapa controlada, com pré-verificação, alteração visual local, testes automatizados, validação autenticada com Playwright e inspeção do PDF produzido. A alteração de apresentação prevista para a aplicação deve ficar concentrada em `src/app/globals.css`, usando os hooks semânticos que já existem para o modo Responsável. O código de rota, dados, componentes funcionais e regras de negócio permanecem inalterados.

O resultado só poderá avançar para preview ou produção depois do gate final deste plano. A captura emulada como impressão será tratada como uma evidência diferente do arquivo PDF gerado. Nenhuma das duas será considerada suficiente isoladamente para afirmar que a paginação física está correta.

### 1.1 Resultado esperado

- `/responsavel/relatorios` recebe os tokens e padrões visuais da especificação da Fase 1.
- O relatório continua dinâmico, autorizado e alimentado por dados reais.
- Os parâmetros `mes` e `ano`, a expansão por dia da semana, estados vazios, fluxo de impressão e demais comportamentos existentes permanecem operacionais.
- Os breakpoints atuais do relatório verde permanecem nos mesmos limites.
- `/responsavel/relatorios-azul` permanece sem alteração de código, CSS ou dados.
- O diff de implementação não alcança shell, menu, navegação, Admin ou outras páginas.

### 1.2 Não objetivos

Não fazem parte desta etapa:

- trocar a fonte de dados, fixture azul ou conteúdo do HTML externo;
- alterar `buildMonthlyDashboardData`, autorização, sessão, redirecionamentos ou query params;
- mudar agrupamento por dia da semana, cálculos, labels, ordenação, expansão ou paginação;
- revelar, remover ou recriar ícones por decisão não descrita na especificação;
- importar os breakpoints da rota azul;
- mudar o PDF de atas ou qualquer fluxo de PDF fora do botão de impressão deste relatório;
- publicar, ativar, fazer preview ou fazer deploy.

## 2. Fatos verificados e fontes

Os fatos abaixo foram verificados no checkout atual. A especificação cita o commit `37fbbf2`; o HEAD atual é `4c3ac1b`. A comparação `37fbbf2..HEAD` contém o checkpoint de documentação, referência visual e capturas, sem alteração nos arquivos-fonte do relatório. A execução deverá repetir essa conferência antes de qualquer edição, pois o estado do Git é temporal.

| Fato verificado | Evidência |
| --- | --- |
| `AGENTS.md` orienta seguir os documentos de `docs/`, mas aponta para `/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`, que é outro checkout e está ausente. | [`AGENTS.md`](../../../AGENTS.md), linhas 1-11; verificação de existência do caminho em 29/10/2026: ausente. |
| `GEMINI.md` também aponta para outro checkout, no arquivo `docs/desenvolvimento/diretrizes-agentes.md`, que não existe neste checkout. | [`GEMINI.md`](../../../GEMINI.md), linhas 1-11; verificação de existência do caminho em 29/10/2026: ausente. |
| O índice atual lista o roteiro e a especificação, sem pasta de planejamento existente antes deste documento. | [`docs/README.md`](../../README.md), linhas 1-2. |
| O roteiro restringe o primeiro ciclo ao relatório verde, mantém dados e comportamento e exclui mudança de breakpoints. | [`roteiro-de-refatoracao.md`](../roteiro-de-refatoracao.md), linhas 1-191. |
| A especificação define a precedência visual, os tokens, o mapeamento de componentes, os contratos preservados e o gate visual. | [`fase-1-relatorio-verde.md`](../especificacao/fase-1-relatorio-verde.md), linhas 1-159. |
| A rota real é dinâmica, exige sessão autorizada, redireciona Administrador para `/admin/grupos`, lê `mes` e `ano` e passa `showResponsavelHeader`. | [`src/app/responsavel/relatorios/page.tsx`](../../../src/app/responsavel/relatorios/page.tsx), linhas 13-94. |
| O dashboard compartilhado usa `showResponsavelHeader` para compor o cabeçalho, filtros, servidores, consolidado, resultados agrupados, conquistas e rodapé do Responsável. | [`monthly-group-dashboard.tsx`](../../../src/app/relatorios/monthly-group-dashboard.tsx), linhas 71-170 e 217-342. |
| O relatório real usa a tabela agrupada por domingo a sábado e, nesse ramo, não renderiza a paginação do componente compartilhado. | [`meeting-results-section.tsx`](../../../src/app/relatorios/meeting-results-section.tsx), linhas 34-103 e 130-140. |
| A paginação de `10`, `25`, `50` e `Todo o período` existe no ramo não agrupado do componente compartilhado e não deve ser remodelada nesta Fase 1. | [`meeting-results-section.tsx`](../../../src/app/relatorios/meeting-results-section.tsx), linhas 8-13 e 143-223. |
| Os filtros mantêm `mes` e `ano` e submetem automaticamente o formulário com `requestSubmit()`. | [`dashboard-filters.tsx`](../../../src/app/relatorios/dashboard-filters.tsx), linhas 22-24 e 45-95. |
| A origem dos dados de mês, conquistas, servidores e resultados por dia e horário é `buildMonthlyDashboardData`; atas pendentes entram no agrupamento do Responsável, enquanto os consolidados usam atas aprovadas. | [`monthly-group-dashboard-data.ts`](../../../src/app/relatorios/monthly-group-dashboard-data.ts), linhas 218-239, 300-345 e 349-401. |
| A impressão do relatório é acionada por `window.print()`. | [`print-dashboard-button.tsx`](../../../src/app/relatorios/print-dashboard-button.tsx), linhas 6-19. |
| O CSS possui regras compartilhadas do dashboard, regras responsivas em `980px`, `720px`, `600px`, `599px`, `500px` e `360px`, além de `@page` A4 retrato e regras de impressão. | [`globals.css`](../../../src/app/globals.css), linhas 219-328, 877-908, 963-1055, 1200-1304 e 1248-1279. |
| Já existem modificadores semânticos do Responsável para filtros, servidores, consolidado, resultados e conquistas. | [`globals.css`](../../../src/app/globals.css), linhas 221-225, 245-248 e 1370-1455. |
| O dashboard compartilhado também é usado por Admin; portanto, seletores base como `.dashboard-section`, `.dashboard-table` e `.dashboard-metrics-grid` não podem ser alterados sem escopo. | [`admin/relatorios/page.tsx`](../../../src/app/admin/relatorios/page.tsx), linhas 54-87; [`monthly-group-dashboard.tsx`](../../../src/app/relatorios/monthly-group-dashboard.tsx), linhas 71-87. |
| A rota azul é estática e usa fixture própria, servindo apenas como referência de composição e estilo. | [`relatorios-azul/page.tsx`](../../../src/app/responsavel/relatorios-azul/page.tsx), linhas 11-165; [`static-report-fixture.ts`](../../../src/app/responsavel/relatorios-azul/static-report-fixture.ts), linhas 1-46. |
| O HTML externo define os tokens claros `#f6f7f9`, `#ffffff`, `#1c2430`, `#5b6675`, `#dfe3e8` e `#2b6cb0`, além da escala geral de texto e cartão. | [`index.html`](../../Painel%20de%20NA%20no%20Brasil%20%28Copy%29/index.html), linhas 6-29. |
| O baseline aprovado contém capturas de desktop, tablet, mobile e impressão. | [`baseline-verde-desktop-2026-10-29.png`](../../../.playwright-mcp/baseline-verde-desktop-2026-10-29.png), [`baseline-verde-tablet-2026-10-29.png`](../../../.playwright-mcp/baseline-verde-tablet-2026-10-29.png), [`baseline-verde-mobile-2026-10-29.png`](../../../.playwright-mcp/baseline-verde-mobile-2026-10-29.png), [`baseline-verde-print-desktop-2026-10-29.png`](../../../.playwright-mcp/baseline-verde-print-desktop-2026-10-29.png) e [`baseline-verde-print-2026-10-29.png`](../../../.playwright-mcp/baseline-verde-print-2026-10-29.png). |
| O checkout estava limpo no momento da inspeção, sem alterações não commitadas ou arquivos não rastreados, no branch `codex/revisao-estado-2026-10-25`, um commit à frente da origem. | `git status --short --branch`, executado em 29/10/2026. |
| Não existe `.env.playwright.local` nem `playwright.config.*` no checkout atual. | Verificação de existência em 29/10/2026. |

### 2.1 Limitações das fontes

As duas referências externas apontadas por `AGENTS.md` e `GEMINI.md` não foram usadas, porque pertencem a outro checkout e estão ausentes. O conteúdo delas não foi presumido. O plano usa o `AGENTS.md` local, o `GEMINI.md` local, o `docs/README.md`, o roteiro, a especificação, as capturas presentes e o código atual.

O HTML externo é somente fonte visual. Não serão reutilizados mapa, links, scripts, arquivos PPT, fixture ou dados estáticos no relatório real.

## 3. Escopo de mudança e invariantes

### 3.1 Escopo permitido

A apresentação que pode mudar é o conteúdo visual do relatório real dentro de `/responsavel/relatorios`: cabeçalho do relatório, filtros de período, cartão de servidores, consolidado, tabela agrupada por reunião, cartões de conquistas e rodapé. A área pode receber os tokens visuais da especificação, desde que cada regra seja alcançada pelo contexto do relatório Responsável.

O escopo CSS proposto deve usar como raiz um seletor equivalente a:

~~~css
.monthly-dashboard-page:has(.monthly-dashboard-sheet-responsavel) { ... }
~~~

Quando for necessário alcançar a área principal que contém o relatório, o seletor deve continuar condicionado a `:has(.monthly-dashboard-sheet-responsavel)`. Não usar como nova regra visual um seletor base solto como `.dashboard-section`, `.dashboard-table`, `.dashboard-metric-card` ou `.responsavel-layout`.

O cabeçalho Responsável está fora de `.monthly-dashboard-sheet`; portanto, ele deve ser alcançado pelo wrapper da página combinado com `.dashboard-responsavel-title`, sem mudar `ResponsavelShell`, `AppShell`, `responsavel-sidebar`, `responsavel-nav` ou `app-menu-trigger`.

### 3.2 Invariantes obrigatórios

- `dynamic = "force-dynamic"`, autorização, grupo selecionado e redirecionamentos ficam intactos.
- `mes` e `ano` continuam sendo os nomes dos parâmetros e as opções mantêm seus valores atuais.
- `buildMonthlyDashboardData` e seus cálculos não mudam.
- A ordem fixa de domingo a sábado, a expansão por dia e os horários derivados continuam iguais.
- Na rota real do Responsável, a ausência da paginação permanece explícita, pois o ramo agrupado não a renderiza. A paginação do ramo compartilhado não agrupado não será adaptada nesta etapa.
- Estados vazios, valores reais, cores semânticas das conquistas e texto dinâmico de grupo permanecem íntegros.
- O texto `Grupo {data.group.grupo_nome}` preserva o valor original de `grupo_nome`, inclusive caixa, grafia e espaços.
- Os limites existentes em `980px`, `720px`, `600px`, `599px`, `500px` e `360px` não mudam. Se o layout precisar de espaço adicional, a solução deve ser um ajuste dentro desses limites, não um novo breakpoint.
- O botão PDF continua chamando `window.print()`.
- A rota azul, Admin, atas, autenticação, backend, Google Sheets, shell, menu e navegação ficam fora do diff de apresentação.

### 3.3 Conflito de escopo já observado

O CSS atual contém regras condicionadas ao relatório que também alteram o fundo do `responsavel-layout`, `responsavel-sidebar` e `responsavel-nav`, em [`globals.css`](../../../src/app/globals.css), linhas 220, 622 e 896. Isso é estado existente do checkout, não uma autorização para ampliar a Fase 1. A implementação deve deixar essas declarações intocadas e não adicionar novas regras de shell. Qualquer decisão de corrigir a aparência do shell deve ser registrada como trabalho posterior, fora deste plano.

> **Why & What - escopo CSS isolado**
>
> **What:** aplicar a tipologia visual somente através do contexto que contém `.monthly-dashboard-sheet-responsavel`, mantendo as classes funcionais existentes.
>
> **Why:** `MonthlyGroupDashboard` atende Admin e Responsável. Escopar pelo marcador real evita que os tokens da Fase 1 alterem o consumidor Admin. Essa escolha não corrige a dívida visual existente no shell.
>
> **Alternatives considered:** alterar os seletores base compartilhados seria menor em quantidade de CSS, mas mudaria Admin e pode alterar páginas que não pertencem ao ciclo. Criar uma árvore exclusiva para o Responsável reduziria a sobreposição, mas duplicaria estrutura e introduziria risco funcional sem necessidade comprovada.
>
> **Fallback:** se um componente não puder receber o estilo sem um hook adicional, interromper a edição daquele componente, registrar o seletor ausente e propor somente o hook mínimo em revisão separada. Não improvisar uma regra global.

## 4. Contrato visual a aplicar

A especificação é a fonte dos requisitos. O HTML externo define os tokens genéricos; a rota azul define os padrões de componente que não têm equivalente no HTML; o relatório verde continua sendo a fonte de estrutura, dados e comportamento.

| Componente real | Aplicação visual planejada | Limite comportamental |
| --- | --- | --- |
| Cabeçalho do relatório | Fonte `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`; título de `32px`, medido no título `Grupo USL` de Histórico de atas; título usa `#0b3a7a`, o mesmo azul escuro do hover/foco dos dias; eyebrow “Relatórios” usa `#1d4ed8`, o mesmo tom dos valores dos cards; descrição secundária com `#5b6675`; ação com o acento `#2b6cb0`. | Manter eyebrow, `Grupo {grupo_nome}`, descrição e link atual para `/responsavel/relatorios-azul`. Não mudar o shell. |
| Filtros de mês, ano e PDF | Superfície branca, borda `1px solid #dfe3e8`, raio `12px`, padding base de `12px`; labels de `12px` com peso `600` e caixa alta; selects de `14px`; botão com `14px`, peso `600`, raio `8px` e padding `10px 12px`. | Preservar `mes`, `ano`, valores selecionados, `requestSubmit()`, destino e `window.print()`. Manter a distribuição dos breakpoints verdes. |
| Seções de servidores, consolidado, resultados e conquistas | Superfície branca, borda `1px solid #dfe3e8`, raio `12px`, padding de `12px` e gap interno de `12px` como base. Títulos de `18px`. | Preservar a ordem atual, semântica, conteúdo, estados vazios e a separação de servidores fora ou dentro do dashboard conforme o modo atual. |
| Cards de métricas | Superfície branca, borda `#dfe3e8`, raio `12px`, padding `12px`; labels de `11px/1.2`, peso `600`, caixa alta; valores de `1.875rem/1` com a cor indicada pela especificação. | Preservar nove métricas, a métrica de fundação em linha inteira e seus cálculos. Não alterar a visibilidade de ícones por inferência. |
| Tabela de servidores | Cabeçalho no padrão de tabela azul, contornos da tabela em `#e4edf6`, cabeçalho claro `#f8fbff`, texto de cabeçalho `#4f76a0` e escala diferenciada de células conforme a especificação. | Preservar encargos, nomes, datas, “Vago”, estados vazios e ordem das colunas. |
| Tabela de resultados por reunião | Aplicar o padrão de bordas, cabeçalho, linhas e escala definido para tabelas azuis, sempre por seletor do relatório Responsável. Preservar wrapper com rolagem como proteção estrutural, sem aceitar overflow inesperado na composição atual. O hover e o foco dos dias usam o azul escuro `#0b3a7a`, sem o verde do tema anterior. | Preservar quatro colunas, domingo a sábado, expansão por horários e acessibilidade. Não introduzir `Conquistas` nessa tabela. |
| Cards de conquistas | Superfície branca, borda `#dfe3e8`, raio `12px`, padding `12px`, labels de `11px/1.2` e valores de `1.875rem/1`; pontos continuam usando `row.color`. | Preservar labels, contagens, total e cores dinâmicas. |
| Rodapé | Texto secundário `#5b6675`, fonte próxima de `0.75rem`, alinhamento central e acento do ícone conforme o padrão aprovado. | Preservar grupo, período, mês e ano reais. |

### 4.1 Tokens de referência

| Papel | Valor | Uso limitado ao relatório |
| --- | --- | --- |
| Fundo da área de conteúdo | `#f6f7f9` | Somente o conteúdo visual do relatório, sem shell e navegação. |
| Superfície | `#ffffff` | Filtros, seções e cards. |
| Texto principal | `#1c2430` | Títulos e textos sem token de componente específico. |
| Texto secundário | `#5b6675` | Descrição e rodapé. |
| Borda genérica | `#dfe3e8` | Filtros, seções e cards. |
| Acento | `#2b6cb0` | Ações e estados interativos com equivalente externo. |
| Borda específica de tabela | `#e4edf6` | Tabelas, conforme o padrão azul e sem substituir bordas de outros elementos. |

## 5. Etapa única de execução

As tarefas abaixo pertencem à mesma etapa de trabalho. A sequência ordena a execução e os gates, mas não cria fases adicionais nem autoriza publicação intermediária.

### Tarefa 1: congelar o ponto de partida e conferir o escopo

**Objetivo:** garantir que a alteração comece sobre o estado real do checkout, preservando trabalho preexistente e capturas baseline.

**Arquivos envolvidos:** nenhum arquivo deve ser alterado nesta tarefa.

**Mudança esperada e limites:** apenas leitura. Confirmar branch, HEAD, status, arquivos não rastreados, diferença do HEAD para `37fbbf2`, existência do diretório de planejamento, baseline e documentação. Não fazer limpeza, restauração, staging, commit ou atualização do README.

**Testes ou cenários concretos:**

- confirmar `git status --short --branch` sem apagar nem normalizar arquivos;
- conferir `git diff --name-only 37fbbf2..HEAD` e separar fontes de aplicação de documentação e evidências;
- conferir as cinco capturas baseline e suas dimensões;
- conferir que os caminhos citados por `AGENTS.md` e `GEMINI.md` continuam ausentes ou, se aparecerem, ler o conteúdo antes de prosseguir.

**Comando de verificação:** `git status --short --branch`; `git diff --name-status 37fbbf2..HEAD`; `git ls-files --others --exclude-standard`; `find .playwright-mcp -maxdepth 1 -type f -name 'baseline-verde-*' -print | sort`.

**Evidência para revisão:** saída do status registrada no relatório de execução, lista de arquivos do diff de referência, lista dos cinco baselines e confirmação de que nenhum arquivo existente foi removido ou restaurado.

### Tarefa 2: transformar o contrato visual em regras isoladas

**Objetivo:** preparar a alteração CSS sem misturar tokens externos com estilos compartilhados do dashboard ou do shell.

**Arquivos prováveis:** `src/app/globals.css`.

**Mudança esperada e limites:** organizar ou substituir apenas regras alcançadas por uma raiz condicionada ao relatório Responsável real. O diff pode ajustar as regras verdes existentes que atendem ao relatório, mas não pode editar a estrutura JSX, classes da rota azul, classes do Admin ou seletores de shell. Não mudar os limites de media query existentes.

Os seletores devem cobrir, conforme necessário, `.dashboard-responsavel-title`, `.dashboard-filters-responsavel`, `.dashboard-responsavel-mesa`, `.dashboard-responsavel-consolidated`, `.dashboard-responsavel-meeting-results`, `.dashboard-achievements-cards`, `.dashboard-metrics-grid-responsavel`, `.dashboard-responsavel-mesa-table`, `.meeting-results-table-weekday`, `.dashboard-achievement-card` e `.dashboard-footer` sempre sob o contexto do relatório real.

**Testes ou cenários concretos:**

- confirmar que a regra do cabeçalho alcança o cabeçalho fora de `.monthly-dashboard-sheet`;
- confirmar que os elementos do shell não são alvos de novas declarações;
- confirmar que não há alteração de `@media` existente, `@page`, `.responsavel-sidebar`, `.responsavel-nav`, `.app-menu-trigger` ou seletores base compartilhados;
- confirmar que a regra específica de tabela não converte a tabela em bloco nem remove seu wrapper.

**Comando de verificação:** `git diff --check`; `git diff -- src/app/globals.css`; `rg -n 'monthly-dashboard-sheet-responsavel|responsavel-sidebar|responsavel-nav|app-menu-trigger|@media|@page' src/app/globals.css`.

**Evidência para revisão:** diff CSS anotado por componente, tabela de seletores antes e depois, confirmação de que o diff contém apenas regras do relatório ou ajustes explicitamente justificados.

> **Why & What - CSS como alteração principal**
>
> **What:** manter a aplicação da Fase 1 em CSS, reutilizando a estrutura e os marcadores existentes.
>
> **Why:** a inspeção atual encontrou hooks suficientes no dashboard e na rota Responsável. Uma mudança em JSX aumentaria o risco de alterar dados, ordem, acessibilidade ou o consumidor Admin. Essa escolha não impede uma revisão futura caso um seletor semântico seja comprovadamente insuficiente.
>
> **Alternatives considered:** criar um dashboard exclusivo para o Responsável daria isolamento estrutural, mas duplicaria componentes reais e tornaria a comparação funcional mais difícil. Alterar classes base seria mais curto, mas violaria o escopo da página única.
>
> **Fallback:** se um componente não puder ser isolado, deixar o componente intacto e registrar o bloqueio para uma decisão explícita, sem introduzir CSS global.

### Tarefa 3: testar o contrato funcional que não pode regredir

**Objetivo:** provar que a refatoração visual não mudou a entrada, transformação ou composição funcional do relatório.

**Arquivos prováveis:** `src/app/relatorios/dashboard-filters.test.tsx`; `src/app/relatorios/monthly-group-dashboard-data.test.ts`; e `src/app/relatorios/meeting-results-section.test.tsx`, somente se a cobertura direta da expansão e do ramo paginado ainda não existir no momento da implementação.

**Mudança esperada e limites:** adicionar apenas asserções de regressão de apresentação e interação local, sem mockar ou escrever no Google Sheets. Não alterar a lógica para fazer os testes passarem.

**Testes ou cenários concretos:**

- filtros renderizam `mes`, `ano` e PDF sem botão Filtrar;
- mudança de select chama `requestSubmit()` uma vez;
- `buildMonthlyDashboardData` mantém cálculo de fundação, aprovadas, pendentes no agrupamento do Responsável, médias, conquistas e cores;
- a tabela Responsável inicia recolhida, expande um dia que tenha horário e recolhe novamente;
- a rota Responsável não passa a exibir controles de paginação;
- o ramo não agrupado, quando coberto, continua aceitando `10`, `25`, `50`, `Todo o período`, página inicial e navegação. Isso testa o contrato compartilhado, sem alterar Admin.

**Comando de verificação:** `npm test -- src/app/relatorios/dashboard-filters.test.tsx src/app/relatorios/monthly-group-dashboard-data.test.ts src/app/relatorios/meeting-results-section.test.tsx`. Se o arquivo opcional ainda não existir, executar sem ele e registrar que a expansão foi validada no Playwright. Não criar um teste vazio apenas para satisfazer o comando.

**Evidência para revisão:** saída do Vitest com testes direcionados, casos cobertos e distinção explícita entre cobertura sintética e validação autenticada.

### Tarefa 4: validar o diff de escopo antes do navegador

**Objetivo:** bloquear qualquer alteração acidental fora da página autorizada antes da validação visual.

**Arquivos prováveis:** nenhum novo arquivo de aplicação; a revisão considera os arquivos alterados pelas tarefas anteriores.

**Mudança esperada e limites:** nenhum código novo. A revisão deve confirmar que a rota real, dashboard, filtros, dados e botão PDF não foram alterados, salvo teste permitido. Se o diff tocar `relatorios-azul`, `admin`, `responsavel-shell`, `app-shell`, `navigation-config`, `monthly-group-dashboard-data` ou qualquer camada de persistência, parar e corrigir o escopo antes de continuar.

**Testes ou cenários concretos:** listar nomes alterados; verificar o diff completo, não apenas o último arquivo editado; confirmar ausência de alterações em dados, configurações, screenshots baseline e documentos existentes.

**Comando de verificação:** `git status --short`; `git diff --name-only`; `git diff --check`; `git diff -- src/app/responsavel/relatorios/page.tsx src/app/relatorios/monthly-group-dashboard.tsx src/app/relatorios/monthly-group-dashboard-data.ts src/app/responsavel/relatorios-azul src/app/app-shell.tsx src/app/responsavel/responsavel-shell.tsx`.

**Evidência para revisão:** lista final de arquivos modificados, diff vazio para os caminhos protegidos e parecer de escopo assinado pelo implementador ou revisor.

### Tarefa 5: executar lint, build e testes direcionados

**Objetivo:** verificar que o CSS e os testes do relatório são aceitos pelo projeto e que não há erro de compilação antes da inspeção autenticada.

**Arquivos prováveis:** nenhum arquivo adicional; comandos somente leitura do estado de código, além dos artefatos temporários normais das ferramentas.

**Mudança esperada e limites:** nenhuma mudança funcional. Se o build regenerar `next-env.d.ts`, preservar o resultado preexistente e, caso a execução altere apenas esse arquivo gerado, registrar a alteração e restaurar somente esse arquivo com autorização do responsável pela execução. Não restaurar o checkout inteiro.

**Testes ou cenários concretos:** lint completo; testes direcionados da tarefa 3; build de produção local; verificação posterior do status para detectar arquivos gerados.

**Comandos de verificação:** `npm run lint`; `npm test -- src/app/relatorios/dashboard-filters.test.tsx src/app/relatorios/monthly-group-dashboard-data.test.ts`; `npm run build`; `git status --short`.

**Evidência para revisão:** logs dos três comandos, código de saída, versão do Node usada e status posterior. Falhas preexistentes devem ser separadas de falhas introduzidas pela Fase 1, sem declarar sucesso por um único comando.

### Tarefa 6: preparar a validação autenticada da rota real

**Objetivo:** obter um ambiente visual reproduzível com sessão autorizada de Responsável e grupo real, sem usar fixture azul ou alterar dados externos.

**Arquivos prováveis:** `scripts/playwright-fase-1-relatorio-verde.mjs`, novo runner focado somente na rota real, se a execução exigir uma automação reproduzível que não exista no checkout; artefatos temporários em `artifacts/relatorio-verde-fase-1/` ou `/tmp/gs-relatorio-verde-fase-1/`.

**Mudança esperada e limites:** o runner, se criado, deve acessar apenas `/login` e `/responsavel/relatorios`, usar a sessão autorizada fornecida, redigir valores sensíveis nos logs e não submeter formulários que escrevam em Google Sheets. Não reutilizar cegamente `scripts/playwright-responsive-audit.mjs`, pois ele percorre outras rotas além do relatório.

**Pré-requisitos externos:**

- sessão autorizada de Responsável com ao menos um grupo acessível;
- credenciais de teste ou sessão já autenticada, fornecidas pelo responsável sem serem registradas no documento ou nos artefatos;
- servidor local iniciado com as variáveis necessárias;
- definição do grupo e de pelo menos dois períodos válidos para conferir `mes` e `ano`;
- Chromium ou Google Chrome disponível para o Playwright;
- autorização do responsável para ler a tela real. Nenhuma escrita em Sheets é necessária.

**Testes ou cenários concretos:** sessão Responsável deve permanecer em `/responsavel/relatorios` e renderizar o grupo real; sessão Administrador não deve ser usada como substituta, pois a rota redireciona Administrador para `/admin/grupos`; capturar console, erros de página, status HTTP e URL final sem registrar senhas ou cookies.

**Comando de verificação:** `PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_AUDIT_OUTPUT=artifacts/relatorio-verde-fase-1 node scripts/playwright-fase-1-relatorio-verde.mjs`.

**Evidência para revisão:** log redigido, URL final, status HTTP, grupo e período exibidos, ausência de erros de console e diretório de evidências. O runner não deve gravar dados de negócio.

### Tarefa 7: validar dados, filtros, expansão e ausência de overflow

**Objetivo:** confirmar no navegador autenticado que a apresentação nova continua mostrando os mesmos dados e comportamentos reais.

**Arquivos prováveis:** artefatos de validação em `artifacts/relatorio-verde-fase-1/`; nenhum arquivo de aplicação adicional.

**Mudança esperada e limites:** somente observação, interação de leitura e captura. Não alterar período por escrita externa, não criar ata, não salvar grupo e não abrir rotas fora do relatório.

**Matriz mínima de cenários:**

| Cenário | Verificação objetiva |
| --- | --- |
| Entrada padrão | H1, grupo, descrição, servidores, consolidado, resultados e conquistas presentes; valores do baseline compatíveis com o mesmo grupo e período. |
| `?mes=10&ano=2026` | selects mostram Outubro e 2026; URL e rodapé correspondem ao período. |
| `?mes=9&ano=2026` ou outro período real confirmado | mudança de período atualiza URL, selects, rodapé e dados sem perda de layout. |
| Expansão | tabela inicia sem linhas de horário visíveis; botão de um dia com horário alterna `aria-expanded` e mostra ou esconde as linhas derivadas. |
| Paginação | `meeting-pagination-nav` não aparece na rota Responsável, porque o ramo agrupado é o comportamento atual. O ramo paginado não deve ser introduzido nessa rota. |
| Estados vazios | se o período escolhido tiver ausência de dados, labels e mensagens continuam legíveis sem alterar a estrutura. |
| Overflow | `document.documentElement.scrollWidth <= window.innerWidth`; wrappers e tabelas não produzem overflow horizontal inesperado em nenhum viewport. |
| Console | nenhum erro de runtime, erro de carregamento de CSS ou warning novo relacionado ao relatório. |

**Medições obrigatórias com `getComputedStyle` e `getBoundingClientRect`:** largura, altura, posição e gap do cabeçalho, filtros, cada seção, métricas, tabela e rodapé; `font-family`, `font-size`, `font-weight`, `line-height`, `color`, `background-color`, `border-color`, `border-width`, `border-radius`, `padding` e `gap` dos seletores mapeados; largura da primeira coluna de `Dia da Semana` e das três colunas restantes; quantidade de linhas de domingo a sábado e linhas de horário quando expandidas; presença e dimensões do botão PDF em desktop, tablet, mobile e largura estreita.

**Viewports mínimos:** desktop `1440x1000`; tablet `768x1000`; mobile `375x1200`; mobile estreito `320x1200`; smoke de limite nas larguras `981`, `980`, `721`, `720`, `600`, `599`, `500`, `499`, `360` e `359`, mantendo altura suficiente para medir a página.

**Comando de verificação:** `PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_AUDIT_OUTPUT=artifacts/relatorio-verde-fase-1 node scripts/playwright-fase-1-relatorio-verde.mjs`.

**Evidência para revisão:** `metrics.json` com viewport, URL, valores computados, retângulos, overflow e contagem de linhas; uma captura de tela por viewport; capturas de estado recolhido e expandido; log de console; tabela de diferenças em relação aos cinco baselines aprovados.

### Tarefa 8: validar impressão em duas camadas

**Objetivo:** verificar o fluxo de impressão do relatório e separar a aparência emulada do PDF efetivamente gerado.

**Arquivos prováveis:** `scripts/playwright-fase-1-relatorio-verde.mjs`; `artifacts/relatorio-verde-fase-1/print-emulation-desktop.png`; `artifacts/relatorio-verde-fase-1/print-emulation-mobile.png`; `artifacts/relatorio-verde-fase-1/responsavel-relatorios.pdf`; imagens renderizadas de todas as páginas e `pdfinfo.txt`.

**Mudança esperada e limites:** não alterar `@page`, orientação, margem, ocultações ou botão de impressão sem uma decisão explícita. A implementação deve conservar o contrato atual de A4 retrato e as regras de impressão existentes.

**Camada A, emulação de impressão:** abrir a rota real autenticada; substituir `window.print` por um marcador controlado somente para confirmar que o clique no botão foi recebido; clicar em `Exportar PDF` e verificar o marcador; executar `page.emulateMedia({ media: "print" })`; capturar desktop e mobile em modo print; verificar que filtros, sidebar e menu estão ocultos, que a área principal ocupa a largura de impressão e que não há corte visual óbvio.

Essa camada prova o CSS de `@media print` e o acionamento do botão. Ela não prova a paginação do PDF.

**Camada B, PDF produzido:** gerar o arquivo com Chromium headless usando `page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })`; executar `pdfinfo` para registrar número de páginas, tamanho e orientação; renderizar todas as páginas com `pdftoppm` ou ferramenta equivalente; inspecionar cada página renderizada para clipping, sobreposição, linhas partidas, conteúdo perdido, rodapé isolado e overflow horizontal; conferir que o conteúdo esperado do grupo e período está no texto extraído, sem usar isso como substituto da inspeção visual.

**Comandos de verificação:** `pdfinfo artifacts/relatorio-verde-fase-1/responsavel-relatorios.pdf > artifacts/relatorio-verde-fase-1/pdfinfo.txt`; `pdftoppm -png -r 150 artifacts/relatorio-verde-fase-1/responsavel-relatorios.pdf artifacts/relatorio-verde-fase-1/pdf-page`; `pdftotext artifacts/relatorio-verde-fase-1/responsavel-relatorios.pdf artifacts/relatorio-verde-fase-1/pdf-text.txt`.

**Evidência para revisão:** screenshots de print em desktop e mobile, marcador do clique, PDF original, `pdfinfo.txt`, imagem de cada página, texto extraído e uma conclusão separada para emulação e PDF produzido. A paginação física só será marcada como validada após a inspeção de todas as páginas geradas.

### Tarefa 9: revisar a equivalência visual e as diferenças residuais

**Objetivo:** confrontar a implementação com a especificação e o baseline aprovado sem exigir identidade pixel a pixel onde o conteúdo real é diferente.

**Arquivos prováveis:** `artifacts/relatorio-verde-fase-1/metrics.json`; `artifacts/relatorio-verde-fase-1/visual-differences.md`; capturas novas de desktop, tablet, mobile e print; nenhum arquivo adicional de aplicação.

**Mudança esperada e limites:** nenhuma nova alteração durante a revisão. Se uma diferença exigir mudança de regra, registrar a diferença e retornar à tarefa correspondente, preservando o mesmo escopo. Não aceitar uma correção visual que altere dados, shell, Admin ou breakpoints.

**Testes ou cenários concretos:** comparar estrutura, conteúdo e densidade entre before e after; conferir tokens exatos para cores e bordas; conferir tipografia e dimensões por componente; conferir mobile sem overflow e sem redução que torne labels ilegíveis; conferir tablet nos limites `721` a `980`; conferir desktop sem expandir o dashboard compartilhado; conferir que a rota azul continua idêntica por diff de arquivo e, se disponível, smoke visual local.

**Comando de verificação:** `git diff --check`; `git diff --name-only`; `test -f artifacts/relatorio-verde-fase-1/metrics.json`; `test -f artifacts/relatorio-verde-fase-1/responsavel-relatorios.pdf`.

**Evidência para revisão:** `visual-differences.md` com colunas `componente`, `baseline`, `resultado`, `diferença aceita`, `ação pendente` e `responsável`; pares de capturas antes e depois; medições e logs vinculados aos cenários.

### Tarefa 10: executar o gate final da Fase 1

**Objetivo:** decidir objetivamente se a Fase 1 está pronta para aprovação, sem avançar para preview ou produção.

**Arquivos prováveis:** nenhum arquivo novo além dos previstos de código, testes e evidência.

**Mudança esperada e limites:** nenhuma publicação, ativação ou deploy. O gate encerra a etapa local e autenticada; qualquer item não comprovado fica pendente.

**Checklist de aceite:**

- [ ] o diff de aplicação está restrito à apresentação de `/responsavel/relatorios`;
- [ ] o CSS novo está escopado ao contexto `.monthly-dashboard-sheet-responsavel`;
- [ ] nenhum breakpoint verde foi criado, removido ou deslocado;
- [ ] a rota azul, Admin, shell, menu, navegação, atas e autenticação não têm alteração de apresentação causada pelo diff;
- [ ] rota dinâmica, sessão autorizada, grupo, `mes`, `ano`, dados e rodapé foram conferidos;
- [ ] filtros submetem e preservam a URL esperada;
- [ ] expansão recolhe e expande os horários corretos;
- [ ] hover e foco dos dias usam `#0b3a7a` no relatório Responsável;
- [ ] a ausência de paginação na rota Responsável foi confirmada como comportamento atual, sem introdução de controles;
- [ ] estados vazios e valores reais estão legíveis;
- [ ] não há overflow horizontal nos viewports definidos;
- [ ] tipografia, cores, bordas, raios, dimensões e gaps foram medidos;
- [ ] emulação de impressão foi registrada;
- [ ] PDF foi gerado, contado, renderizado página a página e inspecionado;
- [ ] `npm run lint`, testes direcionados e `npm run build` passaram ou têm falhas prévias explicitamente separadas;
- [ ] screenshots, métricas, logs, PDF e diferenças residuais foram entregues;
- [ ] não há item crítico em aberto.

**Comando de verificação final:** `git status --short --branch`; `git diff --check`; `git diff --name-only`; `npm run lint`; `npm test -- src/app/relatorios/dashboard-filters.test.tsx src/app/relatorios/monthly-group-dashboard-data.test.ts`; `npm run build`.

**Evidência para revisão:** checklist assinado, logs dos comandos, diff completo, matriz de viewports, `metrics.json`, capturas, PDF renderizado, lista de diferenças residuais e confirmação explícita de que nenhum preview ou deploy foi executado.

## 6. Critérios objetivos de aceite

A Fase 1 será considerada pronta para aprovação quando todos os critérios abaixo forem comprovados por evidência, não por intenção:

1. Os componentes mapeados usam os tokens e padrões da especificação dentro do contexto do relatório Responsável.
2. Nenhum seletor novo alcança Admin, rota azul, atas, shell, menu ou navegação.
3. `git diff --name-only` confirma o conjunto de arquivos autorizado e `git diff --check` não apresenta erro.
4. A rota real retorna status de sucesso após login autorizado, permanece em `/responsavel/relatorios` e exibe grupo e período reais.
5. `mes` e `ano` atualizam URL, selects, rodapé e dados do período sem mutação externa.
6. A tabela contém domingo a sábado, inicia recolhida e expande somente os horários do dia acionado.
7. O controle de paginação não aparece na rota real do Responsável; o ramo compartilhado não agrupado não sofre alteração funcional.
8. As medições de overflow são nulas em desktop, tablet, mobile e mobile estreito.
9. As medições registram os valores de fonte, cor, borda, raio, padding, gap e dimensões dos componentes previstos.
10. O modo de impressão oculta os elementos previstos e mantém A4 retrato na emulação.
11. O PDF gerado tem seu número de páginas, orientação e render de todas as páginas registrados; nenhum clipping ou conteúdo perdido permanece sem decisão.
12. Lint, testes direcionados e build passam, ou qualquer falha pré-existente está identificada e não foi causada pelo diff da Fase 1.
13. As diferenças visuais restantes estão listadas com responsável e decisão. Não há diferença crítica silenciosa.

## 7. Pré-requisitos, bloqueios e questões em aberto

### 7.1 Pré-requisitos externos

| Questão ou pré-requisito | Responsável por responder | Condição para avançar |
| --- | --- | --- |
| Qual sessão autorizada de Responsável e qual grupo real serão usados na validação? | Responsável pelo projeto ou operador autorizado | Sessão disponível sem registrar credenciais nos artefatos. |
| Quais dois períodos reais devem ser usados para comprovar `mes` e `ano`? | Responsável pelo projeto ou validador de dados | Pelo menos um período com resultados e um período que permita verificar diferença de estado ou vazio. |
| Quem fará a inspeção visual página a página do PDF gerado? | Revisor visual designado | Nome ou papel registrado no relatório de execução. |
| O runner Playwright focado deve ser mantido no repositório ou pode ser temporário? | Responsável técnico do projeto | Decisão antes de criar `scripts/playwright-fase-1-relatorio-verde.mjs`. |

### 7.2 Questões de implementação que não bloqueiam o planejamento

- O código atual já oferece classes semânticas suficientes para aplicar os tokens por CSS. O implementador deve confirmar isso no diff; não deve criar JSX por antecipação.
- A especificação descreve escalas de tabela distintas para cabeçalho, `tbody th` e `tbody td`. Se a escala comprovadamente causar clipping em um breakpoint existente, registrar a medição e ajustar somente o valor dentro do breakpoint, sem alterar o limite.
- O CSS atual possui regras de shell condicionadas à presença do relatório. Como essas regras são preexistentes, o plano não as reescreve; qualquer decisão sobre seu visual fica fora da Fase 1.
- O baseline é uma referência do estado aprovado, não uma autorização para alterar capturas existentes. As novas capturas devem ter nomes separados.

## 8. Benefícios, custos e riscos residuais

O plano oferece uma aplicação visual revisável por componente, preservando a árvore funcional real e evitando que o dashboard compartilhado receba tokens por acidente. A validação combina comportamento autenticado, medições computadas, screenshots e inspeção do PDF produzido.

O custo é manter regras específicas para o modo Responsável ao lado dos estilos compartilhados, além de executar uma matriz de viewports e uma inspeção física do PDF. A preservação dos breakpoints pode impedir uma cópia exata de alguma composição azul em larguras específicas; nesse caso, a legibilidade e a ausência de overflow têm prioridade dentro dos limites verdes.

Riscos residuais:

- a sessão autenticada pode não estar disponível no ambiente local;
- dados reais podem não oferecer simultaneamente estado populado, vazio e horários expandidos;
- a renderização de PDF pode variar conforme Chromium e fontes instaladas;
- um erro de escopo em `globals.css` pode afetar Admin ou shell mesmo sem alterar JSX, por isso o diff e o smoke da rota azul são obrigatórios;
- o runner existente percorre várias rotas e não deve ser tratado como prova focada da Fase 1 sem revisão.

## 9. Gate antes de preview ou produção

Não executar preview, ativação, deploy, publicação ou mudança em dados antes de o responsável aprovar o pacote de evidências da tarefa 10. O pacote mínimo é:

- diff completo e lista de arquivos;
- logs de lint, testes e build;
- `metrics.json` por viewport;
- screenshots de desktop, tablet, mobile, mobile estreito e impressão;
- comparação com os cinco baselines existentes;
- PDF gerado, `pdfinfo`, render de todas as páginas e conclusão sobre paginação;
- lista de diferenças residuais e questões resolvidas;
- confirmação de que a rota azul, Admin, shell, menu, navegação, atas, autenticação, backend, Google Sheets e regras de negócio não foram alterados.

O gate só passa com todos os critérios objetivos do capítulo 6 comprovados. Uma captura em `print` sem PDF gerado e inspecionado não passa o gate de paginação física.

---

Este plano separa fatos verificados no checkout atual das mudanças propostas para execução. As decisões visuais derivam da especificação da Fase 1; qualquer conflito descoberto durante a execução deve ser registrado com evidência e resolvido pelo responsável antes de ampliar o escopo.
