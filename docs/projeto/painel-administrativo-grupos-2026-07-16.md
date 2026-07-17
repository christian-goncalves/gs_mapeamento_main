# Painel administrativo de grupos - planejamento

Data: 2026-07-16

Status: aguardando autorizacao para implementacao.

Fonte da demanda: anexo `pasted-text.txt` enviado na conversa, com referencia
visual do novo painel administrativo.

Escopo desta etapa: somente o painel administrativo. A tela do responsavel pelo
grupo fica fora deste plano.

## Diagnostico do estado atual

O projeto usa Next.js App Router em `src/app`, com rotas server-rendered e
Server Actions para mutacoes. A pagina administrativa atual de grupos esta em
`src/app/grupos/page.tsx` e exige `requireAdminSession()`.

A listagem atual:

- le dados reais via `readAggregatedAtas()`;
- ordena grupos por nome;
- exibe uma tabela com grupo, status, horarios ativos, e-mails, responsavel e
  acoes;
- usa `GroupListActions` para editar, inativar e duplicar;
- nao possui busca, abas por status, cards de resumo ou navegacao lateral.

A home em `src/app/page.tsx` ja possui alguns padroes aproveitaveis de header,
acoes compactas com Font Awesome e area de atas. O CSS global em
`src/app/globals.css` concentra os tokens visuais atuais: fundo claro, cards
claros, verde escuro em acoes, borda discreta e raio de 8 a 12px.

## Compatibilidade com o layout proposto

O layout e compativel com a arquitetura atual para um primeiro ciclo sem mudar
schema, contrato Sheets ou autenticacao.

Partes compativeis diretamente:

- menu lateral administrativo;
- titulo `Administracao de grupos`;
- botao `Novo grupo`;
- indicadores `Ativos`, `Inativos` e `Total` derivados de `result.grupos`;
- abas `Ativos`, `Inativos` e `Todos`;
- busca local por nome do grupo;
- lista responsiva usando os grupos reais;
- acoes por icone usando Font Awesome.

Partes que exigem mais cuidado:

- ativar grupo direto na lista: hoje existe acao explicita para inativar
  (`deleteGrupoAction`), mas nao existe Server Action dedicada para reativar;
- paginacao: o backend le todo o contrato Sheets por `batchGet`; nao ha
  paginacao server-side;
- filtros avancados: nao ha criterios reais suficientes, entao nao deve existir
  botao de filtros sem funcao;
- menu lateral mobile: deve ser feito sem esconder acoes importantes e mantendo
  area de toque adequada.

## Componentes e arquivos envolvidos

Arquivos principais:

- `src/app/grupos/page.tsx`: pagina alvo do painel administrativo;
- `src/app/grupos/group-list-actions.tsx`: acoes de lista;
- `src/app/grupos/actions.ts`: Server Actions de salvar, inativar e duplicar;
- `src/app/grupos/[grupoId]/page.tsx`: detalhe/edicao do grupo;
- `src/app/grupos/novo/page.tsx`: criacao de grupo;
- `src/app/globals.css`: estilos globais e responsividade;
- `src/lib/auth/require-session.ts`: autorizacao de admin;
- `src/lib/auth/access.ts`: resolucao de perfil e grupos;
- `src/lib/sheets/repository.ts`: leitura agregada dos dados reais;
- `src/lib/sheets/group-admin.ts`: escrita de grupo e horarios.

Possiveis componentes novos:

- `AdminShell` ou estrutura equivalente para menu lateral e area principal;
- `AdminSidebar`;
- `GroupStatusSummary`;
- `GroupStatusTabs`;
- `GroupSearch`;
- `AdminGroupList`;
- ajuste ou substituicao de `GroupListActions`.

Esses componentes devem ser especificos do painel de grupos nesta etapa. Nao ha
necessidade de criar um design system generico agora.

## Reaproveitamento possivel

Pode ser reaproveitado:

- `requireAdminSession()` para proteger a rota;
- `readAggregatedAtas()` para carregar grupos e horarios;
- `GroupListActions` como base para duplicar/inativar;
- `/grupos/novo` para novo grupo;
- `/grupos/[grupoId]` para visualizacao/edicao atual;
- tokens CSS existentes (`--paper`, `--surface`, `--line`, `--brand`,
  `--muted`);
- Font Awesome ja instalado e usado no projeto.

## Dependencias de backend

Nao ha dependencia obrigatoria de backend para o primeiro ciclo se a entrega
ficar limitada a estrutura, resumo, abas, busca e listagem com as acoes ja
existentes.

Pode exigir Server Action nova:

- reativar grupo inativo pela lista;
- trocar status ativo/inativo sem passar pela tela de edicao.

Nao e recomendado implementar paginacao real neste momento sem redesenhar a
leitura de Sheets, porque o repositorio hoje faz leitura agregada completa.

## Limitacoes atuais

- Nao existe estado de carregamento interno na pagina de grupos porque a rota e
  Server Component; pode-se usar `loading.tsx` por segmento em ciclo posterior.
- Nao existe busca server-side ou query param ja estabelecido.
- Nao existe filtro avancado real alem de status e busca por nome.
- Nao existe acao `activateGrupoAction`.
- O texto atual de exclusao fala em "Excluir", mas a regra real e inativar.
- O layout global atual nao tem shell administrativo compartilhado.

## Riscos

- Misturar painel administrativo e painel do responsavel, quebrando a separacao
  pedida.
- Criar botao de filtros sem comportamento real.
- Implementar paginacao apenas visual e esconder registros carregados sem ganho
  real de desempenho.
- Duplicar regras de permissao no cliente em vez de preservar validacao no
  servidor.
- Criar acao de ativar/inativar sem confirmacao e sem revalidar paths.
- Alterar contrato Sheets desnecessariamente.

## Proposta de ciclos

Recomendacao: executar em 3 ciclos curtos.

### Ciclo 1 - Estrutura e listagem real

Objetivo: substituir a pagina `/grupos` pelo novo painel administrativo sem
mudar backend.

Inclui:

- shell administrativo com menu lateral;
- cabecalho com titulo e botao `Novo grupo`;
- cards de resumo `Ativos`, `Inativos`, `Total`;
- abas `Ativos`, `Inativos`, `Todos`;
- busca por nome;
- listagem responsiva com dados reais;
- acoes compactas por icone para visualizar/editar/duplicar/inativar usando
  capacidades existentes;
- estados vazio e erro visual basico para lista/diagnosticos.

Nao inclui:

- reativar grupo direto na lista;
- paginacao;
- filtros avancados;
- rotas novas para atas, usuarios, relatorios e configuracoes.

Checkpoint:

- `npm run lint`;
- `npm run test`;
- `/grupos`, `/grupos/novo` e `/grupos/[grupoId]` continuam carregando;
- usuario nao administrador continua sem acesso a `/grupos`;
- nenhum schema, contrato Sheets ou autenticacao alterado.

### Ciclo 2 - Acoes e estados administrativos

Objetivo: completar as acoes reais da lista.

Inclui:

- revisar nomenclatura de inativar em vez de excluir;
- criar `activateGrupoAction` se aprovado;
- permitir ativar/inativar conforme aba atual;
- confirmacoes e feedback;
- garantir revalidacao de `/`, `/grupos`, `/grupos/[grupoId]` e `/meu-grupo`.

Checkpoint:

- testes das Server Actions;
- teste de inativacao e reativacao;
- sem alteracao de contrato Sheets.

### Ciclo 3 - Refinamento responsivo e acessibilidade

Objetivo: ajustar comportamento mobile e polimento.

Inclui:

- menu lateral colapsado/compacto;
- tooltip e `aria-label` em todos os icones;
- decisao entre acoes visiveis e menu de tres pontos em telas pequenas;
- eventual `loading.tsx` da rota;
- avaliar paginacao somente se volume real justificar.

Checkpoint:

- validacao visual desktop e mobile;
- `npm run lint`;
- `npm run test`;
- sem botoes sem funcao.

## Primeiro ciclo seguro

O primeiro ciclo seguro deve ser o Ciclo 1.

Motivo: entrega a mudanca visual principal e usa apenas dados e acoes ja
existentes. Isso reduz o risco de mexer em contrato Sheets, autenticacao ou
Server Actions antes de estabilizar a experiencia visual do painel.

## Decisoes antes de implementar

Antes de iniciar o Ciclo 1, confirmar:

- A rota alvo continua sendo `/grupos`.
- O menu lateral pode mostrar itens ainda sem pagina funcional como links
  desabilitados ou apenas rotulos inativos.
- No Ciclo 1, o botao de status deve apenas inativar grupos ativos; reativacao
  fica para o Ciclo 2.
- A busca sera local sobre os grupos ja carregados.
- Nao havera botao de filtros avancados enquanto nao houver criterios reais.
