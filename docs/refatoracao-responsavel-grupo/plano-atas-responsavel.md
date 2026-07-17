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
