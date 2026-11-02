# Padrões de layout e tipografia — GS Mapeamento

Este documento registra a aparência verificada de `/responsavel/relatorios` como referência dos elementos comuns do projeto e o padrão específico de cartão com barras horizontais observado no dashboard executivo do CSR Brasil Sul. Ele separa medidas renderizadas de decisões de reutilização para não atribuir a uma referência propriedades que ela não fornece.

## Hierarquia dos padrões

| Elemento | Referência principal | Aplicação registrada |
|---|---|---|
| Shell do Responsável, navegação, título da página, filtros e cartões de seção | `/responsavel/relatorios` | Cores, tipografia, contornos, dimensões e espaçamentos comuns. |
| Cabeçalho e células das tabelas do relatório | `/responsavel/relatorios` | As bordas e a escala da tabela são próprias dela; não usar a cor de cabeçalho do Painel Azul como se fosse a cor renderizada nesta rota. |
| Cartão com barras horizontais, como “Grupos por CSA” | CSR Brasil Sul · Santa Catarina — Dashboard executivo | Reutilizar o padrão de tipografia dos títulos, nomes e números, as barras e o hover. A superfície do cartão segue o padrão comum de Relatórios: fundo `#ffffff` e borda `#dfe3e8`. |

O padrão do CSR aplica-se a cartões com barras horizontais. Não define a tipografia de todos os outros cartões do sistema.

## Base verificada: Relatórios do Responsável

### Registro da medição

- Rota: `/responsavel/relatorios`, com o grupo exibido como “Grupo USL”.
- Renderização local medida no Playwright em 2026-11-02, nos viewports de 375 × 1000 e 1440 × 1000 CSS px.
- As larguras dos containers abaixo são as observadas nesta sessão. A barra de rolagem vertical reservou 15 px: a viewport de 375 px tinha largura útil de 360 px, e a de 1440 px, largura útil de 1425 px. Os layouts usam a largura útil disponível.
- Fonte principal do conteúdo: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. O shell de navegação usa Arial.

### Cores comuns

| Papel | Valor | Onde aparece |
|---|---|---|
| Fundo da página | `#fcfdff` | Área principal do relatório. |
| Superfície | `#ffffff` | Filtro, seções e cartões internos. |
| Texto principal | `#1c2430` | Títulos de seção e conteúdo. |
| Título do grupo e item ativo do menu | `#0b3a7a` | “Grupo USL” e “Relatórios” na navegação. |
| Azul de ação e destaque | `#1d4ed8` | Rótulo “RELATÓRIOS”, botão PDF, números e cabeçalho da tabela de Servidores. |
| Rótulos secundários | `#6e849a` | “MÊS”, “ANO” e rótulos dos cartões métricos e de conquistas. |
| Borda de filtros, seções e cartões | `#dfe3e8` | Contorno dos cinco containers principais e cartões internos. |
| Borda da tabela | `#e4edf6` | Contorno, divisórias e linhas da tabela; é mais clara que a borda dos containers. |
| Fundo do item ativo do menu | `#e6f1fa` | Destaque do item “Relatórios”. |
| Fundo da barra lateral | `#f8fbff` | Navegação do Responsável. |

### Shell, navegação e cabeçalho

| Componente | Tipografia e cor | Geometria observada |
|---|---|---|
| Barra lateral | Arial 16 px/24 px; texto padrão `#17221c` | Desktop: 260 px de largura; borda direita de 1 px `#e4edf6`. Em mobile, transforma-se em barra superior; na medição 375 px, 73 px de altura, com borda inferior `#e4edf6`. Fundo `#f8fbff`. |
| Item ativo “Relatórios” | Arial 16 px/24 px, peso 700, texto `#0b3a7a`, fundo `#e6f1fa` | Raio 8 px; padding horizontal 12 px. Desktop: 227 × 45 px. |
| Botão de menu mobile | Ícone `#1d4ed8`, fundo `#e6f1fa` | 44 × 44 px, raio 8 px. |
| Rótulo da página “RELATÓRIOS” | System UI 12.8 px/19.2 px, peso 700, `#1d4ed8` | Caixa alta. |
| Nome do grupo “Grupo USL” | System UI 41.6 px/45.76 px, peso 700, `#0b3a7a` | Sem margem própria; mantém o espaçamento definido pelo bloco do cabeçalho. |

### Filtro de período

O filtro é o primeiro dos cinco containers principais: **filtro**, **Servidores**, **Consolidado**, **Consolidados por Reunião** e **Conquistas**.

| Propriedade | Valor observado |
|---|---|
| Fundo, borda e raio | `#ffffff`; 1 px `#dfe3e8`; raio 12 px. |
| Padding e espaçamento interno | 12 px de padding; 12 px de gap entre colunas. |
| Tamanho do container | 984 × 86 px em 1440 px; 328 × 86 px em viewport 375 px na sessão medida. |
| Rótulos “MÊS” e “ANO” | System UI 12 px/18 px, peso 600, `#6e849a`; caixa alta. |
| Seletores | 14 px, peso 600; fundo branco; borda 1 px `#dfe3e8`; raio 8 px; altura 36 px; padding horizontal 12 px. |
| Botão PDF | Texto/ícone branco sobre `#1d4ed8`; raio 8 px. Altura 37 px no desktop e botão quadrado 36 × 36 px no mobile. |
| Relação com a primeira seção | 24 px entre o fim do filtro e o início de Servidores. |

No mobile, os seletores ocupam duas colunas e o PDF vira um botão compacto sem rótulo. No desktop, mês e ano dividem a largura disponível e o botão PDF mantém o rótulo. O container conserva a largura do conteúdo disponível, sem rolagem horizontal.

### Seções e cartões de métricas

Os quatro containers de seção repetem o mesmo padrão de superfície. Somados ao filtro, formam os cinco containers principais da página.

| Propriedade | Valor observado |
|---|---|
| Fundo, contorno e raio | Fundo `#ffffff`; borda 1 px `#dfe3e8`; raio 12 px. |
| Padding e gap | 12 px de padding; 12 px de gap entre elementos da seção. |
| Gap entre seções | 24 px. |
| Título de seção | System UI 25.92 px/31.104 px, peso 700, cor `#1c2430`. |
| Cartões de métrica e conquistas | Fundo branco; rótulo 11 px/13.2 px, peso 600, cor `#6e849a`; número 30 px/30 px, peso 700, cor `#1d4ed8`. |

As seções observadas são “Servidores”, “Consolidado”, “Consolidados por Reunião” e “Conquistas”. A largura foi 984 px no viewport desktop de 1440 px e 328 px no viewport mobile de 375 px. A altura depende do conteúdo e da quebra de títulos; não é token fixo.

### Tabela de Servidores

| Parte | Tipografia e cor | Borda e espaçamento |
|---|---|---|
| Container da tabela | — | Borda externa e divisórias `#e4edf6`, 1 px; raio 8 px. |
| Cabeçalho | System UI 13.0133 px/16.2667 px, peso 700, texto branco | Fundo `#1d4ed8`; padding vertical 9.6 px. |
| Encargo | System UI 14.9333 px/18.6667 px, peso 700, `#1c2430` | Alinhado à esquerda. |
| Nome e data | System UI 17.3333 px/21.6667 px, peso 400, `#1c2430` | Centralizados. |

A borda da tabela (`#e4edf6`) é distinta da borda dos containers (`#dfe3e8`). Em até 500 px, as colunas Encargo/Nome/Desde usam 34%/29%/37%, o padding horizontal cai para 6.4 px e a data não quebra de linha. No viewport de 375 px, os dados exibidos ficaram em uma linha e não houve rolagem horizontal.

### Espaçamentos principais

- Conteúdo mobile medido: 16 px de margem lateral da página; conteúdo do card começa a 13 px da borda do card por causa do padding de 12 px mais a borda.
- Conteúdo desktop medido: início em x = 288 px; largura principal de 984 px.
- Cabeçalho até filtro: 18 px entre o fim da caixa do título do grupo e o início do filtro.
- Filtro até Servidores: 24 px.
- Gap entre seções: 24 px.
- Padding interno dos containers: 12 px; gap interno: 12 px.

## Padrão específico: cartão com barras horizontais

### Identificação e fonte

- Página: **CSR Brasil Sul · Santa Catarina · Dashboard executivo**.
- Título interno do gráfico: **Grupos por CSA**.
- Referência visual: [dashboard executivo CSR Brasil Sul](https://claude.ai/artifact/341wLrtQZyEubcBmrc8o9K).
- O código local indicado, `docs/Painel de NA no Brasil (Copy)/index.html`, é a página do mapa do Brasil que encaminha para os dashboards estaduais. Não contém o cartão “Grupos por CSA”; o cartão foi medido na página do CSR aberta no navegador.

### Tipografia e estrutura do gráfico

| Elemento | Tipografia e cor | Comportamento/medida observada |
|---|---|---|
| Título “Grupos por CSA” | System UI 14 px/19.6 px, peso 700, `#0b3a7a` | Margem inferior de 8 px. |
| Nome do CSA | System UI 12 px/16.8 px, peso 400, `#12263f` | Nome longo fica truncado com reticências na linha; atributo `title` conserva o nome completo. |
| Valor numérico | System UI 12 px/16.8 px, peso 700, `#12263f` | Coluna alinhada à direita. |
| Trilha da barra | Fundo `#bfdbfe`, altura 12 px, raio 6 px | Recorta o preenchimento dentro da trilha. |
| Preenchimento da barra | `#1d4ed8`, raio 6 px | Largura proporcional ao valor da categoria; a maior categoria ocupa 100%. |
| Espaço entre linhas | — | 8 px de margem inferior por linha. |

### Hover observado

Ao passar o mouse por uma linha, o fundo da linha inteira muda para `#bfdbfe`. O hover foi ativado e conferido visualmente no navegador. Não aparece um balão customizado com o valor; o nome do CSA tem o atributo `title` com o texto completo, sujeito à tooltip nativa do navegador.

### Superfície do cartão

Na referência CSR, o cartão foi renderizado com fundo `#ffffff`, borda `#d5e0ec` de 1 px, raio 12 px e padding 12 px vertical/14 px horizontal. Para o padrão comum deste projeto, usar o fundo e o contorno de Relatórios (`#ffffff` e `#dfe3e8`); manter do CSR a tipografia, as barras e o hover específicos deste tipo de gráfico.

## Correções em relação ao registro anterior

| Registro anterior | Renderização verificada | Ajuste neste documento |
|---|---|---|
| Fundo da página `#fafafa` | `#fcfdff` | Atualizado para a cor medida na rota. |
| Cabeçalho de tabela `#f8fbff` com texto `#4f76a0` | Tabela Servidores: fundo `#1d4ed8`, texto branco | Separado do cabeçalho do Painel Azul. |
| Rótulos de Mês/Ano e cartões sem descrição tipográfica completa | Labels 12 px/600 no filtro e 11 px/600 nos cartões, ambos `#6e849a` | Registrados em seções distintas. |
| Bordas descritas sem distinguir contêiner e tabela | Contêineres `#dfe3e8`; tabela `#e4edf6` | Registradas pelos papéis correspondentes. |
| Nenhum padrão de gráfico e hover | Referência CSR: tipografia de gráfico, trilho/preenchimento e destaque de linha no hover | Adicionada como variante de cartão com barras horizontais. |

## Escopo e limites desta base

- Os valores do relatório foram medidos na rota local e refletem a versão renderizada em 2026-11-02. Alturas de seção e medidas internas podem variar conforme conteúdo, viewport ou dados.
- O HTML local do mapa contém o hover dos estados e seus próprios cartões, mas não é o código-fonte do dashboard executivo CSR Brasil Sul.
- As medidas do gráfico CSR vêm da renderização aberta e inspecionada no navegador. Os estilos computados confirmam o estado normal e o hover da primeira linha.
- Este documento padroniza aparência. Não altera dados, regras, autenticação, Google Sheets ou comportamento dos filtros do relatório.
