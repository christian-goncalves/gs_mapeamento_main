# Especificacao tecnica - Ciclo 3

Status: documentado; implementacao nao iniciada.

## 1. Objetivo

Refinar a experiencia responsiva, acessivel e operacional do painel
administrativo de grupos, sem alterar dados, Sheets, schemas, autenticacao,
permissoes ou o painel do responsavel.

O Ciclo 3 deve transformar os ajustes base dos Ciclos 1 e 2 em comportamento
definitivo para desktop, tablet e mobile.

## 2. Estado atual apos ciclos anteriores

Ciclo 1:

- `/grupos` usa `AdminShell`;
- sidebar administrativa foi criada;
- menu mostra `Grupos` funcional e demais secoes desabilitadas;
- resumo, abas, busca local, lista em cards e estados vazios existem;
- acoes por icone ficam visiveis no mobile;
- tabs ja possuem `role="tablist"`, `role="tab"` e navegacao por setas.

Ciclo 2:

- `deactivateGrupoAction` normalizou a inativacao;
- `deleteGrupoAction` ficou como compatibilidade temporaria;
- `activateGrupoAction` foi criada;
- grupos ativos mostram acao de inativar;
- grupos inativos mostram acao de ativar;
- ativar usa cor azul/cinza-azulado;
- feedback por `searchParams.status` foi adicionado;
- `npm run lint` e `npm run test` passaram;
- `npm run build` segue bloqueado por pendencia preexistente em
  `scripts/reset-ata-record-sheets.ts:113`.

## 3. Inventario dos componentes

Arquivos principais:

- `src/app/grupos/page.tsx`: Server Component, exige admin, le
  `readAggregatedAtas()`, ordena grupos e passa dados para o painel;
- `src/app/grupos/admin-shell.tsx`: shell administrativo, sidebar, navegacao e
  sair;
- `src/app/grupos/admin-groups-panel.tsx`: Client Component com resumo, abas,
  busca, feedback, lista e estados vazios;
- `src/app/grupos/group-list-actions.tsx`: Client Component com acoes por
  icone e confirmacoes;
- `src/app/globals.css`: estilos globais, layout administrativo, breakpoints e
  estados visuais.

Dependencias funcionais:

- `readAggregatedAtas()` carrega todas as abas do contrato Sheets via
  `batchGet`;
- nao ha paginacao server-side;
- filtros atuais sao locais no cliente;
- volume real precisa ser medido antes de decidir paginacao.

## 4. Estrategia responsiva

Usar uma evolucao progressiva dos estilos atuais:

- desktop: sidebar fixa/lateral com labels visiveis e conteudo em largura
  controlada;
- tablet: avaliar sidebar colapsada com icones e labels reduzidos;
- mobile: navegacao compacta horizontal ou drawer, mantendo acoes essenciais
  visiveis;
- evitar overflow horizontal em `body`, sidebar, tabs, busca e lista;
- preservar area minima de toque de aproximadamente 44px nas acoes principais;
- nomes longos devem quebrar linha sem empurrar botoes para fora.

O unico breakpoint atual especifico do painel e `@media (max-width: 720px)`.
O Ciclo 3 deve revisar se esse corte basta ou se e necessario um segundo
breakpoint para tablet.

## 5. Sidebar por breakpoint

Desktop:

- manter sidebar lateral com largura estavel;
- manter `Grupos` ativo com `aria-current="page"`;
- manter itens futuros desabilitados, com `aria-disabled`, `disabled` e
  `title`;
- manter `Sair` na parte inferior quando houver altura suficiente.

Tablet:

- avaliar colapsar labels e manter icones;
- garantir tooltips via `title` e `aria-label`;
- evitar que o conteudo principal fique estreito demais.

Mobile:

- escolher entre barra horizontal compacta ou drawer;
- preferencia inicial: barra compacta com icones visiveis, por ser mais simples
  e ja alinhada ao estado atual;
- drawer so deve ser adotado se a barra compacta gerar overflow ou excesso de
  itens quando novas secoes forem habilitadas.

## 6. Listagem por breakpoint

Desktop:

- manter lista em linhas/cards com nome, meta e acoes a direita;
- preservar hierarquia visual discreta.

Tablet:

- permitir quebra da area de acoes para nova linha quando necessario;
- garantir que cards nao tenham largura minima maior que o viewport.

Mobile:

- lista em uma coluna;
- acoes abaixo do texto principal;
- botoes por icone visiveis;
- nomes longos com `overflow-wrap: anywhere`;
- evitar scroll horizontal.

## 7. Estrategia para acoes no mobile

Decisao recomendada: manter icones visiveis no Ciclo 3.

Motivos:

- as acoes sao poucas e essenciais;
- menu de tres pontos adicionaria estado, foco, fechamento por teclado e
  comportamento de clique fora;
- icones visiveis sao mais auditaveis neste momento;
- a decisao anterior ja registrou essa preferencia.

O menu de tres pontos pode ser reavaliado apenas se a lista ganhar mais acoes.

## 8. Acessibilidade

Itens obrigatorios:

- todo icone interativo precisa de `aria-label`;
- manter `title` como tooltip basico;
- foco visivel em links, botoes, abas, busca e sair;
- tabs devem continuar navegaveis por teclado;
- estados vazios e feedback devem usar `role="status"` quando apropriado;
- itens desabilitados nao podem navegar;
- ordem de tab deve seguir leitura visual.

## 9. Estados de carregamento e erro

Estado atual:

- existe feedback de sucesso/estado por query string;
- estados vazios da lista ja existem;
- nao ha `loading.tsx` dedicado para `/grupos`;
- nao ha `error.tsx` dedicado para `/grupos`.

Recomendacao:

- avaliar `loading.tsx` no Tiro 3, pois `/grupos` depende de leitura do Sheets;
- criar `error.tsx` apenas se houver texto e acao clara de recuperacao;
- nao expor erro tecnico do Sheets diretamente ao usuario final.

## 10. Necessidade ou nao de `loading.tsx`

Nao criar automaticamente.

Condicao para criar:

- a rota `/grupos` apresentar espera perceptivel no carregamento autenticado;
- o loading puder ser representado por skeleton simples do painel;
- o estado nao duplicar mensagens de erro ou vazio.

Se criado, o arquivo deve ficar em `src/app/grupos/loading.tsx` e seguir o
layout administrativo sem depender de dados.

## 11. Tooltips

Padrao minimo:

- manter `title` em todos os botoes por icone;
- manter `aria-label` descritivo;
- itens compactados da sidebar devem ter `title`.

Tooltip customizado fica fora do Ciclo 3, salvo se o `title` nativo se mostrar
insuficiente nos testes.

## 12. Teclado e foco

Validar:

- tab entre sidebar, Novo grupo, busca, tabs, limpar busca e acoes da lista;
- setas esquerda/direita nas tabs;
- foco visivel em botoes compactos;
- confirmacao nao prende o usuario em estado inconsistente;
- botao em `pending` fica desabilitado apenas durante envio.

## 13. Semantica das tabs

Estado atual aceitavel:

- `role="tablist"`;
- `role="tab"`;
- `aria-selected`;
- `aria-controls`;
- `role="tabpanel"`;
- `aria-labelledby`.

O Ciclo 3 deve revisar se o foco muda para a tab selecionada apos setas. Se nao
mudar, registrar se o comportamento e aceitavel ou ajustar com refs.

## 14. Tokens e estilos

Usar variaveis existentes:

- `--ink`;
- `--muted`;
- `--paper`;
- `--surface`;
- `--line`;
- `--brand`;
- `--danger`.

Novas cores so devem entrar quando houver papel semantico claro, como o tom
azul/cinza-azulado ja usado em `.activate-icon-button`.

Evitar:

- refatoracao ampla do CSS global;
- alterar paleta inteira;
- cards dentro de cards;
- gradientes decorativos;
- efeitos que prejudiquem leitura.

## 15. Arquivos afetados

Possiveis arquivos de implementacao:

- `src/app/globals.css`;
- `src/app/grupos/admin-shell.tsx`;
- `src/app/grupos/admin-groups-panel.tsx`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/grupos/loading.tsx`, se justificado;
- `src/app/grupos/error.tsx`, se justificado.

Documentos:

- `docs/refatoracao-painel-administrativo/execucao-ciclo-3.md`;
- `docs/refatoracao-painel-administrativo/registro-execucao.md`;
- `docs/refatoracao-painel-administrativo/decisoes.md`;
- `docs/refatoracao-painel-administrativo/checklist-validacao.md`.

## 16. Testes

Automatizados:

- `npm run lint`;
- `npm run test`;
- `git diff --check`;
- `npm run build`, registrando a pendencia preexistente se continuar.

Manuais:

- desktop;
- tablet;
- mobile;
- teclado;
- foco visivel;
- nomes longos;
- lista vazia;
- busca sem resultado;
- grupo ativo;
- grupo inativo;
- feedback de ativacao/inativacao;
- rota sem sessao redirecionando para `/login`.

## 17. Criterios de aceite

- sidebar tem comportamento definido em desktop, tablet e mobile;
- sidebar compacta mantem nomes acessiveis;
- lista nao gera overflow horizontal;
- acoes continuam visiveis e acionaveis no mobile;
- botoes mantem area minima de toque;
- todos os icones interativos possuem `aria-label` e `title`;
- foco visivel funciona;
- tabs preservam semantica e teclado;
- estados de loading/erro/vazio estao definidos;
- nenhuma pagina futura e criada como funcional;
- nenhum contrato Sheets/schema/auth e alterado;
- `npm run lint` passa;
- `npm run test` passa.

## 18. Riscos

- esconder acoes essenciais em mobile;
- criar drawer com acessibilidade incompleta;
- quebrar foco de tabs;
- introduzir overflow por nomes longos;
- espalhar CSS global sem escopo claro;
- criar `loading.tsx` que nao representa a tela real;
- misturar este ciclo com roteamento `/admin/*`.

## 19. Rollback

Rollback deve ser simples:

- reverter ajustes em `globals.css`;
- reverter alteracoes em componentes de painel;
- remover `loading.tsx` ou `error.tsx` se criados;
- preservar Server Actions e dados do Ciclo 2.

Nenhuma acao de rollback de dados deve ser necessaria.

## 20. Decisoes pendentes

- usar apenas breakpoint `720px` ou adicionar breakpoint intermediario para
  tablet;
- manter barra mobile compacta ou criar drawer;
- criar ou nao `loading.tsx`;
- criar ou nao `error.tsx`;
- manter acoes sempre visiveis ou reavaliar menu de tres pontos;
- paginacao so deve ser considerada apos medir volume real.

## 21. Itens fora de escopo

- alterar `/` ou criar `/admin/*`;
- painel do responsavel;
- paginas funcionais de Atas, Usuarios, Relatorios e Configuracoes;
- paginacao automatica;
- filtros avancados;
- mudanca de contrato Sheets;
- schema/migracao;
- alteracao de autenticacao ou permissoes;
- refatoracao visual completa fora do painel administrativo.
