# Refatoracao - Aba Atas do responsavel

Data: 2026-07-17

## Decisao registrada

A rota atual `/grupos/[grupoId]` representa, para o responsavel pelo grupo, a
tela de configuracoes do grupo. Esta rota nao deve ser tratada como a aba
principal de atas nesta etapa.

A primeira refatoracao da area do responsavel deve recair sobre a aba **Atas**
do menu lateral, seguindo o layout de referencia em
`docs/layout/layout-responsavel-GRUPO.png`.

Depois que a tela de Atas estiver implementada e validada, a tela de
Configuracoes podera ser refatorada em etapa propria.

## Roteamento contratado

- `/responsavel/atas`: nova tela principal de atas do responsavel;
- `/responsavel`: redireciona para `/responsavel/atas`;
- `/meu-grupo`: permanece como compatibilidade e redireciona para
  `/responsavel/atas`;
- `/grupos/[grupoId]`: permanece como tela atual de configuracoes do grupo para
  o responsavel.

## Escopo da implementacao

- Implementar somente a aba Atas do responsavel;
- usar o layout visual do PNG;
- exibir cards com:
  - total de atas do grupo;
  - total de atas no mes atual;
  - servidores unicos nas atas do grupo;
- exibir tabela com:
  - data;
  - horario;
  - servidor;
  - status;
  - acoes;
- manter visualizacao de ata em `/atas/[ataId]`;
- manter editar e excluir como placeholders desabilitados ate ciclo proprio.

## Fora de escopo

- Refatorar a tela de Configuracoes;
- alterar schemas;
- alterar contrato Sheets;
- alterar autenticacao;
- alterar permissoes;
- alterar payloads;
- implementar edicao real de ata;
- implementar exclusao real de ata;
- instalar `datatables.net`.

## Decisao tecnica

Nao instalar `datatables.net` nesta etapa. A busca, filtros e paginacao devem
ser implementados com React nativo, para evitar dependencia jQuery/DOM
imperativo em uma tela Next.js App Router.

## Decisao tecnica posterior

Por solicitacao posterior, a tabela da aba Atas do responsavel passa a usar
DataTables. A integracao deve ser feita pelos pacotes oficiais
`datatables.net-react` e `datatables.net-dt`, mantendo o controle de dados pelo
React e evitando uso direto de jQuery/DOM imperativo no componente.

As abas customizadas permanecem como filtro visual da tela. Busca, ordenacao,
seletor de quantidade por pagina e paginacao passam a ser controles nativos do
DataTables.

## Validacao da implementacao

- `npm run lint`: passou;
- `npm run test`: passou, 19 arquivos e 139 testes;
- `git diff --check`: passou;
- `npm run build`: compilou, mas falhou no type check por pendencia
  preexistente em `scripts/reset-ata-record-sheets.ts:113`.

## Refatoracao responsiva do DataTables

Decisao aprovada em 2026-07-30 para `/responsavel/atas`:

- manter o DataTables e o formato de tabela;
- aplicar a apresentacao compacta de status e acoes em Mobile, Tablet e
  Desktop;
- eliminar a rolagem horizontal em uso normal no Mobile;
- usar `13px` nas celulas e cabecalhos Mobile, `14px` no Tablet e preservar
  `16px` no Desktop;
- apresentar data e horario no Mobile como `31-08 | 21:30`;
- manter Data e Horario em colunas separadas acima de `720px`;
- representar o status por circulo colorido com texto acessivel e legenda:
  verde para `Enviada`, amarelo para `Pendente de revisao` e vermelho para
  `Nao enviada`;
- substituir os quatro botoes por um menu unico de acoes, mantendo
  `Visualizar` disponivel e PDF, Editar e Excluir indisponiveis;
- manter `Mostrar X registros` e `Buscar` lado a lado no mesmo container;
- manter as opcoes de 10, 25 e 50 registros;
- ocultar somente `Primeira` e `Ultima` na paginacao Mobile;
- preservar busca, ordenacao, quantidade, paginacao, abas e rotas existentes.

### Limites

- A compactacao pertence somente a card de atas do responsavel. A tabela
  administrativa nao recebe as larguras Mobile desta etapa.
- Nao alterar schemas, payloads, autenticacao, permissoes ou Google Sheets.
- Nao implementar PDF, edicao ou exclusao.
- Preservar as alteracoes preexistentes no worktree.

### Criterios de aceite

- a tabela nao produz rolagem horizontal com dados normais entre `320px` e
  `720px`;
- Ata, Data/Hora, Preenchido por, Status e Acoes permanecem simultaneamente
  visiveis;
- nomes longos sao truncados sem alargar a tabela e mantem acesso ao valor
  completo;
- o menu de acoes abre por mouse, toque e teclado, fecha por clique externo ou
  `Escape` e nao e cortado pelo container;
- cor nao e a unica forma de identificar o status;
- busca, ordenacao, seletor, abas e paginacao continuam funcionais;
- Tablet e Desktop permanecem funcionais;
- validar visualmente `320`, `360`, `390`, `400`, `425`, `720`, `721`, `980`
  e uma largura Desktop;
- executar `npm run test`, `npm run lint`, `npm run build` e
  `git diff --check`.

### Resultado da implementacao

Validado em 2026-07-30 na rota autenticada:

- overflow horizontal igual a zero em `320`, `360`, `390`, `400`, `425`,
  `720`, `721`, `980` e `1280px`;
- fonte computada de `13px` no Mobile, `14px` no Tablet e `16px` no Desktop;
- `Mostrar X registros` e `Buscar` lado a lado e sem sobreposicao;
- alternancia de 10 para 25 registros, busca por ata, abas e ordenacao
  funcionais;
- menu de acoes dentro da viewport, com Visualizar disponivel, tres itens
  indisponiveis e fechamento por `Escape`;
- `npm run test`: 30 arquivos e 213 testes passaram;
- `npm run lint`, `npm run build` e `git diff --check`: passaram.
