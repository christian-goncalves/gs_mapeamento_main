# Especificação da tipologia visual do relatório verde

**Proposta para aplicar ao relatório real do Responsável os estilos da referência externa e da rota azul, preservando a implementação funcional do relatório.**

|                |                                                                 |
| -------------- | --------------------------------------------------------------- |
| **Status**     | Proposta para revisão e aprovação                               |
| **Responsável**| Responsável pelo projeto GS Mapeamento                          |
| **Escopo**     | Apresentação de `/responsavel/relatorios`; exclui outras áreas   |
| **Relacionado**| [Roteiro de refatoração](../roteiro-de-refatoracao.md)           |
| **Público**    | Responsável pelo projeto e pessoa que implementará a Fase 1      |

---

## 1. Resumo

Propomos atualizar somente o CSS do relatório real para aproximar sua tipologia da referência externa, usando a rota azul como referência de componentes de relatório que não existam no HTML. O relatório continua usando os componentes, dados e interações atuais. A rota azul fica intacta como comparação.

A proposta mantém os breakpoints verdes e o contrato atual de impressão. Antes de implementar, o Responsável pelo projeto aprova este mapeamento. A implementação e sua validação visual com Playwright são etapas posteriores.

## 2. Fatos verificados e fontes

Os fatos abaixo foram conferidos no commit `37fbbf2`. Os valores de referência visual pertencem ao HTML externo ou ao CSS da rota azul; as decisões de aplicação aparecem como proposta nos capítulos seguintes.

| Fato verificado | Fonte no commit `37fbbf2` |
| --- | --- |
| A rota real é dinâmica, lê `mes` e `ano`, aplica autorização e monta os dados com `buildMonthlyDashboardData`. | [`src/app/responsavel/relatorios/page.tsx`](../../../src/app/responsavel/relatorios/page.tsx), linhas 13-80. |
| O dashboard compartilhado adiciona modificadores visuais para o modo Responsável e compõe cabeçalho, filtros, seções, tabelas, métricas e conquistas. | [`src/app/relatorios/monthly-group-dashboard.tsx`](../../../src/app/relatorios/monthly-group-dashboard.tsx), linhas 88-333. |
| Os filtros preservam os nomes `mes` e `ano`; a troca de seleção envia o formulário com `requestSubmit()`. | [`src/app/relatorios/dashboard-filters.tsx`](../../../src/app/relatorios/dashboard-filters.tsx), linhas 19-23 e 49-112. |
| A tabela de reuniões começa com os dias recolhidos. O modo paginado mantém opções de quantidade e navegação entre páginas. | [`src/app/relatorios/meeting-results-section.tsx`](../../../src/app/relatorios/meeting-results-section.tsx), linhas 39-43 e 114-201. |
| O HTML define a paleta clara, fonte, escala de texto, largura do conteúdo e cartão genérico. | [HTML externo](../../Painel%20de%20NA%20no%20Brasil%20%28Copy%29/index.html), linhas 6 e 9-28. |
| O CSS azul define estilos de filtros, seções, cartões, tabelas, conquistas e rodapé. Também contém breakpoints próprios que não devem ser importados para o relatório verde. | [`src/app/globals.css`](../../../src/app/globals.css), linhas 368-423. |
| O CSS verde já tem regras de impressão e regras responsivas próprias. | [`src/app/globals.css`](../../../src/app/globals.css), linhas 1249-1303 e 1368-1453. |
| O baseline visual aprovado tem capturas autenticadas para desktop, tablet, mobile e impressão. | [Capturas do baseline](../../../.playwright-mcp/): `baseline-verde-desktop-2026-10-29.png`, `baseline-verde-tablet-2026-10-29.png`, `baseline-verde-mobile-2026-10-29.png` e `baseline-verde-print-desktop-2026-10-29.png`. |

O HTML externo declara também tokens para estados do mapa e tema escuro. Esses tokens não representam estilos de relatório e ficam fora da aplicação proposta. O contrato visual aprovado mantém tema claro.

## 3. Objetivo, limites e termos

O objetivo é aplicar ao relatório verde a tipologia externa de fonte, cores, escala, espaçamento, cartões, filtros, tabelas e bordas. A rota azul fornece padrões de componente apenas onde o HTML externo não define um equivalente.

O relatório verde é a rota `/responsavel/relatorios`, que consulta os dados autorizados e apresenta o dashboard do grupo. “Rota azul” significa `/responsavel/relatorios-azul`, usada como referência visual. “Breakpoints verdes” são os limites responsivos já definidos para o relatório real no CSS existente.

Ficam fora da proposta: conteúdo ou dados da referência externa; fixture azul; mudanças de estrutura ou regras de negócio; backend e Google Sheets; autenticação; query params; rota azul; Admin; atas; demais páginas do Responsável; shell, menu e navegação; mudanças nos breakpoints; alteração de geração ou paginação do PDF.

## 4. Precedência visual

O HTML externo fornece os valores para papéis visuais genéricos que ele define. A rota azul fornece estilos de componentes de relatório que não existem no HTML. A implementação verde continua sendo a fonte de estrutura, dados e comportamento.

Quando duas referências definirem o mesmo papel, prevalece o HTML externo. Assim, o contorno de cartões e filtros usa `#dfe3e8`, definido pelo token geral externo, em vez de `#e4edf6` da rota azul. Para estilos sem equivalente externo, como cabeçalho de tabela, usa-se a regra azul correspondente. A rota azul continua sem alterações.

> **Why & What - precedência das referências**
>
> **O que:** usar o HTML para tokens genéricos e a rota azul para componentes sem equivalente externo.
>
> **Por quê:** o HTML é a fonte de precisão visual declarada no roteiro, enquanto a rota azul demonstra a adaptação ao dashboard do GS Mapeamento. Essa precedência não define novos comportamentos nem conteúdo.
>
> **Alternativa considerada:** copiar integralmente o CSS azul. Isso preservaria melhor a aparência da demonstração, mas manteria valores diferentes da referência externa nos papéis que ambas definem.
>
> **Fallback:** se um componente não tiver regra equivalente em nenhuma fonte, manter sua estrutura verde e propor o estilo mais próximo para aprovação antes da implementação.

## 5. Mapeamento dos componentes

| Componente verde | Proposta visual e origem | Comportamento e estrutura preservados |
| --- | --- | --- |
| Cabeçalho, eyebrow, título, descrição e ação | Fonte `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`; corpo `15px/1.45`; título `22px`; texto secundário `#5b6675`. A ação usa o token externo de acento `#2b6cb0`; o título usa o texto principal `#1c2430`. Valores genéricos vêm do HTML externo. | Textos dinâmicos, grupo e destino atual da ação. |
| Filtros de mês e ano e controle PDF | Cartão branco, borda `1px solid #dfe3e8`, raio `12px` e padding `12px`, do HTML. Rótulos `12px`, peso `600`, caixa alta; selects `14px`, peso `600`; botão `14px`, peso `600`, raio `8px`, padding `10px 12px`, da rota azul. Preservar o arranjo verde, ajustando apenas espaçamento necessário para encaixe. | Nomes `mes` e `ano`, valores, destino do formulário, envio automático e fluxo de impressão atuais. |
| Seções Servidores, Consolidado, Consolidados por Reunião e Conquistas | Superfície branca, borda `1px solid #dfe3e8`, raio `12px`, padding `12px`; espaçamento interno de `12px` como base. Títulos `18px`. Tokens genéricos vêm do HTML; a rota azul fornece a composição de seção. | Ordem, títulos, semântica e conteúdo das seções. |
| Métricas | Cartões brancos com borda `#dfe3e8`, raio `12px` e padding `12px`. Rótulos `11px/1.2`, peso `600`, caixa alta; valores `1.875rem/1`, cor `#1d4ed8`, da rota azul. | Valores dinâmicos; cartão “Reuniões desde a Fundação” em linha inteira. |
| Tabela de servidores | Tabela azul: bordas de `#e4edf6`, cabeçalho `#f8fbff`, texto do cabeçalho `#4f76a0` em caixa alta. A base das células usa `0.8125rem/1.25`; cabeçalho usa `calc(.98rem - 4px + 1pt)`, `tbody th` usa `calc(.85rem + 1pt)` e `tbody td` usa `calc(1rem + 1pt)`, conforme a rota azul. | Encargos, nomes, datas, estados vazios e ordem das colunas. |
| Tabela de consolidados por reunião | Mesmo padrão de tabela; manter wrapper de rolagem horizontal e estilos próprios das linhas de resumo e horário. | Dias da semana, valores, expansão recolhida por padrão, expansão por horário e acessibilidade. |
| Cards de conquistas | Superfície branca, borda `#dfe3e8`, raio `12px`, padding `12px`; rótulos `11px/1.2`, valores `1.875rem/1`, conforme os cartões azuis. | Rótulos, contagens, total e cores dinâmicas recebidas em `row.color`. |
| Rodapé | Cor secundária `#5b6675` e fonte `0.75rem`, usando o padrão funcional da rota azul e a paleta externa. | Grupo e período reais do relatório. |

Na tabela, os contornos `#e4edf6` e as escalas diferenciadas por célula são específicos da tabela azul: o HTML externo não define uma tabela equivalente. O restante da tabela preserva seus estilos verdes que não conflitem com essas propriedades mapeadas.

## 6. Tokens visuais

Esta tabela concentra os valores externos que a proposta transporta. Os tokens específicos de componente sem equivalente externo estão mapeados no capítulo 5.

| Papel | Valor | Uso proposto |
| --- | --- | --- |
| Fundo da área de conteúdo | `#f6f7f9` | Área principal do relatório, sem atingir shell ou navegação. |
| Superfície | `#ffffff` | Filtros, seções e cartões. |
| Texto principal | `#1c2430` | Títulos e texto geral sem papel de componente específico. |
| Texto secundário | `#5b6675` | Descrições e rodapé. |
| Borda genérica | `#dfe3e8` | Filtros, seções e cartões. |
| Acento | `#2b6cb0` | Ação e estados interativos com equivalente externo. |

## 7. Escopo técnico proposto

A proposta concentra os estilos em `src/app/globals.css`, sob um seletor que identifique `.responsavel-layout:has(.monthly-dashboard-sheet-responsavel)`. Ela reutiliza os modificadores verdes já presentes, incluindo `.monthly-dashboard-sheet-responsavel`, `.dashboard-filters-responsavel`, `.dashboard-responsavel-mesa`, `.dashboard-responsavel-consolidated`, `.dashboard-responsavel-meeting-results` e `.dashboard-achievements-cards`.

O seletor de fundo deve alcançar somente a área principal do conteúdo do relatório. Não deve alterar `.responsavel-sidebar`, `.responsavel-nav`, `.app-menu-trigger` nem outros elementos do shell, pois esses elementos pertencem ao escopo posterior da Área Responsável. Uma alteração em JSX só será proposta se a inspeção provar que falta um seletor semântico para aplicar o escopo.

> **Why & What - CSS isolado no relatório**
>
> **O que:** aplicar os estilos com os modificadores existentes e limitar o escopo à página do relatório Responsável.
>
> **Por quê:** o dashboard compartilhado também atende outros contextos; os seletores de Responsável permitem preservar esses consumidores. A proposta não reorganiza componentes nem elimina dívida visual fora da página.
>
> **Alternativa considerada:** adicionar uma nova árvore de componentes exclusiva para o relatório. Isso separaria estilos com mais clareza, mas duplicaria a estrutura e ampliaria o risco de divergência funcional.
>
> **Fallback:** se os modificadores atuais não isolarem um estilo, adicionar somente o seletor semântico mínimo necessário e registrar a justificativa no diff.

## 8. Contratos preservados

A implementação deve manter os contratos abaixo. Eles derivam da rota e dos componentes listados no capítulo 2.

- A rota real permanece dinâmica e mantém autorização, seleção de grupo e redirecionamentos atuais.
- `mes` e `ano` continuam como parâmetros da URL.
- `buildMonthlyDashboardData` continua fornecendo os dados exibidos.
- A mudança dos filtros continua enviando o formulário com `requestSubmit()`.
- Os dias e horários continuam recolhidos por padrão e expandem com os mesmos dados.
- A paginação existente continua disponível no modo em que o componente a usa.
- O botão PDF continua chamando o fluxo atual de impressão.
- Valores reais, estados vazios e cores semânticas de conquistas não mudam.
- Os breakpoints verdes mantêm exatamente seus valores. Não copiar os limites da rota azul.
- A impressão mantém o contrato existente, inclusive A4 retrato e ocultação atual de navegação e filtros.
- `/responsavel/relatorios-azul`, Admin, atas, autenticação, páginas públicas, regras de negócio e Google Sheets não recebem mudanças.

> **Why & What - breakpoints existentes**
>
> **O que:** manter todos os limites responsivos verdes nos valores atuais.
>
> **Por quê:** o baseline aprovado toma o comportamento responsivo verde como contrato. Essa escolha não garante que cada composição azul caiba sem ajustes em todos os tamanhos.
>
> **Alternativa considerada:** importar os breakpoints azuis. Eles acompanham a composição demonstrativa, mas mudariam o comportamento aprovado do relatório real.
>
> **Fallback:** ajustar espaçamentos ou distribuição dos componentes dentro dos limites atuais; se isso não resolver legibilidade ou overflow, registrar a diferença para nova aprovação antes de alterar um breakpoint.

## 9. Critérios de aceite

Uma revisão independente verifica os critérios a seguir antes de aprovar a implementação:

1. O relatório real aplica os tokens genéricos externos e os padrões azuis de componente mapeados no capítulo 5.
2. Os novos estilos ficam restritos à área de conteúdo de `/responsavel/relatorios`.
3. Nenhum breakpoint verde muda e a rota azul mantém o mesmo CSS e aparência.
4. Em uma sessão autorizada, Playwright confirma os dados reais e as interações de filtros, expansão, paginação aplicável e PDF.
5. Playwright registra tipografia computada, cores, bordas, dimensões relevantes e overflow em desktop, tablet e mobile.
6. O modo de impressão mantém tamanho, orientação e elementos ocultos conforme o contrato atual.
7. A revisão registra screenshots e diferenças visuais restantes antes de qualquer preview ou produção.

O responsável pela aprovação é o Responsável pelo projeto. A execução exige uma sessão autorizada de Responsável para a inspeção autenticada. A validação física de paginação do PDF ainda precisa ser demonstrada pelo teste de impressão; a captura emulando `print` não comprova esse resultado.

## 10. Questões em aberto

- O Responsável pelo projeto confirma a escala da tabela azul para cada coluna antes da implementação, pois as regras atuais distinguem cabeçalho, `tbody th` e `tbody td`.
- O Responsável pelo projeto aprova eventuais exceções de espaçamento quando o conteúdo real não couber no valor da referência sem afetar legibilidade ou overflow.

## 11. Benefícios e custos

A proposta cria um mapeamento verificável entre a tipologia externa e os componentes reais, sem substituir os componentes funcionais pelo conteúdo da demonstração. Os testes podem comparar as mesmas rotas e interações antes e depois.

O custo é manter estilos visuais diferentes entre a rota azul e o relatório verde enquanto a rota azul servir de referência. A preservação dos breakpoints também limita a reprodução de layouts responsivos da rota azul quando os limites atuais não coincidem. A equipe deve validar manualmente exceções visuais e não pode tratar a fixture azul como fonte de dados.

---

Este documento separa fatos conferidos no commit `37fbbf2` das escolhas propostas para revisão. O capítulo 2 registra as fontes dos fatos; os capítulos 4 a 11 descrevem a proposta ainda sujeita à aprovação.
