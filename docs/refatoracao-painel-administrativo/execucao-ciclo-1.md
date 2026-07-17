# Execucao do Ciclo 1 - painel administrativo

Status: Ciclo 1 concluido tecnicamente; validacao visual autenticada pendente se desejada.

Regra: executar um tiro por vez. So avancar quando o checkpoint do tiro atual
estiver aprovado e o [registro de execucao](registro-execucao.md) atualizado.

## Tiro 1 - Estrutura base

Status: validado em 2026-07-16.

Objetivo: criar a estrutura visual base sem alterar dados nem acoes.

Arquivos afetados:

- `src/app/grupos/page.tsx`;
- `src/app/globals.css`;
- possiveis novos componentes em `src/app/grupos/`.

Tarefas:

- manter `requireAdminSession()`;
- manter `readAggregatedAtas()`;
- criar shell administrativo;
- criar sidebar com Grupos ativo e demais itens desabilitados;
- criar cabecalho `Administracao de grupos`;
- manter botao `Novo grupo` para `/grupos/novo`.

Criterios de aceite:

- `/grupos` carrega para admin;
- nao admin continua redirecionado;
- nenhum link quebrado foi criado;
- nenhum schema, Sheets ou Server Action foi alterado.

Testes:

- `npm run lint`;
- teste manual da rota `/grupos`;
- teste manual do link `/grupos/novo`.

Checkpoint:

- estrutura visual aparece sem quebrar listagem existente.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

## Tiro 2 - Resumo, abas e busca

Status: validado em 2026-07-16.

Objetivo: adicionar os controles de exploracao local dos grupos.

Arquivos afetados:

- `src/app/grupos/page.tsx`;
- componentes cliente do painel;
- `src/app/globals.css`.

Tarefas:

- calcular ativos, inativos e total;
- criar cards de resumo;
- criar tabs Ativos/Inativos/Todos;
- Ativos deve abrir por padrao;
- criar busca local por nome;
- combinar busca com aba ativa;
- criar estados de vazio e sem resultado.

Criterios de aceite:

- contadores batem com os dados carregados;
- aba Ativos e padrao;
- busca ignora maiusculas/minusculas;
- estado sem resultado e visivel;
- sem query string no Ciclo 1.

Testes:

- `npm run lint`;
- teste manual com busca existente;
- teste manual com busca sem resultado;
- teste manual alternando abas.

Checkpoint:

- filtros locais funcionam sem alterar a fonte de dados.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

## Tiro 3 - Lista e acoes

Status: validado em 2026-07-16.

Objetivo: substituir a tabela por listagem responsiva com acoes compactas.

Arquivos afetados:

- `src/app/grupos/group-list-actions.tsx`;
- componentes de lista;
- `src/app/globals.css`.

Tarefas:

- criar item responsivo de grupo;
- exibir nome, data de criacao quando util e status discreto na aba Todos;
- manter acoes existentes;
- usar icones com `aria-label` e `title`;
- confirmar antes de inativar;
- evitar acao de reativar no Ciclo 1;
- ajustar texto visual de inativar, evitando "Excluir".

Criterios de aceite:

- editar abre `/grupos/[grupoId]`;
- duplicar continua chamando `duplicateGrupoAction`;
- inativar continua chamando `deleteGrupoAction`;
- grupos inativos nao mostram reativacao;
- acoes cabem em desktop e mobile.

Testes:

- `npm run lint`;
- `npm run test`;
- teste manual de editar;
- teste manual de duplicar;
- teste manual de cancelar inativacao;
- teste manual de confirmar inativacao em ambiente seguro.

Checkpoint:

- acoes atuais funcionam com o novo layout.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

## Tiro 4 - Mobile e acabamento

Status: concluido tecnicamente em 2026-07-16.

Objetivo: finalizar responsividade, acessibilidade e validacao.

Arquivos afetados:

- `src/app/globals.css`;
- componentes criados no Ciclo 1;
- testes, se necessario.

Tarefas:

- revisar desktop, tablet e mobile;
- validar area de toque;
- validar foco visivel;
- validar tabs por teclado;
- ajustar nomes longos;
- revisar estados vazios;
- rodar lint e testes.

Criterios de aceite:

- sem overflow horizontal;
- todos os icones tem nome acessivel;
- itens desabilitados nao navegam;
- `npm run lint` passa;
- `npm run test` passa.

Testes:

- desktop;
- tablet;
- mobile;
- teclado;
- nomes longos;
- abas;
- busca;
- acoes.

Checkpoint:

- Ciclo 1 validado.

Condicao para encerrar:

- atualizar registro de execucao com resultado final e pendencias para ciclo
  posterior.
