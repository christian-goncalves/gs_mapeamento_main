---
name: refatorar-pagina
description: Planeja e executa refatorações visuais, uma rota por vez, no GS Mapeamento usando uma página de referência, documentação visual e inspeção do código.
---

# Refatorar uma página do GS Mapeamento

Use esta skill quando o usuário quiser alinhar visualmente uma página do GS Mapeamento a uma rota de referência, preservando o comportamento existente.

## Referências do projeto

Leia `AGENTS.md` e os documentos aplicáveis em `docs/`. Para o padrão visual comum, consulte [`docs/LAYOUT-TIPOGRAFIA.md`](../../../docs/LAYOUT-TIPOGRAFIA.md). Para a rota-alvo, leia a rota e a especificação local relacionada, se houver. Registros de layout são medições e decisões em evolução; confira o código e a renderização atuais antes de tratar um valor como implementado.

## Entrada e colaboração

O usuário pode informar somente a rota-alvo e, quando diferente da referência comum, a rota de referência. A referência atual para o shell do Responsável, navegação, títulos, filtros e cartões é `/responsavel/relatorios`.

O usuário pode também trazer sua leitura visual, screenshot ou anotações. Compare essas observações com o CSS/DOM e com o documento visual. Mostre divergências concretas, incluindo valor e origem, e feche decisões visuais com o usuário quando a preferência não estiver explícita. Não peça que ele descubra fatos que podem ser levantados no código ou na renderização.

Quando o pedido for debater ou fechar decisões, use rodadas de perguntas: pergunte todas as decisões independentes da rodada, recompute o que falta após as respostas e não implemente antes de o usuário confirmar o entendimento. Quando ele pedir diretamente uma alteração e o escopo estiver claro, avance sem criar uma etapa de aprovação desnecessária.

Trabalhe uma rota por vez. Registre padrões reutilizáveis em `docs/LAYOUT-TIPOGRAFIA.md`; detalhe diferenças locais na especificação daquela página, se necessário. Não altere outras rotas só porque compartilham componentes: identifique o alcance e mantenha a mudança isolada à página em andamento, salvo pedido explícito para ampliar.

## Padrões visuais já acordados

- Fundo de página: `#fcfdff`. Fundo da barra lateral/menu: `#f8fbff`; divisória do shell: `#e4edf6`.
- Cartões e containers principais: fundo `#ffffff`, borda de 1 px `#dfe3e8`, raio 12 px.
- Navegação ativa/hover de Relatórios: fundo `#e6f1fa`, texto `#0b3a7a`; o foco acrescenta contorno azul `#1d4ed8` de 2 px.
- Tabelas equivalentes devem seguir o cabeçalho de Servidores em Relatórios: fundo `#1d4ed8`, títulos em caixa alta com texto branco, fonte System UI 13.0133 px/16.2667 px, peso 700; padding vertical 9.6 px; divisórias verticais de 1 px `#e4edf6`. O contorno e as divisórias da tabela usam `#e4edf6`, 1 px e raio 8 px. Na referência, valores de Encargo usam System UI 14.9333 px/18.6667 px, peso 700, `#1c2430`; Nome e data usam 17.3333 px/21.6667 px, peso 400, `#1c2430`. Preserve os dados/colunas e ajuste a geometria para a tabela da página-alvo.
- Texto principal de seção/conteúdo: `#1c2430`; rótulos secundários do filtro: `#6e849a`.
- Botão azul preenchido: fundo `#1d4ed8`, texto e ícones brancos. Exemplos: **Editar dados**, **Cadastrar** e **Adicionar**.
- Botão azul claro: fundo `#e6f1fa`, texto/ícone `#0b3a7a`. Exemplos: **Voltar** e **Cancelar**. As cores vêm do fundo e texto do item ativo/hover de Relatórios no menu.
- Ações destrutivas, como **Excluir**, mantêm indicação vermelha.
- Botões com texto e campos de uma linha usam altura de 36 px. Textareas e controles somente com ícone podem ter exceções documentadas.
- A tipografia-base do botão é 14 px/600 e o raio de referência é 8 px, medidos no botão PDF de Relatórios.
- No hover/ativo do menu Relatórios, o fundo é `#e6f1fa`, o texto é `#0b3a7a` e o contorno de foco é `2px solid #1d4ed8`. Não confundir o contorno com o fundo.

Consulte o documento visual para medidas adicionais e limites de cada referência, incluindo espaçamentos, tipografia de títulos e seções, filtros e tabela de Servidores. Se uma página apresentar componente sem padrão acordado, derive uma proposta do elemento mais próximo e confirme-a com o usuário antes de torná-la regra compartilhada.

## Fluxo por página

1. Identifique rota-alvo e referência. Leia orientações do repositório, documentação visual e arquivos proprietários da página; localize estilos compartilhados que possam afetar outras rotas.
2. Inspecione a página em código e, se disponível, no navegador. Mapeie menu/shell, cabeçalho, filtros e campos, botões, cartões/seções, tabelas e estados relevantes.
3. Para cada elemento pertinente, compare família, tamanho, peso e cor de fonte; fundo; bordas; raio; altura/largura; padding/gap; estados hover/focus/disabled; e comportamento em breakpoints. Separe valor observado, decisão acordada, divergência atual e ponto ainda não confirmado.
4. Feche com o usuário decisões visuais que não estejam definidas nas referências. Preserve estrutura e semântica da página quando não forem parte do pedido.
5. Implemente apenas a rota acordada, preservando dados, autenticação, navegação, validação, regras de negócio, filtros, persistência no Google Sheets e comportamento de ações.
6. Faça a conferência visual nos tamanhos relevantes para a página e atualize o registro visual com valores realmente observados. Não declare um padrão global a partir de uma exceção local.

## Limites

- Não altere dados, regras de negócio, autenticação, contratos de rotas, persistência do Google Sheets ou fluxos de ações para resolver uma diferença visual.
- Não trate uma medição do código ou screenshot como decisão do usuário quando houver preferência em aberto.
- Não copie estilos da rota de referência sem conferir se são comuns ou específicos daquele componente.
- Preserve breakpoints existentes, a menos que o usuário peça para alterá-los.
