# Roteiro de refatoração do front-end

## Objetivo

Aplicar a tipologia visual da referência externa e da rota azul ao relatório verde real, preservando dados, regras de negócio, autenticação, filtros, responsividade, PDF e demais comportamentos do GS Mapeamento.

Este roteiro cobre somente o baseline e a primeira implementação no relatório verde. As demais áreas ficam fora do primeiro ciclo.

## Escopo inicial

Incluído:

- referência externa;
- rota `/responsavel/relatorios-azul`;
- relatório real `/responsavel/relatorios`;
- `MonthlyGroupDashboard`;
- filtros de mês e ano;
- resultados por reunião;
- métricas, tabelas, cards e rodapé do relatório;
- validação visual com Playwright.

Fora do primeiro ciclo:

- histórico e edição de atas;
- demais páginas do Responsável;
- Admin;
- login e autenticação;
- páginas públicas;
- mudança dos breakpoints existentes;
- alteração de dados, regras de negócio ou Google Sheets.

## Hierarquia das referências

Use as fontes nesta ordem:

1. O HTML externo define a precisão visual: tipografia, cores, espaçamentos, dimensões, cards, filtros e bordas.
2. A rota azul local mostra como essa tipologia foi adaptada ao shell do GS Mapeamento.
3. A rota verde real define os dados, componentes, regras e comportamentos que devem ser preservados.

O HTML externo é somente fonte visual. Não reutilize seu conteúdo, mapa, links, scripts, arquivos PPT ou dados estáticos.

Referências do projeto:

- [HTML externo](../Painel%20de%20NA%20no%20Brasil%20%28Copy%29/index.html)
- [Rota azul](../../src/app/responsavel/relatorios-azul/page.tsx)
- [Fixture azul](../../src/app/responsavel/relatorios-azul/static-report-fixture.ts)
- [Relatório verde](../../src/app/responsavel/relatorios/page.tsx)
- [Dashboard compartilhado](../../src/app/relatorios/monthly-group-dashboard.tsx)
- [Filtros](../../src/app/relatorios/dashboard-filters.tsx)
- [Resultados por reunião](../../src/app/relatorios/meeting-results-section.tsx)
- [CSS global](../../src/app/globals.css)

## Sequência de trabalho

### 1. Análise e diagnóstico

Usar a skill local `analise-diagnostico` somente para investigação.

Registrar no resultado:

- evidências observadas;
- inferências;
- hipóteses;
- diagnóstico;
- limitações;
- caminhos e linhas dos arquivos examinados.

Não alterar código, instalar skills, criar fixture, modificar dados ou fazer deploy.

### 2. Fase 0: baseline

O baseline é um registro comparativo do estado atual. Ele não altera a aplicação.

Comparar:

- HTML externo;
- rota azul;
- relatório verde;
- medidas obtidas com Playwright;
- breakpoints atuais do verde;
- estados dinâmicos importantes;
- contratos de filtros, expansão, paginação e PDF.

O baseline deve conter:

- inventário visual da referência;
- inventário estrutural do relatório verde;
- tabela de correspondência entre componentes;
- tokens visuais identificados;
- diferenças comprovadas;
- riscos;
- pontos ainda não comprovados;
- critério de aceite da Fase 1.

Gate de aprovação: não iniciar alteração de código enquanto o baseline não estiver aprovado.

### 3. Especificação da Fase 1

Depois da aprovação do baseline, especificar a aplicação visual no relatório verde.

Para cada componente, registrar:

| Componente real | Referência visual | Alteração visual | Comportamento preservado | Arquivo provável |
| --- | --- | --- | --- | --- |
| Cabeçalho | Cabeçalho azul | Tipografia, cor, escala e espaçamento | Grupo e descrição dinâmicos | `monthly-group-dashboard.tsx` e `globals.css` |
| Filtros | Filtro azul | Dimensões, borda, raio e tipografia | Query params e submissão | `dashboard-filters.tsx` e `globals.css` |
| Métricas | Cards azuis | Cores, labels, números e espaçamento | Valores dinâmicos | `monthly-group-dashboard.tsx` e `globals.css` |
| Tabelas | Tabelas azuis | Cabeçalho, linhas, bordas e escala | Expansão e valores reais | `meeting-results-section.tsx` e `globals.css` |
| Conquistas | Cards azuis | Tokens, cards e tipografia | Valores e estados atuais | `monthly-group-dashboard.tsx` e `globals.css` |
| Rodapé | Rodapé azul | Cor, fonte e alinhamento | Período e grupo dinâmicos | `monthly-group-dashboard.tsx` e `globals.css` |

O escopo visual pode ser aplicado ao contexto do relatório Responsável, mas não deve alterar Admin, atas, login ou páginas públicas nesta fase.

### 4. Implementação local da Fase 1

Implementar somente depois da especificação aprovada.

Preservar explicitamente:

- `force-dynamic` do relatório verde;
- sessão autorizada e redirecionamentos;
- parâmetros `mes` e `ano`;
- `buildMonthlyDashboardData`;
- filtros reais;
- expansão por dia da semana;
- paginação quando aplicável;
- estados vazios;
- botão e fluxo de PDF;
- breakpoints do verde;
- rota azul sem alterações.

Não transformar o fixture azul em fonte de dados.

### 5. Validação local

Usar Playwright depois da implementação:

- desktop;
- tablet;
- mobile;
- sem overflow horizontal;
- medidas dos filtros;
- medidas dos cards;
- tipografia computada;
- cores e bordas;
- tabelas e estados vazios;
- expansão dos dias;
- filtros de mês e ano;
- PDF;
- comparação direta com a rota azul.

A rota verde requer uma sessão de Responsável com grupo para inspeção visual real. Sessão de Administrador pode redirecionar para `/admin/grupos`.

Gate de aprovação: apresentar screenshots, medidas e diferenças restantes antes de qualquer preview ou produção.

## Regras visuais

- Usar a família de fontes da referência, sem instalar uma fonte inexistente.
- Usar a tipologia azul em cores, escala, bordas, cards, filtros e tabelas.
- Manter os breakpoints do verde.
- Adaptar somente o necessário quando o conteúdo dinâmico exigir mais espaço.
- Derivar elementos ausentes do padrão visual mais próximo, sem criar uma linguagem paralela.
- Manter o tema claro no primeiro ciclo.
- Preservar o contrato próprio do PDF e da impressão.

## Skills e ferramentas

Sequência recomendada:

1. `analise-diagnostico`, para evidências e diagnóstico.
2. `stitch::extract-design-md`, somente se for necessário documentar automaticamente o sistema visual do código.
3. `migrate-design-system`, somente se a auditoria externa for necessária e estiver autorizada.
4. Playwright, para medidas e regressão visual.

Não instalar skills externas antes da aprovação do baseline.

## Critério de conclusão da Fase 1

A Fase 1 estará pronta para aprovação quando:

- o relatório verde continuar dinâmico e funcional;
- os dados reais permanecerem inalterados;
- filtros, expansão, paginação e PDF continuarem operacionais;
- a rota azul permanecer intacta;
- a tipologia visual estiver equivalente à referência;
- os breakpoints do verde forem preservados;
- não houver overflow inesperado;
- a validação Playwright estiver registrada;
- as diferenças restantes estiverem explicitamente identificadas.

Até esse gate, não fazer deploy de produção nem expandir a refatoração para outras áreas.
