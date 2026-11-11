# Padrões de layout e tipografia — GS Mapeamento

Este documento registra a aparência verificada de `/responsavel/relatorios` como referência dos elementos comuns do projeto e o padrão específico de cartão com barras horizontais observado no dashboard executivo do CSR Brasil Sul. Ele separa medidas renderizadas de decisões de reutilização para não atribuir a uma referência propriedades que ela não fornece.

## Hierarquia dos padrões

| Elemento | Referência principal | Aplicação registrada |
|---|---|---|
| Shell do Responsável, navegação, título da página, filtros e cartões de seção | `/responsavel/relatorios` | Cores, tipografia, contornos, dimensões e espaçamentos comuns. |
| Cabeçalho e contorno de tabelas equivalentes | `/responsavel/relatorios` | Reutilizar o cabeçalho azul com texto branco e o contorno claro nas tabelas das páginas refatoradas; adaptar conteúdo e geometria ao formato de cada tabela. Não usar a cor de cabeçalho do Painel Azul como se fosse a cor renderizada nesta rota. |
| Cartão com barras horizontais, como “Grupos por CSA” | CSR Brasil Sul · Santa Catarina — Dashboard executivo | Reutilizar o padrão de tipografia dos títulos, nomes e números, as barras e o hover. A superfície do cartão segue o padrão comum de Relatórios: fundo `#ffffff` e borda `#dfe3e8`. |

O padrão do CSR aplica-se a cartões com barras horizontais. Não define a tipografia de todos os outros cartões do sistema.

## Base verificada: Relatórios do Responsável

### Registro da medição

- Rota: `/responsavel/relatorios`, com o grupo exibido como “Grupo USL”.
- Renderização local medida no Playwright em 2026-11-02, nos viewports de 375 × 1000 e 1440 × 1000 CSS px.
- As larguras dos containers abaixo são as observadas nesta sessão. A barra de rolagem vertical reservou 15 px: a viewport de 375 px tinha largura útil de 360 px, e a de 1440 px, largura útil de 1425 px. Os layouts usam a largura útil disponível.
- Fonte principal do conteúdo e do shell de navegação: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. O corpo continua em Arial como fallback global para páginas fora do shell.

### Cores comuns

| Papel | Valor | Onde aparece |
|---|---|---|
| Fundo da página | `#fbfcff` | Área principal do relatório. |
| Superfície | `#ffffff` | Filtro, seções e cartões internos. |
| Texto principal | `#1c2430` | Títulos de seção e conteúdo. |
| Título do grupo e item ativo do menu | `#0b3a7a` | “Grupo USL” e “Relatórios” na navegação. |
| Azul de ação e destaque | `#1d4ed8` | Rótulo “RELATÓRIOS”, botão PDF, números e cabeçalho da tabela de Servidores. |
| Rótulos secundários | `#6e849a` | “MÊS”, “ANO” e rótulos dos cartões métricos e de conquistas. |
| Borda de filtros, seções e cartões | `#dfe3e8` | Contorno dos cinco containers principais e cartões internos. |
| Borda da tabela | `#e4edf6` | Contorno, divisórias e linhas da tabela; é mais clara que a borda dos containers. |
| Fundo do item ativo do menu | `#e6f1fa` | Destaque do item “Relatórios”. |
| Fundo da barra lateral | `#f5f9ff` | Navegação do Responsável. |

### Shell, navegação e cabeçalho

| Componente | Tipografia e cor | Geometria observada |
|---|---|---|
| Barra lateral | System UI 16 px/24 px; texto padrão `#17221c` | Desktop: 260 px de largura; borda direita de 1 px `#e4edf6`. Em mobile, transforma-se em barra superior; na medição 375 px, 73 px de altura, com borda inferior `#e4edf6`. Fundo `#f5f9ff`. |
| Item ativo “Relatórios” | System UI 16 px/24 px, peso 700, texto `#0b3a7a`, fundo `#e6f1fa` | Raio 8 px; padding horizontal 12 px. Desktop: 227 × 45 px. |
| Botão de menu mobile | Ícone `#1d4ed8`, fundo `#e6f1fa` | 44 × 44 px, raio 8 px. |
| Botão “Sair” | System UI herdada do menu; texto `#9b2c2c` e preenchimento `#f5e7e7`; sem borda em repouso | No hover e no foco por teclado, exibe contorno de 2 px `#9b2c2c`, deslocado 2 px, igual à geometria do padrão azul. A rota de comparação `/responsavel/relatorios-azul` preserva o estilo anterior. |
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

### Padrão inicial aprovado: botões e campos de uma linha

Este padrão foi fechado para orientar as refatorações página por página. Ele registra decisões aprovadas, não afirma que todas as páginas já o implementam.

| Variante | Fundo | Texto/ícone | Uso acordado |
|---|---|---|---|
| Azul preenchido | `#1d4ed8` | Branco | Ações como **Editar dados**, **Cadastrar** e **Adicionar**. |
| Azul claro | `#e6f1fa` | `#0b3a7a` | Ações como **Voltar** e **Cancelar**. As cores correspondem ao fundo e ao texto do item ativo/hover de Relatórios no menu. |
| Destrutiva | Vermelho semântico do contexto | Conforme o componente | Ações como **Excluir** permanecem visualmente destrutivas. |

- Altura padrão: 36 px para botões com texto e campos de uma linha (inputs e selects).
- Raio de referência: 8 px. Tipografia de botão: 14 px, peso 600, conforme o botão PDF de Relatórios.
- Campos de uma linha usam fundo branco, borda `1px solid #dfe3e8` e texto principal conforme o contexto visual da página.
- Textareas e controles somente com ícone podem ter geometria própria; documentar a exceção quando a página exigir.
- No menu de Relatórios, o estado hover/ativo tem fundo `#e6f1fa` e texto `#0b3a7a`; o contorno de foco é `2px solid #1d4ed8`. O contorno não é o fundo do botão.
- Este padrão ainda será aplicado gradualmente às páginas. Ao comparar uma página, registrar diferenças do código atual e preservar comportamentos e regras de negócio.

## Aplicação: preenchimento público de ata

- `/preencher/[link]` usa o mesmo padrão visual de `/atas/nova` no cabeçalho, cartões, campos e ações, sem a navegação do Responsável.
- O formulário permanece compartilhado. A apresentação pública é escopada em `.public-ata-page`; as regras de token, grupo fixo, validação e envio permanecem próprias do fluxo público.
- Em 2026-11-11, os estilos foram alinhados ao tema azul e branco: fundo `#fcfdff`, cartões brancos, bordas `#dfe3e8`, título `#0b3a7a`, rótulos `#6e849a` e ações `#1d4ed8` / `#e6f1fa`. No navegador, a rota foi conferida em 1137 px e 416 px CSS: não mostrou overflow horizontal nem menu; os nove cartões do formulário permaneceram dentro da largura disponível.

## Aplicação: Histórico de Atas

- Quando o container de filtros e tabela vem diretamente após o cabeçalho, o espaço entre eles é de 18 px, igual ao filtro de Relatórios. A margem superior do container é de 18 px e colapsa com a margem inferior do cabeçalho. O ajuste preserva a posição dos títulos e o espaçamento quando há um painel de aprovações intermediário.
- Em **Pendentes de revisão**, o texto de **Selecionar página** é branco sobre o cabeçalho azul `#1d4ed8`. O modal de aprovação usa fonte System UI, superfície branca, texto `#1c2430`, apoio `#6e849a`, borda `#dfe3e8`, **Cancelar** em azul-claro `#e6f1fa` e aprovação em azul `#1d4ed8`.

## Aplicação: Configurações do grupo

- Rota: `/grupos/[grupoId]`, variante Responsável do editor de grupo.
- A refatoração preserva a ordem e a estrutura dos dados, o formulário de edição, os acordeões **Servidores**, **Plataformas** e **Horários de Reunião**, os diálogos e os comportamentos atuais. Os estilos são limitados a essa variante da rota.
- A superfície da página usa `#fcfdff`; menu lateral/superior `#f8fbff`; item ativo de Configurações `#e6f1fa` com texto `#0b3a7a`; cartões brancos com borda `#dfe3e8` e raio 12 px.
- O título do grupo usa System UI 41.6 px/45.76 px, peso 700 e cor `#0b3a7a`, igual ao título de Relatórios. O texto auxiliar sob o título foi removido. O topo do cartão **Dados do Grupo** alinha com o topo do cartão de filtros em Relatórios. O rótulo da página e ícones de acordeão usam `#1d4ed8`; texto principal `#1c2430`; rótulos e descrições secundárias `#6e849a`.
- Inputs e selects de uma linha, inclusive nos diálogos, medem 36 px de altura, com borda `#dfe3e8` e raio 8 px. Botões com texto medem 36 px e usam 14 px/600: azul preenchido `#1d4ed8` para ações principais e azul claro `#e6f1fa`/`#0b3a7a` para Cancelar e ações secundárias. Controles somente com ícone preservam sua dimensão local.
- As tabelas de servidores e de horários usam cabeçalho `#1d4ed8`, texto branco em caixa alta, System UI 13.0133 px/16.2667 px, peso 700, e bordas/divisórias `#e4edf6`. Encargos e dias nas células que nomeiam a linha usam `#1c2430`, 14.9333 px/18.6667 px, peso 700; os valores usam `#1c2430`, 17.3333 px/21.6667 px, peso 400, exceto Hora de Início, que usa 14.9333 px a partir de 500 px. A largura e o alinhamento das colunas seguem o conteúdo de cada tabela.
- Em **Dados do Grupo**, os botões de acesso por e-mail, copiar link e rotacionar link medem 36 × 36 px, com ícones de 14 px, seguindo a altura e o ícone de **Editar**. E-mail alinha com Revisão de Atas; Link da ata alinha com Última reunião antes do sistema. Medição em 900 CSS px: todos os inputs/selects renderizados com 36 px de altura.
- **Desativar Plataforma** usa chevron para baixo quando fechado e para cima quando aberto, sem o marcador triangular nativo, na variante Responsável.
- **Associação de Horários** segue o mesmo padrão de chevron. Na tabela de **Servidores**, não há divisórias verticais no cabeçalho nem no corpo; as divisórias horizontais e o contorno externo permanecem. Editar/Remover têm fundo transparente em repouso; somente no hover exibem fundo azul-claro (`#e6f1fa`) ou vermelho-claro (`#f5e7e7`), respectivamente, preservando o contorno de foco por teclado.
- **Editar Dados** das plataformas e **Editar Horários** usam fundo `#e6f1fa` e texto/ícone `#0b3a7a`. **Cadastrar** mantém o azul preenchido.
- O estado das plataformas usa o mesmo tom cinza (`var(--muted)`) em **Cadastrada** e **Ainda não Cadastrada**, mantendo a distinção apenas pelo texto.
- O aviso temporário de alterações salvas usa fundo azul-claro `#e6f1fa`, texto e X `#0b3a7a`, sem badge no botão de fechar e altura mínima de 36 px. Na variante Responsável, ele desaparece após 3 segundos ou ao fechar; erros mantêm o estilo e o tempo próprios.
- Na tabela de **Horários de Reunião**, as células de horários usam uma área comum de 18.25 rem, centralizada na coluna; em telas menores, ela encolhe até a largura disponível. Todas as linhas mantêm a mesma borda esquerda e os horários ficam alinhados à esquerda dentro dessa área. Até 499 px, os dias e valores de Hora de Início usam 11.2 px; a linha do valor mantém 16 px e os pontos de plataforma medem 9 px. O título da seção e os cabeçalhos da tabela mantêm seus tamanhos, e as linhas continuam crescendo conforme o conteúdo.
- **Transferir Horário**, em Horários Associados, usa o ícone `faRightLeft`, igual a **Transferir Horários e Desativar**.
- Na tabela de **Horários de Reunião**, os valores de **Hora de Início** ficam alinhados à esquerda. Não há divisória vertical entre Dia e Hora de Início, inclusive no cabeçalho; contorno externo e linhas horizontais permanecem.
- Na edição de **Horários de Reunião**, todas as divisórias verticais entre Dia, Hora de Início, Hora de Término e Ações também são removidas, no cabeçalho e no corpo. As linhas horizontais permanecem como estão.
- Os botões de ação da tabela de edição de horários seguem Servidores: fundo transparente em repouso e badge somente no hover (azul-claro para editar, vermelho-claro para excluir), com foco por teclado preservado.
- Os ícones de ação de Servidores e Horários de Reunião medem 14 × 14 px, como o ícone de Editar em Dados do Grupo; essa medida é do ícone, não do padding.
- Na edição de horários do Responsável, o dia ocupa uma célula com `rowSpan` centralizada verticalmente no bloco. O padding entre horários do mesmo dia passa de 9.6 px para 3.7 px por lado interno, reduzindo a distância entre horários em aproximadamente 25% (47.15 → 35.38 px na conferência). Os lados externos mantêm 9.6 px; a passagem entre dias permanece em aproximadamente 48.26 px.

### Histórico de Encargos dos Servidores

Esta especificação cobre a variante Responsável de `/grupos/[grupoId]/servidores/historico`. A página usa o componente `MesaServersHistory`, compartilhado com a variante Admin; os estilos são limitados ao shell Responsável. A referência visual é Configurações do Grupo, com o item **Configurações** ativo.

Fontes da implementação: `src/app/grupos/mesa-servers-history.tsx`, `src/app/grupos/mesa-server-closure-dialog.tsx` e `src/app/globals.css`.

**Estado antes da aplicação do padrão azul**

- No desktop observado, a navegação lateral mede 260 px e a área principal 984 px. No viewport de 375 px, a navegação passa para a barra superior de 73 px, o cabeçalho empilha o botão **Voltar** abaixo do título e a área principal mede 343 px.
- O estado atual usa fundo bege `#f7f4ec` e Arial no corpo. A tabela tem sete colunas e largura mínima de 850 px; no viewport mobile observado, ela permanece em uma linha de cabeçalho e usa rolagem horizontal interna. A página não precisa rolar horizontalmente para exibir a tabela.
- O diálogo de correção é aberto pela ação em **Ações**. No viewport de 375 px, sua largura renderizada foi 351 px.

**Padrão visual aplicado**

- Aplicar à página inteira a paleta azul e branca de Configurações do Grupo: fundo `#fcfdff`, navegação `#f8fbff`, item ativo `#e6f1fa` com texto `#0b3a7a`, superfícies brancas, bordas de cartões `#dfe3e8`, texto principal `#1c2430` e rótulos secundários `#6e849a`. Preservar a geometria do shell e os breakpoints existentes.
- O título **Histórico de Encargos** usa System UI, 32 px, peso 700 e `#0b3a7a`. A descrição usa texto secundário. Manter o botão **Voltar** à direita no desktop e abaixo do cabeçalho em telas estreitas; usar estilo secundário azul-claro, altura 36 px, raio 8 px e foco visível.
- Preservar a ordem e os rótulos das sete colunas: **Encargo**, **Servidor**, **Desde**, **Até**, **Situação**, **Motivo do encerramento** e **Ações**. Em telas estreitas, manter a tabela completa com rolagem horizontal dentro de seu contêiner; não ocultar colunas nem converter linhas em cartões.
- A tabela fica em cartão branco com borda `#dfe3e8`, raio 12 px e padding de 12 px. A moldura interna da tabela mantém borda e divisórias `#e4edf6`, raio 8 px e conteúdo recortado nos cantos.
- Cabeçalhos usam System UI 13.0133 px/16.2667 px, peso 700, caixa alta, alinhamento central, fundo `#1d4ed8` e texto branco. Células usam System UI 14.9333 px/18.6667 px, padding vertical de 9.6 px e horizontal de 8.8 px, com alinhamento vertical central. **Encargo** fica em negrito; os demais valores, regulares. Encargo, Servidor e Motivo ficam à esquerda; datas, Situação e Ações ficam centralizadas.
- Motivos longos podem quebrar linha e aumentar a altura da linha. Situação usa etiquetas discretas, verde para **Ativo** e cinza para **Encerrado**. A mensagem **Nenhum encargo registrado.** fica centralizada dentro do cartão branco.
- A ação de corrigir mede 36 × 36 px, com ícone de 14 × 14 px; fica sem fundo em repouso, recebe fundo azul-claro no hover e foco azul visível.
- O diálogo preserva sua geometria, a ordem e a posição dos campos. Usa superfície branca, borda `#dfe3e8`, título `#0b3a7a` e rótulos/descrições `#6e849a`. Campos, selects e botões medem 36 px de altura e têm raio 8 px. **Salvar** usa azul `#1d4ed8`; **Cancelar**, azul-claro `#e6f1fa` com texto `#0b3a7a`.
- Incluir a explicação condicional quando o motivo selecionado for **Outro**, o estado de erro em vermelho semântico e os estados pendente/desabilitado durante o envio. **Voltar** e os botões do diálogo têm hover azul-claro e foco visível; **Sair** continua vermelho.
- Preservar elegibilidade da correção, conteúdo, ordenação, regras dos campos e demais comportamentos atuais. Não há uma variante de impressão ou PDF identificada para esta rota; este padrão cobre a página e o diálogo.
- Conferência visual local após a aplicação em 1525 × 788 e 375 × 812 CSS px. A página não apresentou rolagem horizontal; a tabela manteve largura mínima de 850 px e rolagem dentro do cartão. Em 375 px, o diálogo mediu 351 px; datas e controles permaneceram em uma linha. O campo condicional de **Outro** também foi exibido.

### Carregamento de Grupos

- O skeleton compartilhado de `/grupos` e `/admin/grupos` usa fundo `#fbfcff`, menu `#f5f9ff`, cartões brancos e animação horizontal em gradiente `#e6f1fa` → `#f5f9ff` → `#e6f1fa`, substituindo os tons bege anteriores.
- Os pontos e badges que identificam Zoom, Zello e WhatsApp mantêm suas cores. Estados ativos continuam verdes; ações destrutivas continuam vermelhas. Os cartões de plataforma usam superfície branca e borda `#dfe3e8`.
- Conferência visual local em 2026-11-05, no grupo USL, em 1280 × 900 e 390 × 844 CSS px. O viewport de 390 px teve 375 px de largura útil por causa da barra de rolagem vertical; a página e as tabelas conferidas não apresentaram rolagem horizontal. Foram conferidos dados do grupo, cartões de plataforma, tabelas de servidores e horários, edição de horários e diálogos de plataforma, servidor, e-mail e confirmação de exclusão.
- A responsividade preserva os breakpoints existentes (shell em 980 px; editor e cartões em 720 px; espaçamentos menores em 600 px; exceções globais de tabela/modal em 500 e 360 px). A mudança registra a aplicação visual e não altera essas transições.

### Hover de ações em menus e modais

- Itens de ação não destrutivos, como **Visualizar**, **Visualizar PDF** e **Editar**, mantêm os ícones azuis (`#0b3a7a`) também no estado normal. No hover e no foco por teclado, usam fundo `#e6f1fa`, texto/ícone `#0b3a7a` e contorno `2px solid #1d4ed8`. Em listas de menu, o contorno fica para dentro do item (`outline-offset: -2px`). Aplicar o mesmo padrão a listas de ações equivalentes nos demais modais.
- Ações destrutivas, como **Excluir**, mantêm o hover vermelho: fundo `#f5e7e7`, texto/ícone e contorno na cor destrutiva do contexto (`var(--danger)` neste projeto).
- O botão de três pontos que abre o menu não mostra badge em repouso. No hover do ponteiro, mostra fundo `#e6f1fa` e ícone `#0b3a7a`, sem contorno. O foco por teclado mantém um indicador visível.
- O CSS compartilhado de `.responsavel-action-menu-item` deve manter essas cores para os menus de ações; menus novos devem reutilizar esse padrão, com a exceção vermelha para ações destrutivas.

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
| Cabeçalho | System UI 13.0133 px/16.2667 px, peso 700, texto branco em caixa alta | Fundo `#1d4ed8`; padding vertical 9.6 px; divisórias verticais de 1 px `#e4edf6`. |
| Encargo | System UI 14.9333 px/18.6667 px, peso 700, `#1c2430` | Alinhado à esquerda. |
| Nome e Desde | System UI `calc(.85rem + 1pt)` (14.9333 px/18.6667 px com raiz de 16 px), peso 400, `#1c2430` | Centralizados; mesmo tamanho de Encargo em todas as larguras. |

A borda da tabela (`#e4edf6`) é distinta da borda dos containers (`#dfe3e8`). Em até 500 px, as colunas Encargo/Nome/Desde usam 34%/29%/37%, o padding horizontal cai para 6.4 px e a data não quebra de linha. No viewport de 375 px, os dados exibidos ficaram em uma linha e não houve rolagem horizontal.

#### PDF mensal do perfil Responsável

- A tabela de Servidores fecha o contorno interno com borda `1px solid #e4edf6`, raio de 8 pt e conteúdo recortado nos cantos arredondados.
- A tabela permanece dentro do cartão da seção; o contorno arredondado da tabela é independente do contorno externo do cartão.

### Tabela de Consolidados por Reunião

- Nas linhas de resumo por dia da semana, Dia da Semana e as colunas Presenças (total), Presenças (média) e Ingressos usam `calc(.85rem + 1pt)` (14.9333 px com raiz de 16 px).
- As células das linhas de horários expandidas também usam esse tamanho. A regra é constante em todas as larguras; os cabeçalhos mantêm seus tamanhos próprios.

#### PDF mensal do perfil Responsável

- Manter uma linha por horário configurado e agrupar dinamicamente as linhas de cada dia em uma única célula vertical; o nome do dia aparece uma vez, capitalizado (por exemplo, “Segunda”), em negrito e centralizado vertical e horizontalmente.
- Horário, Presenças, Média e Ingressos ficam centralizados horizontalmente nas respectivas colunas. Os dados por horário permanecem regulares e usam `#1c2430` com 60% de opacidade; o nome do dia usa `#1c2430` sem transparência.
- Usar Helvetica no PDF, aproximadamente 11.2 pt no corpo e 9.76 pt no cabeçalho. O cabeçalho permanece azul `#1d4ed8`, branco e em caixa alta; a separação entre Dia da Semana e Horário é uma barra branca visível. A tabela fecha o contorno interno com borda `1px solid #e4edf6`, raio de 8 pt e conteúdo recortado nos cantos.
- Este formato é específico do PDF; a tabela da página continua servindo como referência e não é alterada por essa regra.

### Exceção local: tabela de Histórico de Atas em telas estreitas

Este ajuste vale somente para `/responsavel/atas`; ele não define a largura das tabelas de outras páginas.

- Até 720 px, a coluna Horário fica oculta e a célula Data exibe `DD/MM | HH:mm`.
- A partir de 500 px, ATA, Status e Ações usam 64 px fixos cada. Data e Horário têm larguras iguais e flexíveis; de 500 a 720 px, Data ocupa o espaço restante enquanto Horário fica combinado nela. A tabela usa a largura disponível, sem rolagem horizontal.
- A partir de 500 px, os valores das células Ata, Data e Horário usam fonte de 14,93 px. Os cabeçalhos mantêm suas regras próprias: Ata em 11,5 px e Data/Horário em 13,0133 px.
- A partir de 500 px, todos os cabeçalhos e valores ficam centralizados em suas colunas. Conferido em 500, 655, 768, 1024 e 1438 px: as três colunas fixas mediram 64 px, Data e Horário dividiram igualmente o restante quando ambas estavam visíveis, e a página não apresentou rolagem horizontal.
- Abaixo de 500 px, a tabela ocupa a largura interna disponível, sem rolagem horizontal. Ata (48 px) e Ações (52 px) permanecem fixas e centralizadas. Data e Status dividem o espaço restante de forma fluida, na proporção 2:1.
- Abaixo de 500 px, os quatro cabeçalhos e os valores em todas as células ficam centralizados dentro de suas colunas, que permanecem completas. Data e horário ficam em uma linha. Ata, Data e Horário usam fonte de 12,5 px.
- Abaixo de 500 px, o ponto de Status mede 0,5625 rem; Ações usa fonte de 9,75 px, com botão dos três pontos de 22,5 px e ícone de 12 px. O botão mantém fundo transparente e recebe badge azul de 22,5 px no hover, sem contorno.
- Abaixo de 500 px, as linhas da tabela ficam com 33,19 px; o botão reduzido cabe nessa altura sem aumentar a linha.
- A geometria foi conferida no navegador em 320 px, 375 px e 499 px. A partir de 500 px, entra em vigor o esquema descrito acima. Os tamanhos tipográficos desta atualização não tiveram nova medição renderizada.

### Aplicação: detalhamento da ata em visualização e PDF

- Em `/atas/[ataId]`, Localidades nacionais inicia a coluna esquerda. Servidores, Localidades internacionais, Visitantes, Ingressos e Conquistas são distribuídos nessa ordem para a coluna que estiver mais baixa, conforme a altura estimada dos dados e cabeçalhos. A mesma regra de distribuição é usada pelo PDF da ata.
- Acima de 980 px, o detalhamento usa duas colunas. Até 980 px, a visualização reúne as tabelas em uma coluna na ordem definida.
- As tabelas de Localidades nacionais e Localidades internacionais usam **Total** como rótulo da coluna numérica.
- A folha A4 da ata usa fundo `#fcfdff`, cards brancos com contorno `#dfe3e8`, azul `#1d4ed8` e azul claro `#e6f1fa` nos destaques, seguindo os tokens comuns.
- O documento da ata usa páginas A4 em pé. A medição local em 1024 × 1466 CSS px mostrou 15 localidades nacionais à esquerda e as outras cinco tabelas empilhadas à direita; a largura útil medida foi 1009 px. Em 375 px, as tabelas ficaram em uma coluna, sem rolagem horizontal. O PDF da mesma ata foi renderizado em uma página A4.

### Aplicação: relatório mensal em visualização, impressão, PDF e e-mail

- Admin e Responsável mantêm seus conjuntos de dados e blocos próprios, seguindo o padrão visual azul comum: fundo `#fcfdff`, superfícies brancas, bordas `#dfe3e8`, texto principal `#1c2430`, rótulos `#6e849a` e ações, números e cabeçalhos de tabela em `#1d4ed8`.
- No PDF mensal do perfil Responsável, o Consolidado segue a ordem da página: par de cartões “Reuniões desde a Fundação” e “Data de Fundação do Grupo”, seguido pelas nove métricas em grade de três colunas. A data usa `DD/MM/AAAA`.
- A ordem das nove métricas é: Reuniões, Presenças, Média de Presenças, Conquistas, Visitantes, Ingressos, Cidades, Estados e Outros Países. Os cartões usam rótulos de 8.25 pt e valores de 22.5 pt; o cartão de data de fundação usa valor de 18 pt.
- No PDF mensal do perfil Responsável, Conquistas usa a grade de cartões de três colunas da página: oito categorias, com seus pontos coloridos, e o cartão “Total” no nono espaço. O ingresso permanece no cartão de Consolidado e não vira um cartão extra de Conquistas.
- Os cartões do Consolidado e de Conquistas usam superfície branca, borda `#dfe3e8`, raio de 9 pt, rótulos `#6e849a` a 8.25 pt e valores `#1d4ed8` a 22.5 pt; no perfil Admin permanecem as tabelas e métricas próprias.
- O relatório nativo PDF é A4 em pé, preserva o período selecionado e os dados próprios de cada perfil. Cada linha permanece inteira. A visualização do PDF e o anexo de e-mail usam a mesma renderização; a impressão da tela continua disponível com o CSS de impressão da rota.
- O envio manual por e-mail inicia com `email_acesso_grupo` e permite editar o destinatário antes de confirmar. Não há envio automático.
- Conferência local em `/responsavel/relatorios`: 984 CSS px de viewport, sem overflow horizontal; em 375 CSS px a largura útil foi 360 px e continuou sem overflow. Fundos de página/cartões/seções e botões foram conferidos pelos estilos computados. O endpoint do PDF retornou `200 application/pdf` para o grupo e período selecionados.

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
