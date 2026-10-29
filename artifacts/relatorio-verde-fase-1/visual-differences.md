# Diferenças visuais da Fase 1

| componente | baseline | resultado | diferença aceita | ação pendente |
| --- | --- | --- | --- | --- |
| Cabeçalho | verde e tipografia anterior | título `32px` como Histórico de atas; título `#0b3a7a`; eyebrow “Relatórios” `#1d4ed8` como os valores dos cards; descrição `#5b6675` e ação azul | não | nenhuma |
| Filtros | borda e controles verdes | superfície branca, borda `#dfe3e8`, raio `12px`, selects `14px` e PDF `#2b6cb0` | não | nenhuma |
| Servidores e resultados | cabeçalhos verdes | cabeçalhos claros `#f8fbff`, texto `#4f76a0` e bordas `#e4edf6` | não | nenhuma |
| Hover/foco dos dias | indicador verde escuro | indicador e texto `#0b3a7a` | não | nenhuma |
| Métricas e conquistas | cartões verdes | cartões brancos com borda `#dfe3e8` e valores azuis | não | nenhuma |
| Responsividade | breakpoints existentes | limites preservados; overflow horizontal medido como nulo nos viewports disponíveis | não | repetir matriz completa se o ambiente Playwright mudar a escala do viewport |
| Impressão | primeira geração deixou página 1 quase vazia | após `break-inside: auto` no sheet Responsável: 2 páginas A4, conteúdo distribuído sem clipping observado | não | nenhuma |

Evidências: `metrics-desktop.json`, `metrics-mobile-375.json`, `metrics-mobile-320.json`, `metrics-tablet-768.json`, `metrics-expanded-domingo.json`, `metrics-period-9-2026.json`, `hover-domingo.json`, `print-metrics.json`, `pdfinfo.txt`, `pdf-page-1.png` e `pdf-page-2.png`.
