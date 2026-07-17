# Especificacao tecnica - Ciclo 1

Status: aguardando autorizacao para implementacao.

## 1. Objetivo do Ciclo 1

Substituir a pagina administrativa atual de grupos por um painel administrativo
com shell, menu lateral, resumo, abas, busca local, listagem responsiva e acoes
compactas ja suportadas, sem mudar backend, Sheets, schemas ou autenticacao.

## 2. Estado atual

A rota `/grupos` esta em `src/app/grupos/page.tsx`.

Caracteristicas atuais:

- e um Server Component;
- exporta `dynamic = "force-dynamic"`;
- protege acesso com `requireAdminSession()`;
- carrega dados reais por `readAggregatedAtas()`;
- ordena `result.grupos` por `grupo_nome`;
- exibe uma tabela com grupo, status, horarios ativos, e-mails, responsavel e
  acoes;
- usa `GroupListActions` em `src/app/grupos/group-list-actions.tsx`;
- `GroupListActions` e Client Component;
- acoes reais atuais: editar por link `/grupos/[grupoId]`, inativar por
  `deleteGrupoAction`, duplicar por `duplicateGrupoAction`;
- estilos ficam em `src/app/globals.css`;
- icones atuais usam Font Awesome.

Limitacoes relevantes:

- nao ha busca;
- nao ha abas por status;
- nao ha resumo de ativos/inativos/total;
- nao ha menu lateral administrativo;
- nao ha acao de reativar grupo inativo;
- nao ha paginacao server-side;
- o texto atual de inativacao usa linguagem de excluir.

## 3. Resultado visual esperado

### Menu lateral

Itens:

- Grupos;
- Atas;
- Usuarios;
- Relatorios;
- Configuracoes;
- Sair.

Definicoes:

- `Grupos` e o item ativo.
- `Sair` fica fixado no fim do menu.
- Itens sem rota funcional no Ciclo 1 nao devem ser links quebrados. Devem ser
  botao/elemento desabilitado com `aria-disabled="true"` e `title` indicando
  que sera implementado depois.
- `Grupos` aponta para `/grupos`.
- `Sair` usa o fluxo existente de `signOut({ redirectTo: "/login" })`.
- Desktop: sidebar fixa/estavel com icone e texto.
- Tablet: sidebar compacta, podendo ocultar texto e manter tooltip.
- Mobile: navegacao compacta no topo ou lateral reduzida; nao usar drawer se
  isso exigir estado extra amplo no Tiro 1.
- Todo item deve ter `aria-label`, `title` e area minima de toque de 44px.

Icones sugeridos Font Awesome:

- Grupos: `faUsers` ou `faLayerGroup`;
- Atas: `faFileLines`;
- Usuarios: `faUser`;
- Relatorios: `faChartSimple`;
- Configuracoes: `faGear`;
- Sair: `faRightFromBracket`.

### Cabecalho

- Titulo: `Administracao de grupos`.
- Botao `Novo grupo` aponta para `/grupos/novo`.
- Desktop: titulo a esquerda, botao a direita.
- Telas estreitas: titulo e botao podem empilhar; botao ocupa largura natural ou
  100% se necessario para toque confortavel.
- Espacamento deve seguir o ritmo de `section-heading` e `.shell`, sem hero ou
  area promocional.

### Cards de resumo

Cards:

- Ativos: quantidade de `grupos` com `ativo === true`;
- Inativos: quantidade de `grupos` com `ativo === false`;
- Total: quantidade total de `grupos`.

Origem: `result.grupos` carregado em `src/app/grupos/page.tsx`.

Se nao houver grupos, todos os cards mostram `0`.

Responsividade:

- desktop: 3 colunas;
- tablet: 3 colunas compactas ou 2+1 conforme largura;
- mobile: cards empilhados ou grid de 1 coluna.

### Abas

Abas:

- Ativos, padrao;
- Inativos;
- Todos.

Decisao Ciclo 1: usar estado local no Client Component, sem query string.

Motivo: a rota atual carrega todos os grupos e a filtragem e local. Query string
ficara para ciclo posterior se houver necessidade de link compartilhavel.

Acessibilidade:

- usar `role="tablist"`;
- botoes com `role="tab"`;
- `aria-selected`;
- painel com `role="tabpanel"`.

### Busca

- Busca local por `grupo_nome`.
- Normalizar com `trim()`, minusculas e remocao de espacos redundantes.
- Comparacao deve ignorar maiusculas/minusculas.
- A busca combina com a aba ativa.
- Sem filtros avancados no Ciclo 1.
- Campo deve ter label visual ou label acessivel.
- Se houver texto e nenhum resultado, exibir estado `Nenhum grupo encontrado`.
- Botao de limpar e opcional; se implementado, deve ter `aria-label`.

### Lista de grupos

Por grupo:

- nome;
- data de criacao se `created_at` existir e for util para exibicao;
- acoes permitidas.

Status:

- nas abas `Ativos` e `Inativos`, nao repetir o status em cada registro;
- na aba `Todos`, exibir status discreto como badge.

Estrutura:

- desktop: lista em cards/linhas, com conteudo a esquerda e acoes a direita;
- tablet: manter linha flexivel, reduzindo metadados;
- mobile: empilhar nome/metadados acima e acoes abaixo ou a direita se couber;
- nomes longos devem quebrar linha sem empurrar acoes para fora da tela;
- evitar overflow horizontal.

Estado vazio:

- sem grupos no sistema: mensagem de lista vazia;
- aba sem registros: mensagem especifica para status;
- busca sem resultado: mensagem especifica incluindo busca atual.

### Acoes

Acoes existentes no Ciclo 1:

- visualizar: usar o destino real `/grupos/[grupoId]`;
- editar: tambem usar `/grupos/[grupoId]`, pois hoje detalhe e edicao estao na
  mesma tela;
- duplicar: `duplicateGrupoAction`;
- inativar: `deleteGrupoAction`.

Nao incluir:

- ativar grupo inativo;
- nova Server Action.

Como visualizar e editar usam a mesma rota hoje, o Ciclo 1 pode:

- manter apenas `Editar` e `Duplicar`/`Inativar`; ou
- exibir `Visualizar` e `Editar` apontando para a mesma rota, com tooltips
  claros.

Decisao recomendada para o Ciclo 1: mostrar `Visualizar`, `Editar`, `Duplicar`
e `Inativar`, registrando que visualizar e editar compartilham a rota atual.

Icones sugeridos:

- Visualizar: `faEye`;
- Editar: `faPenToSquare`;
- Duplicar: `faClone`;
- Inativar: `faPowerOff` ou `faTrashCan` se mantido temporariamente.

Regras:

- botoes apenas com icone;
- `title` como tooltip basico;
- `aria-label` com nome do grupo;
- area minima 44px;
- foco visivel;
- confirmacao antes de inativar;
- duplicar pode manter submit direto no Ciclo 1;
- inativar grupos ja inativos deve ficar indisponivel no Ciclo 1.

Mobile:

- manter todas as acoes visiveis em uma linha flexivel no Ciclo 1;
- se a largura quebrar, permitir wrap organizado;
- nao criar menu de tres pontos neste ciclo para evitar nova complexidade de
  estado e acessibilidade.

## 4. Arquitetura de componentes

### `src/app/grupos/page.tsx`

Server Component.

Responsabilidades:

- chamar `requireAdminSession()`;
- chamar `readAggregatedAtas()`;
- preparar grupos e horarios ativos;
- passar dados serializaveis para componente cliente;
- renderizar shell inicial.

### `src/app/grupos/admin-groups-panel.tsx`

Novo Client Component.

Responsabilidades:

- manter estado local de aba e busca;
- filtrar grupos localmente;
- renderizar resumo, tabs, busca e lista.

Props:

- `groups`;
- `activeScheduleCounts`;
- `diagnosticsCount` opcional.

Estado local:

- `statusFilter: "ativos" | "inativos" | "todos"`;
- `search: string`.

### `src/app/grupos/admin-shell.tsx`

Pode ser Server Component simples ou componente local sem estado.

Responsabilidades:

- layout geral;
- sidebar;
- area principal.

### `src/app/grupos/admin-sidebar.tsx`

Componente apresentacional.

Responsabilidades:

- menu lateral;
- item ativo;
- itens desabilitados;
- formulario de sair, se implementado no shell.

Dependencia:

- `signOut` de `@/auth` se o sair for feito no Server Component.

### `src/app/grupos/admin-page-header.tsx`

Componente apresentacional.

Props:

- `title`;
- `actionHref`;
- `actionLabel`.

### `src/app/grupos/group-status-summary.tsx`

Componente apresentacional.

Props:

- `activeCount`;
- `inactiveCount`;
- `totalCount`.

### `src/app/grupos/group-status-tabs.tsx`

Client/presentational dentro do painel.

Props:

- `value`;
- `onChange`;
- counts opcionais.

### `src/app/grupos/group-search.tsx`

Client/presentational.

Props:

- `value`;
- `onChange`;
- `onClear` opcional.

### `src/app/grupos/admin-group-list.tsx`

Componente de lista.

Props:

- `groups`;
- `currentFilter`;
- `search`.

### `src/app/grupos/admin-group-list-item.tsx`

Componente de item.

Props:

- dados do grupo;
- contagem de horarios ativos se usada;
- mostrar status ou nao.

### `src/app/grupos/group-list-actions.tsx`

Reaproveitar e ajustar.

Responsabilidades:

- acoes compactas;
- formularios de Server Actions existentes;
- confirmacao de inativacao.

Fronteiras:

- dados carregam no servidor;
- filtro e busca ocorrem no cliente;
- Server Actions continuam nos formularios existentes.

## 5. Fluxo de dados

Fluxo real esperado:

```text
readAggregatedAtas()
-> grupos carregados no Server Component src/app/grupos/page.tsx
-> grupos e contagens enviados ao Client Component
-> aba e busca filtram localmente
-> acoes existentes chamam Server Actions em src/app/grupos/actions.ts
-> Server Actions revalidam rotas e redirecionam conforme regra atual
```

## 6. Modelo dos dados usados pela interface

Campos necessarios de `Grupo`:

- `grupo_id`;
- `grupo_nome`;
- `ativo`;
- `created_at`;
- `updated_at`, se necessario para fallback visual;
- `email_acesso_grupo`, se mantido como metadado discreto;
- `responsavel_grupo_nome`, se mantido como metadado discreto.

Campos derivados:

- `activeScheduleCount`: contagem de `grupo_horarios` ativos por `grupo_id`.

Data de criacao:

- se `created_at` estiver vazio ou for data tecnica inicial sem valor util, a
  interface deve omitir a data ou mostrar `Criacao nao informada`.
- nao alterar schema.

## 7. Estados da interface

Implementar no Ciclo 1:

- lista vazia;
- aba sem registros;
- busca sem resultado;
- acao em andamento via estado nativo de formulario quando possivel;
- diagnosticos existentes como alerta/area informativa, se `result.diagnostics`
  vier preenchido.

Ficam para ciclo posterior:

- `loading.tsx` dedicado;
- feedback toast sofisticado;
- erro granular de Server Action na lista;
- reativacao com feedback proprio.

## 8. Responsividade

Usar os padroes atuais de `globals.css`, especialmente o breakpoint existente
`@media (max-width: 720px)`.

Desktop:

- sidebar completa com icone e texto;
- cards em tres colunas;
- lista horizontal;
- acoes visiveis.

Tablet:

- sidebar compacta ou textos reduzidos;
- cards podem quebrar para duas colunas;
- lista com menos metadados.

Mobile:

- navegacao compacta sem drawer no Ciclo 1;
- cards empilhados;
- lista sem tabela horizontal;
- acoes com wrap controlado;
- area de toque minima de 44px;
- sem overflow horizontal.

## 9. Acessibilidade

Obrigatorio:

- foco visivel em links e botoes;
- labels na busca;
- `aria-label` em icones;
- `title` como tooltip basico;
- semantica de tabs com `role`;
- contraste preservado com `--brand`, `--ink`, `--surface`;
- mensagens de estado em texto visivel;
- itens sem rota com `aria-disabled="true"`;
- botoes com area de toque adequada.

## 10. Estilos

Reutilizar tokens:

- `--paper`;
- `--surface`;
- `--line`;
- `--brand`;
- `--muted`;
- `--ink`;
- `--danger`.

Classes novas provaveis:

- `.admin-layout`;
- `.admin-sidebar`;
- `.admin-nav`;
- `.admin-main`;
- `.admin-page-header`;
- `.summary-cards`;
- `.summary-card`;
- `.status-tabs`;
- `.group-search`;
- `.admin-group-list`;
- `.admin-group-item`;
- `.group-status-badge`.

Regras:

- editar `src/app/globals.css` de forma localizada;
- nao refatorar todo o CSS global;
- cards com raio ate 12px, preferencialmente 8px quando compactos;
- sombras discretas ou ausentes;
- tipografia atual baseada em Arial;
- icones com tamanho consistente.

## 11. Arquivos afetados

Arquivos alterados no Ciclo 1:

- `src/app/grupos/page.tsx`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/globals.css`.

Arquivos novos possiveis:

- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/grupos/admin-shell.tsx`;
- `src/app/grupos/admin-sidebar.tsx`;
- `src/app/grupos/admin-page-header.tsx`;
- `src/app/grupos/group-status-summary.tsx`;
- `src/app/grupos/group-status-tabs.tsx`;
- `src/app/grupos/group-search.tsx`;
- `src/app/grupos/admin-group-list.tsx`;
- `src/app/grupos/admin-group-list-item.tsx`.

Arquivos reaproveitados:

- `src/app/grupos/actions.ts`;
- `src/app/grupos/[grupoId]/page.tsx`;
- `src/app/grupos/novo/page.tsx`;
- `src/lib/auth/require-session.ts`;
- `src/lib/sheets/repository.ts`.

Nao devem ser tocados no Ciclo 1:

- `src/lib/sheets/contract.ts`;
- schemas de dominio;
- scripts de reconciliacao Sheets;
- arquivos de autenticacao, salvo import de `signOut` se necessario no shell;
- rotas do painel do responsavel.

## 12. Sequencia de implementacao

Ver [execucao-ciclo-1.md](execucao-ciclo-1.md).

Resumo:

1. Tiro 1 - Estrutura base.
2. Tiro 2 - Resumo, abas e busca.
3. Tiro 3 - Lista e acoes.
4. Tiro 4 - Mobile e acabamento.

## 13. Criterios de aceite

- `/grupos` continua protegido por admin;
- dados vem de `readAggregatedAtas()`;
- aba Ativos abre por padrao;
- contadores batem com `result.grupos`;
- busca funciona junto com aba ativa;
- nao existem links quebrados;
- itens sem rota funcional nao navegam;
- acoes atuais continuam funcionando;
- nenhuma alteracao em Sheets;
- nenhum schema alterado;
- layout funciona em desktop e mobile;
- todos os icones possuem nome acessivel;
- `npm run lint` passa;
- `npm run test` passa.

## 14. Plano de testes

Testar:

- admin com grupos ativos e inativos;
- admin sem grupos;
- busca com resultado;
- busca sem resultado;
- aba sem registros;
- duplicacao;
- inativacao;
- acesso de nao administrador;
- desktop;
- tablet;
- mobile;
- navegacao por teclado;
- foco visivel;
- nomes longos.

## 15. Riscos e rollback

Riscos:

- quebrar acoes atuais;
- passar objeto nao serializavel para Client Component;
- criar link sem rota;
- CSS global afetar outras telas;
- confundir inativar com excluir.

Rollback:

- reverter arquivos alterados do Ciclo 1;
- manter os documentos para rastrear a decisao;
- como nao ha Sheets/schema/migracao, rollback e apenas de codigo.

## 16. Decisoes finais antes de executar

Decisoes tomadas para o Ciclo 1:

- rota alvo: `/grupos`;
- busca local sem query string;
- sem filtros avancados;
- sem paginacao real;
- sem reativacao de grupo inativo;
- menu mobile compacto sem drawer no Ciclo 1;
- acoes permanecem visiveis no mobile com wrap controlado;
- itens sem rota funcional ficam desabilitados;
- `loading.tsx` fica para ciclo posterior.

Decisoes pendentes:

- se `Visualizar` e `Editar` devem coexistir apontando para a mesma rota ou se
  apenas `Editar` deve aparecer ate existir detalhe separado;
- se data de criacao deve ser exibida sempre ou omitida quando parecer tecnica.
