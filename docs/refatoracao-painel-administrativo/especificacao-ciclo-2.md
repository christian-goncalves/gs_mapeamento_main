# Especificacao tecnica - Ciclo 2

Status: aguardando autorizacao para implementacao.

## 1. Objetivo

Completar as acoes administrativas de status dos grupos, substituindo a logica
visual de inativacao parcial por um fluxo explicito de ativar/inativar, com
confirmacao, feedback, autorizacao no servidor, revalidacao de rotas e testes.

## 2. Estado atual apos o Ciclo 1

O Ciclo 1 foi concluido tecnicamente em 2026-07-16.

Estado atual confirmado:

- `/grupos` segue protegido por `requireAdminSession()` em
  `src/app/grupos/page.tsx`;
- os dados reais seguem vindo de `readAggregatedAtas()`;
- a UI administrativa usa `AdminShell` em `src/app/grupos/admin-shell.tsx`;
- a lista, resumo, abas e busca local ficam em
  `src/app/grupos/admin-groups-panel.tsx`;
- as acoes de linha ficam em `src/app/grupos/group-list-actions.tsx`;
- `GroupListActions` mostra Visualizar, Editar, Duplicar e Inativar;
- Visualizar e Editar apontam para `/grupos/[grupoId]`;
- Duplicar usa `duplicateGrupoAction`;
- Inativar usa `deleteGrupoAction`;
- grupos inativos nao tem reativacao no Ciclo 1; o botao de inativar fica
  desabilitado;
- `npm run lint` e `npm run test` passaram no encerramento do Ciclo 1.

Pendente registrado:

- a home `/` ainda leva o usuario autenticado para o painel atual, nao para uma
  rota administrativa dedicada;
- a estrutura `/admin/grupos` ainda nao existe;
- grupo inativo precisa ter acao de ativar, com cor diferente de verde/vermelho
  no botao.

## 3. Fluxo atual de inativacao

Arquivo: `src/app/grupos/actions.ts`.

Action atual:

```text
deleteGrupoAction(formData)
```

Fluxo:

1. le `grupo_id` do `FormData`;
2. exige `requireAdminSession()`;
3. carrega dados com `readAggregatedAtas()`;
4. procura o grupo em `result.grupos`;
5. falha com `Grupo nao encontrado.` se nao existir;
6. salva o grupo com `ativo: false` via `saveGrupo`;
7. percorre horarios ativos do grupo e salva cada horario com `ativo: false`
   via `saveGrupoHorario`;
8. revalida `/`, `/grupos` e `/grupos/[grupoId]`;
9. redireciona para `/grupos`.

Observacao: o nome `deleteGrupoAction` nao representa o comportamento real. A
acao nao exclui o grupo; ela inativa o grupo e horarios ativos.

## 4. Arquivos e Server Actions envolvidos

Arquivos de aplicacao:

- `src/app/grupos/actions.ts`;
- `src/app/grupos/actions.test.ts`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/globals.css`.

Arquivos de dados:

- `src/lib/sheets/group-admin.ts`;
- `src/lib/sheets/repository.ts`;
- `src/lib/sheets/schemas.ts`;
- `src/lib/sheets/contract.ts`.

Server Actions atuais:

- `saveGrupoAction`;
- `deleteGrupoAction`;
- `duplicateGrupoAction`;
- `saveHorarioAction`;
- `saveHorariosGrupoAction`.

Server Action nova prevista para o Ciclo 2:

- `activateGrupoAction`, se a regra de reativacao for confirmada.

Alternativa tecnica:

- criar uma action generica `setGrupoActiveAction`, mas isso aumenta o risco de
  acoplar dois fluxos com confirmacoes e mensagens diferentes. A recomendacao
  inicial e criar `activateGrupoAction` e renomear visualmente a inativacao sem
  quebrar compatibilidade de testes existentes.

## 5. Proposta de reativacao

Adicionar action:

```text
activateGrupoAction(formData)
```

Fluxo proposto:

1. ler `grupo_id`;
2. exigir `requireAdminSession()`;
3. carregar `readAggregatedAtas()`;
4. validar existencia do grupo;
5. se o grupo ja estiver ativo, nao duplicar efeito e redirecionar com feedback
   neutro;
6. salvar grupo com `ativo: true` via `saveGrupo`;
7. decidir regra de horarios:
   - opcao recomendada para primeiro tiro: nao reativar horarios
     automaticamente;
   - motivo: a inativacao atual desativa horarios, mas reativar todos pode
     restaurar horarios que o administrador queria manter desativados;
   - alternativa: reativar somente horarios que foram inativados junto com o
     grupo, mas hoje nao ha trilha para distinguir esse caso.
8. revalidar rotas;
9. redirecionar para `/grupos?status=activated` ou manter `/grupos`.

Como o projeto ainda nao usa query string para feedback na lista, o Ciclo 2
deve decidir se adiciona query string simples ou estado local de feedback.

## 6. Regras de autorizacao

Obrigatorio:

- ativar/inativar pela lista deve exigir `requireAdminSession()`;
- responsavel de grupo nao pode ativar/inativar grupos pela lista;
- autorizacao precisa ficar na Server Action, nao apenas na UI;
- a UI pode ocultar/desabilitar a acao, mas isso nao substitui validacao no
  servidor.

## 7. Confirmacao

Confirmacoes no cliente:

- grupo ativo: `Inativar [grupo]? O grupo deixara de aparecer como ativo.`;
- grupo inativo: `Ativar [grupo]? O grupo voltara a aparecer como ativo.`;

Para o Ciclo 2, `window.confirm` e aceitavel por manter o padrao atual e evitar
novo componente modal.

## 8. Feedback de sucesso e erro

Feedback minimo recomendado:

- `?status=deactivated`;
- `?status=activated`;
- `?status=already-active`;
- `?status=already-inactive`;
- `?status=error`, somente se houver fluxo seguro para mensagem generica.

Pode ser renderizado no componente cliente do painel, lendo `searchParams` no
Server Component e repassando uma mensagem serializavel.

Nao expor mensagens tecnicas de erro do servidor diretamente.

## 9. Revalidacao de rotas

Revalidar apos ativar/inativar:

- `/`;
- `/grupos`;
- `/grupos/[grupoId]`;
- `/meu-grupo`.

Motivo:

- `/` pode redirecionar/mostrar grupos conforme perfil;
- `/grupos` contem lista administrativa;
- detalhe do grupo exibe estado;
- painel do responsavel pode depender de grupo ativo.

Se a rota `/admin/grupos` for criada antes ou durante ciclo posterior, tambem
deve ser revalidada.

## 10. Estados da interface

Estados esperados:

- grupo ativo: acao primaria de status e `Inativar`;
- grupo inativo: acao primaria de status e `Ativar`;
- botao de ativar: cor azul/cinza-azulado, evitando verde e vermelho;
- botao de inativar: evitar vermelho se o produto entender que nao e exclusao;
  pode usar tom neutro/alerta;
- submit em andamento: botao desabilitado quando possivel;
- sucesso: mensagem curta no topo do painel;
- erro: mensagem curta e nao tecnica.

## 11. Impacto em front-end, back-end e Sheets

Front-end:

- alterar `GroupListActions`;
- possivelmente passar `searchParams` de `page.tsx` para `AdminGroupsPanel`;
- adicionar estilos para botao de ativacao e mensagens.

Back-end:

- adicionar `activateGrupoAction`;
- opcionalmente renomear ou complementar `deleteGrupoAction` com alias
  semantico `deactivateGrupoAction`.

Sheets:

- nao exige coluna nova;
- nao exige migracao;
- usa `grupos.ativo` existente;
- possivel decisao sobre `grupo_horarios.ativo` na reativacao.

## 12. Componentes afetados

- `GroupListActions`: passa a escolher Ativar/Inativar conforme `ativo`.
- `AdminGroupsPanel`: pode exibir feedback e receber status de action.
- `AdminShell`: sem mudanca prevista.
- `page.tsx`: pode ler `searchParams` para feedback.

## 13. Contratos de dados usados

Campos de `Grupo`:

- `grupo_id`;
- `grupo_nome`;
- `ativo`;
- `created_at`;
- `updated_at`;
- demais campos preservados por spread em `saveGrupo`.

Campos de `GrupoHorario`:

- `horario_id`;
- `grupo_id`;
- `ativo`;
- demais campos preservados quando alterados.

Nao alterar schemas.

## 14. Plano de testes

Automatizados:

- `activateGrupoAction` exige admin;
- `activateGrupoAction` falha para grupo inexistente;
- `activateGrupoAction` salva grupo com `ativo: true`;
- `activateGrupoAction` nao altera contrato Sheets;
- inativacao continua salvando grupo com `ativo: false`;
- inativacao continua desativando horarios ativos;
- revalidacoes esperadas sao chamadas;
- redirecionamentos esperados ocorrem;
- `GroupListActions` renderiza estado correto para ativo/inativo, se houver
  teste de componente disponivel.

Manuais:

- admin ativa grupo inativo;
- admin inativa grupo ativo;
- cancelar confirmacao nao envia action;
- responsavel nao acessa painel admin;
- feedback aparece apos acao;
- abas refletem status atualizado apos redirect/revalidacao.

## 15. Criterios de aceite

- nao ha mais texto visual de excluir para status de grupo;
- grupo ativo mostra acao de inativar;
- grupo inativo mostra acao de ativar;
- botao de ativar usa cor distinta de verde/vermelho;
- ativar/inativar exige admin no servidor;
- ativar/inativar preserva contrato Sheets;
- feedback de sucesso aparece;
- erro de grupo inexistente e tratado;
- rotas relevantes sao revalidadas;
- `npm run lint` passa;
- `npm run test` passa;
- build so sera criterio se a pendencia preexistente em
  `scripts/reset-ata-record-sheets.ts:113` for resolvida ou explicitamente
  isolada.

## 16. Riscos

- reativar horarios incorretamente;
- manter action com nome `delete` e gerar confusao futura;
- feedback via query string conflitar com filtros futuros;
- esconder erro real de permissao;
- duplicar regra de status entre UI e Server Action.

## 17. Rollback

Rollback de codigo:

- remover `activateGrupoAction`;
- restaurar `GroupListActions` para estado anterior;
- remover feedback visual do painel;
- manter dados Sheets sem migracao.

Rollback de dados:

- como so `ativo` e alterado, corrigir manualmente no proprio painel/detalhe ou
  Sheets se necessario.

## 18. Decisoes pendentes

- Reativar grupo deve reativar horarios automaticamente?
- A action antiga deve ser renomeada de `deleteGrupoAction` para
  `deactivateGrupoAction` com alias temporario?
- Feedback deve usar query string ou estado local apos redirect?
- `/` deve redirecionar admin para `/admin/grupos`?
- A rota administrativa deve migrar de `/grupos` para `/admin/grupos` neste
  ciclo ou em ciclo separado?

## 19. Itens fora de escopo

- painel do responsavel;
- pagina de atas administrativa;
- usuarios, relatorios e configuracoes funcionais;
- paginacao;
- filtros avancados;
- migracao Sheets;
- alteracao de schema;
- reestruturacao completa de rotas admin, salvo decisao explicita posterior.
