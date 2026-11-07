# Leitura das ações do Histórico de Atas do Responsável

## Objeto da investigação

Leitura dos quatro comandos da coluna **Ações** em `/responsavel/atas`: **Visualizar**, **Visualizar PDF**, **Editar** e **Excluir**, com foco nos modos de revisão, visualização, PDF, edição e confirmação de exclusão acessados a partir do histórico.

## Contexto

O usuário indicou, junto a capturas do menu de ações, que os modos de revisão, visualização, PDF, edição e a confirmação de exclusão ainda seguem o padrão visual antigo. Esta etapa identifica o que o código compartilha entre o histórico e outras entradas, registra os padrões disponíveis e prepara uma sequência para planejar a execução. Nenhuma implementação ou teste foi realizado.

## Evidências examinadas

- Capturas fornecidas na conversa: listagem de Histórico de Atas com os itens Visualizar, Visualizar PDF, Editar e Excluir destacados individualmente.
- `src/app/responsavel/atas/page.tsx:16-23,42-55,98-107`: seleção do modo histórico e construção/renderização da tabela e do painel de revisão.
- `src/app/responsavel/atas/responsavel-atas-table.tsx:187-243`: menu e destinos dos quatro comandos; a cópia local deste arquivo já contém alterações não commitadas.
- `src/app/atas/[ataId]/page.tsx:44-47,49-124`: página compartilhada de visualização e retorno ao histórico.
- `src/app/atas/[ataId]/editar/page.tsx:53-103`: edição por formulário compartilhado, com nova versão e preservação da anterior.
- `src/app/atas/[ataId]/pdf/page.tsx:12-63`: página de pré-visualização com iframe do PDF e ações próprias.
- `src/app/atas/ata-delete-action.tsx:9-71`: confirmação de exclusão, motivo obrigatório, confirmação explícita e preservação histórica.
- `src/app/globals.css:508-594,880-918`: estilos globais atuais para modal, visualização da ata, menu de ações e comandos da página de visualização.
- `docs/LAYOUT-TIPOGRAFIA.md:65-84`: padrão acordado de botões/campos e espaçamento da listagem do Histórico de Atas.
- `docs/PDFs.md`: registro curto de rotas que entregam PDF.
- Estado do Git consultado nesta sessão: há alterações locais pré-existentes, inclusive em `src/app/responsavel/atas/responsavel-atas-table.tsx`, `src/app/responsavel/atas/responsavel-atas-data.ts` e `src/app/globals.css`; foram preservadas.

## Estado observado

- `historico=1` seleciona o modo histórico, mas a página usa a mesma tabela de atas do modo atual, parametrizada com `historyMode`.
- **Visualizar** abre `/atas/[ataId]`, a página `AtaReviewLayout`. O código distingue o retorno ao histórico pelo parâmetro `origem=historico`.
- **Visualizar PDF** abre `/atas/[ataId]/pdf`, que mostra a prévia em iframe e oferece voltar, baixar e enviar por e-mail.
- **Editar** abre `/atas/[ataId]/editar` e reutiliza `AtaForm`; o texto da página informa que a edição gera nova versão e preserva a anterior no histórico.
- **Excluir** abre `AtaDeleteAction`, um modal de confirmação que exige motivo e confirmação explícita. A mensagem informa que registro e dados vinculados permanecem no histórico.
- A página de visualização, a página PDF e a edição não recebem um tema ou variante próprios de histórico. Portanto, compartilham componentes com entradas externas ao menu do histórico.
- O padrão escrito disponível fixa azul preenchido `#1d4ed8`, ações secundárias `#e6f1fa`/`#0b3a7a`, vermelho semântico para exclusão, altura de 36 px para controles com texto e raio de 8 px. A aplicação de Histórico de Atas documenta apenas o espaçamento entre cabeçalho e filtros/tabela; não há especificação completa das quatro telas de destino.
- A folha global atual ainda contém cores e superfícies verdes em `.ata-review-page`, ícones e cartões de revisão, enquanto botões específicos da página de visualização têm regras próprias. Isso é evidência de que esses destinos não foram integralmente migrados para o padrão azul documentado; não comprova, isoladamente, cada diferença renderizada.
- A captura comprova a composição do menu e o realce de cada item, mas não mostra os destinos após o clique. A alegação de aparência antiga dos modos é fornecida pelo usuário e ainda não foi verificada ao vivo nesta análise.

## Análise

Os quatro itens não correspondem a quatro implementações visuais independentes. O menu da tabela é um ponto de entrada; três destinos são páginas compartilhadas e a exclusão é um componente de confirmação reutilizável pelo mesmo menu. Uma alteração ampla de estilos nesses componentes pode afetar acessos à visualização, ao PDF ou à edição vindos de outras áreas. O limite visual precisa ser definido antes de alterar código.

Há dois escopos possíveis para o item PDF: a interface da página de pré-visualização e o documento PDF renderizado. `PDFs.md` registra a rota, mas não fornece especificação visual do conteúdo do documento. A captura fornecida não permite decidir se ambos estão incluídos.

O modo de revisão também precisa ser distinguido da visualização de uma ata salva. A listagem renderiza `AtaApprovalPanel` antes da tabela quando existem atas pendentes; o comando **Visualizar** abre outra rota, baseada em `AtaReviewLayout`. A evidência atual não demonstra se “modo de revisão” na lista do usuário significa esse painel de aprovação, a tela de revisão da ata, ou ambos.

## Hipóteses avaliadas

- **Sustentada:** boa parte do legado visual está em componentes globais compartilhados, em vez de estar restrita ao modo histórico. Os destinos apontam para páginas e componentes sem variante de histórico, e os estilos ficam em `globals.css`.
- **Ainda não confirmada:** o arquivo PDF gerado também precisa de redesign. A referência disponível só identifica a prévia; não define se o documento é parte do escopo.
- **Ainda não confirmada:** “modo de revisão” nomeia o painel de aprovação, a tela `AtaReviewLayout` ou ambos. A descrição e as capturas não mostram esse estado.

## Diagnóstico

O menu de quatro ações está identificado e encaminha para três superfícies compartilhadas (visualização/revisão, prévia PDF e edição) e um modal de exclusão. O padrão visual aprovado já oferece tokens para botões, campos e ações destrutivas, mas não existe uma especificação de página para esses destinos. Assim, o trabalho restante é uma migração visual com escopo de reutilização a decidir; não é possível atribuir todos os estilos antigos apenas ao Histórico de Atas sem também avaliar o efeito sobre outras entradas.

## Grau de certeza

Alto quanto aos destinos, compartilhamento dos componentes e padrões documentados, pois foram confirmados no código e nos documentos locais. Médio quanto à aparência antiga renderizada: a captura cobre somente a listagem e o menu, e os destinos não foram abertos nesta sessão.

## Pontos ainda não comprovados

- A pasta de diretrizes referida pelo `AGENTS.md` da mensagem (`/home/cg/Documentos/01-DEV/PROJETOS/Apps/02-GS_Mapeamento/docs/`) não está disponível neste ambiente. Foi possível ler a documentação `docs/` do checkout atual.
- Não houve inspeção ao vivo das páginas depois de acionar os itens; a aparência renderizada nos modos de destino precisa de conferência quando começar a etapa visual.
- O escopo do PDF (interface da prévia, conteúdo do documento, ou ambos) e o significado exato de “modo de revisão” permanecem abertos.
- A revisão visual dos destinos deve distinguir o estado atual do repositório das alterações locais já não commitadas.

## Sequência de planejamento para a próxima etapa

1. **Visualizar / revisão:** decidir se a referência é a página `AtaReviewLayout`, o painel de aprovação, ou os dois; registrar um estado-alvo comum e como o botão Voltar preserva a origem histórica.
2. **Visualizar PDF:** fechar se o escopo é a barra/iframe da prévia, o PDF gerado, ou ambos. Se forem ambos, tratar a interface e o documento como entregas separadas.
3. **Editar:** planejar a migração visual do cabeçalho e do `AtaForm` na variante de edição, definindo como limitar o efeito sem mudar a criação de atas.
4. **Excluir:** planejar o modal e seus estados normal, erro, envio e cancelamento, mantendo motivo obrigatório, confirmação explícita e cores destrutivas semânticas.
5. **Validar cada entrega isoladamente:** comparar a tela alvo, verificar acessibilidade visual básica e navegação/responsividade no navegador, e confirmar que as regras funcionais do fluxo permaneceram intactas.

Esta sequência é uma proposta para discussão, não uma autorização para iniciar as alterações.
