# Execucao do Ciclo 3 - responsividade, acessibilidade e acabamento

Status: Ciclo 3 implementado parcialmente; Tiros 1, 2 e 3 validados. Tiro 4
executado com bloqueios de fechamento.

Regra: executar um tiro por vez. So avancar quando o checkpoint do tiro atual
estiver aprovado e o [registro de execucao](registro-execucao.md) atualizado.

## Tiro 1 - Sidebar responsiva

Objetivo: definir e implementar o comportamento definitivo da sidebar em
desktop, tablet e mobile.

Status: validado em 2026-07-16.

Pre-condicoes:

- Ciclos 1 e 2 validados.
- Pendencia de build preexistente registrada.
- Nenhuma mudanca de rota `/admin/*` autorizada neste tiro.

Arquivos afetados:

- `src/app/grupos/admin-shell.tsx`;
- `src/app/globals.css`;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/decisoes.md`, se houver decisao.

Tarefas:

- revisar comportamento desktop atual da sidebar;
- revisar breakpoint existente `@media (max-width: 720px)`;
- decidir se ha necessidade de breakpoint intermediario para tablet;
- manter `Grupos` ativo com `aria-current`;
- manter itens futuros desabilitados sem navegacao;
- garantir `title` e `aria-label` em itens compactos;
- validar `Sair` em desktop e mobile;
- evitar overflow horizontal na navegacao.

Criterios de aceite:

- sidebar desktop permanece legivel;
- tablet tem estrategia definida e testada;
- mobile usa icones compactos sem perder nome acessivel;
- itens desabilitados nao navegam;
- `Sair` continua funcional;
- foco visivel permanece claro;
- sem alteracao de rotas ou permissoes.

Testes:

- `npm run lint`;
- teste manual em desktop;
- teste manual em largura tablet;
- teste manual em mobile;
- teste de teclado na navegacao;
- `git diff --check`.

Checkpoint:

- sidebar validada nos tres tamanhos.
- desktop preserva sidebar lateral com labels.
- tablet usa sidebar colapsada com icones entre 721px e 980px.
- mobile mantem navegacao compacta horizontal.
- drawer nao foi criado.
- `npm run lint` passou.
- `git diff --check` passou.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- reverter alteracoes em `admin-shell.tsx` e `globals.css`;
- manter documentos com registro do rollback, se ocorrer.

## Tiro 2 - Lista e acoes mobile

Objetivo: garantir que lista, nomes longos e acoes por icone funcionem em telas
pequenas sem overflow.

Status: validado em 2026-07-16.

Pre-condicoes:

- Tiro 1 validado.
- Estrategia de sidebar nao conflita com a area de conteudo.

Arquivos afetados:

- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/globals.css`;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/decisoes.md`, se houver decisao.

Tarefas:

- testar nomes longos de grupos;
- revisar `overflow-wrap` e `min-width`;
- validar cards em desktop, tablet e mobile;
- manter acoes por icone visiveis;
- registrar decisao final sobre menu de tres pontos;
- garantir area minima de toque;
- confirmar que visualizar, editar, duplicar e ativar/inativar continuam
  acessiveis;
- evitar scroll horizontal.

Criterios de aceite:

- nomes longos nao quebram layout;
- acoes cabem ou quebram linha de forma controlada;
- botoes preservam `aria-label` e `title`;
- botoes possuem area de toque adequada;
- nao ha menu ocultando acao essencial sem decisao registrada;
- sem alteracao de Server Actions.

Testes:

- `npm run lint`;
- teste manual com nome longo;
- teste manual em mobile;
- teste manual de grupo ativo;
- teste manual de grupo inativo;
- `git diff --check`.

Checkpoint:

- lista e acoes mobile validadas.
- nomes longos continuam contidos por `min-width: 0` e quebra de linha.
- acoes por icone permanecem visiveis no mobile.
- menu de tres pontos nao foi adotado.
- `npm run lint` passou.
- `git diff --check` passou.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- reverter ajustes da lista, mantendo Server Actions do Ciclo 2.

## Tiro 3 - Acessibilidade e estados

Objetivo: revisar acessibilidade de tabs, foco, teclado e estados de loading,
erro, vazio e operacao em andamento.

Status: validado em 2026-07-16.

Pre-condicoes:

- Tiros 1 e 2 validados.
- Sem regressao conhecida em acoes administrativas.

Arquivos afetados:

- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/globals.css`;
- possivelmente `src/app/grupos/loading.tsx`, se justificado;
- possivelmente `src/app/grupos/error.tsx`, se justificado;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/decisoes.md`, se houver decisao.

Tarefas:

- validar semantica das tabs;
- validar navegacao por setas;
- validar ordem de tab;
- validar foco visivel;
- validar `aria-label` em todas as acoes por icone;
- validar `role="status"` em feedback e estados vazios;
- revisar botao em `pending` via `useFormStatus()`;
- decidir se cria `loading.tsx`;
- decidir se cria `error.tsx`;
- preservar mensagens nao tecnicas para usuario final.

Criterios de aceite:

- tabs continuam acessiveis;
- teclado opera a tela sem bloqueio;
- foco visivel e consistente;
- estados vazio, sem resultado e feedback estao claros;
- loading/erro tem decisao registrada;
- nenhuma mensagem tecnica sensivel e exposta.

Testes:

- `npm run lint`;
- `npm run test`;
- teste manual por teclado;
- teste manual de feedback;
- teste manual de vazio e busca sem resultado;
- `git diff --check`.

Checkpoint:

- acessibilidade e estados validados.
- tabs movem foco ao navegar por setas.
- foco visivel reforcado para acoes por icone.
- `loading.tsx` criado para `/grupos`.
- `error.tsx` criado para `/grupos` com mensagem nao tecnica.
- `npm run lint` passou.
- `npm run test` passou.
- `git diff --check` passou.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- remover `loading.tsx` ou `error.tsx`, se criados;
- reverter ajustes de foco/estado que causarem regressao.

## Tiro 4 - Refinamento e regressao

Objetivo: fechar o Ciclo 3 com revisao visual e regressao em desktop, tablet e
mobile.

Status: executado em 2026-07-17, mas nao validado integralmente.

Pre-condicoes:

- Tiros 1, 2 e 3 validados.

Arquivos afetados:

- `src/app/globals.css`;
- componentes ajustados no ciclo;
- `docs/refatoracao-painel-administrativo/execucao-ciclo-3.md`;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/checklist-validacao.md`, se
  necessario.

Tarefas:

- revisar espacamentos, hierarquia, cards e consistencia visual;
- testar desktop;
- testar tablet;
- testar mobile;
- testar ausencia de overflow horizontal;
- testar rotas administrativas sem sessao;
- rodar lint;
- rodar testes;
- rodar build e registrar a pendencia preexistente se ainda existir;
- atualizar registro final.

Criterios de aceite:

- desktop, tablet e mobile ficam coerentes;
- foco e teclado continuam funcionando;
- acoes administrativas seguem operacionais;
- nenhuma regressao conhecida em `/grupos`, `/grupos/novo` e
  `/grupos/[grupoId]`;
- `npm run lint` passa;
- `npm run test` passa;
- build tem status claro.

Testes:

- `npm run lint`;
- `npm run test`;
- `npm run build`;
- `git diff --check`;
- `curl -I http://127.0.0.1:3000/grupos`;
- `curl -I http://127.0.0.1:3000/grupos/novo`;
- `curl -I http://127.0.0.1:3000/grupos/[grupoId]`, usando um id real ou
  representativo de DEV.

Checkpoint:

- Ciclo 3 validado ou bloqueio registrado com causa isolada.
- `npm run lint` passou.
- `npm run test` passou.
- `git diff --check` passou.
- `npm run build` compilou, mas falhou no typecheck por pendencia preexistente
  em `scripts/reset-ata-record-sheets.ts:113`.
- Validacao de rotas sem sessao ficou inconclusiva: `HEAD /grupos` respondeu
  `200` no dev server, e as chamadas seguintes ficaram instaveis com conexao
  recusada apos reinicio/interrupcao do servidor local.

Condicao para encerrar:

- registro atualizado com status final, testes, bloqueios e proximas acoes.

Rollback:

- reverter arquivos alterados no Ciclo 3;
- preservar Ciclos 1 e 2.

## Prompt curto para iniciar o Tiro 1

```text
Execute somente o Tiro 1 do Ciclo 3, seguindo docs/refatoracao-painel-administrativo/especificacao-ciclo-3.md e execucao-ciclo-3.md. Foque apenas na sidebar responsiva; nao crie rotas novas, nao altere Sheets/schema/auth e nao avance para o Tiro 2.
```

## Checkpoint antes do Tiro 2

- sidebar desktop, tablet e mobile validada;
- itens ativos/desabilitados preservados;
- `Sair` preservado;
- tooltips e nomes acessiveis revisados;
- sem overflow horizontal na navegacao;
- `npm run lint` passou;
- `git diff --check` passou;
- registro atualizado.
