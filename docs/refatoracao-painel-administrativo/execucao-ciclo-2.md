# Execucao do Ciclo 2 - acoes administrativas

Status: Ciclo 2 validado com build bloqueado por pendencia preexistente
isolada em `scripts/reset-ata-record-sheets.ts:113`.

Regra: executar um tiro por vez. So avancar quando o checkpoint do tiro atual
estiver aprovado e o [registro de execucao](registro-execucao.md) atualizado.

## Tiro 1 - Diagnostico e normalizacao

Objetivo: revisar e normalizar o fluxo atual de status sem adicionar ainda a
reativacao.

Status: validado em 2026-07-16.

Pre-condicoes:

- Ciclo 1 concluido tecnicamente.
- `npm run lint` e `npm run test` passando.

Arquivos afetados:

- `src/app/grupos/actions.ts`;
- `src/app/grupos/actions.test.ts`;
- `src/app/grupos/group-list-actions.tsx`;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/decisoes.md`, se houver decisao.

Tarefas:

- revisar `deleteGrupoAction`;
- confirmar que ela inativa grupo e horarios;
- corrigir nomenclatura visual restante de excluir para inativar;
- avaliar se cria alias `deactivateGrupoAction`;
- mapear revalidacoes atuais;
- confirmar efeitos colaterais sobre horarios.

Criterios de aceite:

- nenhum texto visual fala em excluir grupo quando a acao e inativar;
- testes existentes continuam passando;
- revalidacoes atuais estao documentadas;
- nenhuma mudanca de Sheets/schema.

Testes:

- `npm run lint`;
- `npm run test`;
- teste manual do cancelamento de inativacao, se possivel.

Checkpoint:

- fluxo atual documentado e nomenclatura normalizada.
- `deactivateGrupoAction` criada como nome semantico da inativacao.
- `deleteGrupoAction` mantida como compatibilidade temporaria.
- revalidacoes atuais confirmadas: `/`, `/grupos` e `/grupos/[grupoId]`.
- efeito colateral confirmado: horarios ativos do grupo tambem sao marcados
  como inativos.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- reverter alteracoes de nomenclatura e alias, sem impacto em dados.

## Tiro 2 - Reativacao

Objetivo: criar acao real para ativar grupos inativos, preservando contrato
Sheets.

Status: validado em 2026-07-16.

Pre-condicoes:

- Tiro 1 validado.
- Decisao sobre horarios na reativacao registrada.

Arquivos afetados:

- `src/app/grupos/actions.ts`;
- `src/app/grupos/actions.test.ts`;
- possivelmente `docs/refatoracao-painel-administrativo/decisoes.md`.

Tarefas:

- criar `activateGrupoAction`, se confirmada como adequada;
- exigir `requireAdminSession()`;
- validar existencia do grupo;
- salvar grupo com `ativo: true`;
- decidir e implementar regra para horarios;
- revalidar `/`, `/grupos`, `/grupos/[grupoId]` e `/meu-grupo`;
- redirecionar com feedback definido.

Criterios de aceite:

- grupo inexistente falha com erro controlado;
- grupo inativo passa para ativo;
- grupo ja ativo nao causa efeito destrutivo;
- contrato Sheets permanece inalterado;
- testes cobrem sucesso, grupo inexistente e revalidacoes.

Testes:

- `npm run lint`;
- `npm run test`;
- testes especificos de `activateGrupoAction`.

Checkpoint:

- reativacao funciona no servidor sem mudanca de schema.
- `activateGrupoAction` criada com `requireAdminSession()`.
- grupo inexistente falha com `Grupo não encontrado.`.
- grupo inativo passa para `ativo: true`.
- grupo ja ativo redireciona com feedback neutro sem salvar novamente.
- horarios nao sao reativados automaticamente.
- revalidacoes confirmadas: `/`, `/grupos`, `/grupos/[grupoId]` e
  `/meu-grupo`.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- remover `activateGrupoAction`;
- reverter testes novos;
- se algum grupo for ativado indevidamente em DEV, ajustar `ativo=false`.

## Tiro 3 - Interface e feedback

Objetivo: integrar ativar/inativar na lista administrativa com confirmacao e
feedback.

Status: validado em 2026-07-16.

Pre-condicoes:

- Tiro 2 validado.

Arquivos afetados:

- `src/app/grupos/group-list-actions.tsx`;
- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/grupos/page.tsx`;
- `src/app/globals.css`.

Tarefas:

- exibir Inativar para grupo ativo;
- exibir Ativar para grupo inativo;
- aplicar cor azul/cinza-azulado ao botao de ativar;
- manter confirmacao antes da mudanca de status;
- adicionar feedback de sucesso e erro;
- preservar `aria-label`, `title` e area de toque;
- garantir que a aba atual reflita o estado apos redirect/revalidacao.

Criterios de aceite:

- grupo ativo mostra acao correta;
- grupo inativo mostra acao correta;
- ativar nao usa verde/vermelho;
- confirmacoes sao claras;
- feedback aparece apos acao;
- sem links quebrados.

Testes:

- `npm run lint`;
- `npm run test`;
- teste manual de ativar;
- teste manual de inativar;
- teste manual de cancelar confirmacao;
- teste manual de feedback.

Checkpoint:

- interface reflete o estado real do grupo.
- grupo ativo mostra acao de inativar.
- grupo inativo mostra acao de ativar.
- ativar usa botao azul/cinza-azulado.
- confirmacoes usam texto especifico para ativar e inativar.
- feedback via query string aparece no topo do painel.

Condicao para avancar:

- checkpoint aprovado e registro atualizado.

Rollback:

- restaurar `GroupListActions` anterior;
- remover feedback visual;
- manter Server Action se ja validada, ou reverter junto se necessario.

## Tiro 4 - Testes e regressao

Objetivo: fechar o Ciclo 2 com cobertura e regressao.

Status: validado em 2026-07-16, com build documentado como bloqueado por
pendencia preexistente fora do escopo.

Pre-condicoes:

- Tiros 1, 2 e 3 validados.

Arquivos afetados:

- `src/app/grupos/actions.test.ts`;
- possiveis testes adicionais;
- documentos de execucao.

Tarefas:

- revisar testes unitarios;
- garantir cobertura das Server Actions;
- testar regressao de criacao, duplicacao, edicao e horarios;
- rodar lint;
- rodar test;
- rodar build se pendencia preexistente estiver resolvida, ou registrar
  separadamente o erro em `scripts/reset-ata-record-sheets.ts:113`;
- atualizar registro de execucao.

Criterios de aceite:

- `npm run lint` passa;
- `npm run test` passa;
- build tem status claro: passou ou falhou por pendencia preexistente isolada;
- nenhuma mudanca de contrato Sheets;
- nenhuma regressao conhecida em `/grupos`, `/grupos/novo` e
  `/grupos/[grupoId]`.

Testes:

- automatizados de actions;
- manuais de status;
- regressao das rotas admin;
- acesso de nao admin.

Checkpoint:

- Ciclo 2 validado.
- `npm run lint` passou.
- `npm run test` passou.
- `git diff --check` passou.
- `npm run build` compilou, mas falhou no typecheck por pendencia preexistente
  em `scripts/reset-ata-record-sheets.ts:113`.
- `/grupos`, `/grupos/novo` e `/grupos/[grupoId]` responderam `307` para
  `/login` sem sessao, preservando a protecao das rotas.

Condicao para encerrar:

- registro atualizado com resultado final e pendencias do proximo ciclo.

Rollback:

- reverter arquivos alterados no Ciclo 2;
- ajustar manualmente `grupos.ativo` em DEV se necessario.
