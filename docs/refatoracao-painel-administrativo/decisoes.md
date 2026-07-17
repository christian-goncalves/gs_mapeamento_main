# Decisoes - painel administrativo

Registrar aqui decisoes tecnicas e de produto da refatoracao do painel
administrativo.

## 2026-07-16 - Escopo exclusivo do administrador

Contexto: a demanda separa explicitamente painel administrativo e painel do
responsavel pelo grupo.

Decisao: esta etapa altera somente `/grupos` e componentes diretamente ligados
ao painel administrativo.

Motivo: reduzir risco e preservar a experiencia do responsavel.

Impacto: `src/app/meu-grupo/page.tsx` e fluxo do responsavel ficam fora do
Ciclo 1.

## 2026-07-16 - Itens do menu sem rota funcional

Contexto: o layout de referencia inclui Atas, Usuarios, Relatorios e
Configuracoes, mas o Ciclo 1 nao cria essas paginas.

Decisao: itens sem rota funcional aparecem desabilitados, com `aria-disabled`,
`title` e sem navegacao.

Motivo: evitar links quebrados e preservar a promessa visual do menu.

Impacto: somente `Grupos` e `Sair` sao funcionais no menu do Ciclo 1.

## 2026-07-16 - Busca e abas sem query string

Contexto: a rota `/grupos` ja carrega todos os grupos via
`readAggregatedAtas()`.

Decisao: abas e busca usam estado local no Client Component, sem query string.

Motivo: simplificar o Ciclo 1 e evitar nova regra de URL antes de necessidade
real.

Impacto: filtro nao e compartilhavel por link no Ciclo 1.

## 2026-07-16 - Sem reativacao no Ciclo 1

Contexto: existe `deleteGrupoAction` para marcar grupo como inativo, mas nao ha
Server Action dedicada para reativar pela lista.

Decisao: Ciclo 1 nao implementa ativacao de grupos inativos.

Motivo: evitar nova Server Action nesta etapa documental/visual.

Impacto: reativacao fica para ciclo posterior.

## 2026-07-16 - Acoes visiveis no mobile

Contexto: a lista precisa funcionar em telas pequenas, e menu de tres pontos
exigiria estado e acessibilidade adicionais.

Decisao: manter acoes visiveis com icones e wrap controlado no Ciclo 1.

Motivo: abordagem mais simples, auditavel e acessivel para o primeiro ciclo.

Impacto: refinamento com menu de tres pontos pode ser reavaliado depois.

## 2026-07-16 - `loading.tsx`

Contexto: `/grupos` e Server Component dinamico.

Decisao: nao criar `loading.tsx` no Ciclo 1.

Motivo: priorizar estrutura principal e evitar arquivo adicional sem validar
necessidade real.

Impacto: loading dedicado fica para refinamento posterior.

## 2026-07-16 - Visualizar e editar no Ciclo 1

Contexto: o Ciclo 1 pede acoes compactas de visualizar e editar, mas o projeto
atual usa a mesma rota `/grupos/[grupoId]` para detalhe e edicao do grupo.

Decisao: exibir os dois icones no Tiro 3, ambos apontando para
`/grupos/[grupoId]`, com `aria-label` e `title` distintos.

Motivo: cumprir a composicao visual esperada sem criar rota nova nem mudar o
fluxo atual.

Impacto: separacao real entre visualizacao e edicao fica para ciclo posterior,
caso seja necessaria.

## 2026-07-16 - Entrada `/` e namespace administrativo

Contexto: apos o Ciclo 1, a home `/` ainda mostra a experiencia antiga do
usuario autenticado. O painel novo esta em `/grupos`, mas a expectativa de
produto e que administradores entrem direto no painel administrativo.

Decisao: registrar como pendencia a criacao de uma entrada inteligente em `/` e
a avaliacao de namespace `/admin/*`, começando por `/admin/grupos`.

Motivo: separar painel administrativo do painel do responsavel e permitir
evolucao natural para `/admin/atas`, `/admin/usuarios`, `/admin/relatorios` e
`/admin/configuracoes`.

Impacto: nao faz parte do Ciclo 2 de ativar/inativar, salvo autorizacao
explicita. Deve ser planejado em ciclo/tiro proprio para nao misturar
roteamento com acoes de status.

## 2026-07-16 - Botao de ativar grupo inativo

Contexto: no Ciclo 1, grupos inativos ficam sem reativacao pela lista. O usuario
confirmou que o botao deve ativar novamente e deve usar outra cor, como azul,
quando o grupo estiver desativado.

Decisao: o Ciclo 2 deve especificar e implementar acao real de ativacao para
grupos inativos, com cor distinta de verde e vermelho.

Motivo: o controle visual deve representar o estado real e permitir ida e volta
do status.

Impacto: exige nova Server Action ou action equivalente no servidor, testes e
feedback de sucesso/erro.

## 2026-07-16 - Nome semantico para inativacao

Contexto: a Server Action existente se chamava `deleteGrupoAction`, mas seu
comportamento real era marcar o grupo como inativo e tambem marcar horarios
ativos do grupo como inativos.

Decisao: criar `deactivateGrupoAction` como nome semantico usado pela interface
administrativa e manter `deleteGrupoAction` como ponte de compatibilidade
temporaria.

Motivo: remover ambiguidade entre excluir e inativar sem quebrar chamadas
existentes antes da reativacao completa.

Impacto: nenhuma mudanca de schema, Sheets, autenticacao ou permissao. No Tiro
2, a inativacao passou a revalidar tambem `/meu-grupo`, alinhando o fluxo de
status com a ativacao.

## 2026-07-16 - Reativacao nao restaura horarios automaticamente

Contexto: a inativacao atual marca horarios ativos do grupo como inativos. Hoje
nao existe campo ou trilha que diferencie horario desativado manualmente de
horario desativado junto com o grupo.

Decisao: `activateGrupoAction` reativa somente o grupo, preservando o estado
atual dos horarios.

Motivo: evitar restaurar horarios que o administrador pode ter desativado
intencionalmente antes da inativacao do grupo.

Impacto: apos reativar um grupo, seus horarios podem precisar ser revisados no
detalhe do grupo. Nenhum schema ou contrato Sheets foi alterado.

## 2026-07-16 - Feedback por query string no painel de grupos

Contexto: o painel administrativo ainda nao possui sistema global de toast ou
mensagens persistentes.

Decisao: usar `searchParams.status` em `/grupos` para exibir feedback simples
apos ativar/inativar.

Motivo: manter o Ciclo 2 pequeno, auditavel e compativel com o padrao de
redirect das Server Actions existentes.

Impacto: feedback atual cobre `activated`, `deactivated`, `already-active`,
`already-inactive` e `error`. Filtros avancados por URL ficam para ciclo
posterior.

## 2026-07-16 - Ciclo 3 sera refinamento sem codigo nesta etapa

Contexto: o prompt do Ciclo 3 pede criar documentacao completa antes de
implementar qualquer ajuste.

Decisao: o Ciclo 3 fica documentado como refinamento responsivo, acessibilidade,
loading/erro, estados e acabamento visual, sem implementacao nesta etapa.

Motivo: preservar a regra de ciclos e evitar misturar planejamento com
alteracoes de UI.

Impacto: `especificacao-ciclo-3.md` e `execucao-ciclo-3.md` passam a ser os
contratos antes do Tiro 1.

## 2026-07-16 - Acoes mobile continuam visiveis por padrao

Contexto: o painel possui poucas acoes essenciais por grupo: visualizar, editar,
duplicar e ativar/inativar.

Decisao: a estrategia inicial do Ciclo 3 e manter icones visiveis no mobile, e
nao migrar automaticamente para menu de tres pontos.

Motivo: menu de tres pontos adicionaria estado, foco, fechamento e descoberta
visual sem necessidade comprovada.

Impacto: menu de tres pontos fica como alternativa apenas se os testes de
mobile mostrarem overflow ou excesso de acoes.

## 2026-07-16 - Paginacao depende de volume real

Contexto: `/grupos` usa `readAggregatedAtas()`, que carrega as abas do contrato
Sheets via `batchGet`, e o painel filtra grupos localmente.

Decisao: nao implementar paginacao no Ciclo 3 sem medir volume real de grupos e
avaliar impacto de UX/performance.

Motivo: paginacao pode piorar busca local e adicionar complexidade sem ganho
comprovado.

Impacto: Tiro 4 deve registrar recomendacao de paginacao apenas se houver dado
real que justifique.

## 2026-07-16 - Sidebar colapsada em tablet no Ciclo 3

Contexto: o breakpoint mobile existente em `globals.css` era apenas
`max-width: 720px`, deixando tablets estreitos com sidebar lateral larga.

Decisao: adicionar breakpoint intermediario de 721px a 980px com sidebar
colapsada por icones, mantendo `aria-label` e `title`.

Motivo: preservar espaco de conteudo em tablet sem introduzir drawer.

Impacto: desktop continua com labels visiveis, tablet usa sidebar colapsada e
mobile mantem navegacao compacta horizontal.

## 2026-07-16 - Menu de tres pontos nao adotado no Tiro 2 do Ciclo 3

Contexto: as acoes atuais por grupo continuam sendo quatro icones essenciais e
cabem no layout mobile com quebra controlada.

Decisao: manter as acoes visiveis e nao introduzir menu de tres pontos no Ciclo
3.

Motivo: preservar descoberta visual, reduzir estado interativo adicional e
evitar complexidade de foco/fechamento de menu.

Impacto: acoes podem quebrar linha em telas estreitas, mas permanecem
diretamente acessiveis.

## 2026-07-16 - Loading e erro dedicados para `/grupos`

Contexto: `/grupos` depende de `readAggregatedAtas()` e de leitura do Sheets,
podendo ter espera perceptivel ou falha de carregamento.

Decisao: criar `src/app/grupos/loading.tsx` e `src/app/grupos/error.tsx` no
Ciclo 3.

Motivo: oferecer estado visual coerente enquanto o painel carrega e mensagem
nao tecnica quando a rota falha.

Impacto: nenhuma regra de dados, autenticacao ou Sheets foi alterada. O erro
mostra acao de tentar novamente sem expor detalhes tecnicos.
