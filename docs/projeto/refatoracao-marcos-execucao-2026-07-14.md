# Execucao da Refatoracao Marcos - GS Mapeamento

Fonte tecnica: `docs/projeto/refatoracao-marcos-gs-mapeamento-2026-07-14.md`  
Fonte da demanda: `docs/REFATORACAO-1_MARCOS/`  
Status geral: abortado em 2026-07-16

## Objetivo

Executar a refatoracao do GS Mapeamento em fases curtas, validaveis e sem
avancar para a fase seguinte antes do checkpoint da fase atual.

Mudancas de escopo, ordem, modelo ou regra de negocio devem ser registradas
primeiro no documento tecnico. Este documento executivo deve refletir apenas a
ordem, checkpoints e status.

## Status das fases

| Fase | Resumo | Status |
| --- | --- | --- |
| Fase 1 | Ajustes visuais seguros | validada |
| Fase 1.1 | Enxugar dashboard de atas | validada |
| Fase 2 | Comportamentos simples do formulario | validada |
| Fase 3 | Campos novos e migracoes pequenas | validada |
| Fase 4 | Visitantes, ingressos e membros internacionais | abortada |
| Fase 5 | Numeracao e duplicidade | cancelada |
| Fase 6 | Seguranca do link | cancelada |
| Fase 7 | Ciclo de vida, edicao e auditoria | cancelada |
| Fase 8 | PDF e relatorios | cancelada |

Status permitidos durante a execucao: `nao iniciada`, `em execucao`,
`validada`, `bloqueada`. Status finais apos encerramento manual: `abortada` e
`cancelada`.

## Encerramento manual

Em 2026-07-16, o plano de refatoracao Marcos foi abortado por decisao do
responsavel do projeto.

Estado no encerramento:

- Fases 1, 1.1, 2 e 3 estavam implementadas e validadas.
- A Fase 4 nao foi implementada; houve apenas registro de rascunho tecnico no
  documento principal.
- Fases 5, 6, 7 e 8 ficam canceladas neste plano.
- Nenhuma implementacao de codigo, contrato Sheets, migracao ou reconciliacao
  foi iniciada para a Fase 4.

## Fase 1 - Ajustes visuais seguros

Instrucao curta:

```text
Implemente somente a Fase 1 da refatoracao Marcos: ajustes visuais sem alterar
schemas, Sheets, autenticacao, permissoes ou payloads.
```

Escopo resumido:

- remover e-mail do cabecalho;
- ajustar labels e titulos;
- explicitar acao de visualizar ata;
- ajustar posicao do botao `Gerenciar`;
- renomear visualmente `Troca de ficha` para `Conquistas de tempo`;
- revisar texto visual do resumo sem alterar dados.

Checkpoint:

- `npm run lint` passa;
- `npm run test` passa;
- home, detalhe da ata e formulario continuam carregando;
- nenhuma coluna, schema, Server Action ou contrato Sheets foi alterado;
- validacao manual confirma que a UI mudou sem alterar gravacao.

Condicao para avancar:

- Fase 1 marcada como `validada`.

Resultado em 2026-07-16:

- Status: `validada`.
- Arquivos alterados na fase: `src/app/page.tsx`,
  `src/app/atas/[ataId]/page.tsx`, `src/app/atas/nova/ata-form.tsx` e
  `src/app/globals.css`.
- Validacao automatizada: `npm run lint` passou; `npm run test` passou com 19
  arquivos de teste e 131 testes.
- Validacao de rotas: servidor local existente em `127.0.0.1:3000` respondeu
  para `/`, `/atas/nova` e `/atas/teste-validacao` com redirecionamento
  autenticado esperado para `/login`; log do Next compilou `/` e `/atas/nova`
  sem erro.
- Contrato preservado: nenhuma alteracao nesta fase em schemas, contrato
  Sheets, Server Actions, autenticacao, permissoes ou payloads.
- Observacao fora do checkpoint: `npm run build` compilou a aplicacao, mas
  falhou no type check de `scripts/reset-ata-record-sheets.ts`, arquivo fora do
  escopo da Fase 1 e ja presente na arvore de trabalho.

## Fase 1.1 - Enxugar dashboard de atas

Instrucao curta:

```text
Implemente o ajuste visual do dashboard do responsavel antes da Fase 2,
mantendo edicao e PDF apenas como acoes visuais desabilitadas.
```

Escopo resumido:

- manter a administracao de grupos com a base visual aprovada;
- simplificar as atas validas para data e horario;
- remover indicadores de membros, visitantes e ingressos da linha de ata;
- trocar acao textual por icones;
- deixar visualizar ativo e editar/PDF desabilitados ate as fases 7 e 8.

Checkpoint:

- `npm run lint` passa;
- `npm run test` passa;
- home continua carregando;
- nenhuma coluna, schema, Server Action ou contrato Sheets foi alterado;
- edicao e PDF nao executam acao real.

Condicao para avancar:

- Fase 1.1 marcada como `validada`.

Resultado em 2026-07-16:

- Status: `validada`.
- Arquivos alterados na fase: `src/app/page.tsx` e `src/app/globals.css`.
- Documento tecnico atualizado antes da implementacao com a Fase 1.1.
- Validacao automatizada: `npm run lint` passou; `npm run test` passou com 19
  arquivos de teste e 131 testes.
- Validacao de rota: servidor local existente em `127.0.0.1:3000` respondeu
  para `/` com redirecionamento autenticado esperado para `/login`.
- Contrato preservado: nenhuma alteracao nesta fase em schemas, contrato
  Sheets, Server Actions, autenticacao, permissoes ou payloads.
- Edicao e PDF foram exibidos apenas como icones desabilitados; nenhuma acao
  real foi criada antes das fases 7 e 8.

## Fase 2 - Comportamentos simples do formulario

Instrucao curta:

```text
Implemente somente a Fase 2: comportamentos de formulario sem migracao pesada,
mantendo o contrato Sheets atual sempre que possivel.
```

Escopo resumido:

- ocultar grupo quando ja estiver fixo por link ou sessao;
- aplicar a decisao aprovada para `Preenchido por`;
- trocar controles numericos por incremento/decremento;
- tratar duplicidade de cidade se a regra estiver aprovada;
- preparar funcao de servidor somente se confirmada como campo simples.

Checkpoint:

- payload continua validado no backend;
- erros de formulario continuam claros;
- testes cobrem limites numericos e payload hidden;
- nenhuma migracao estrutural foi aplicada sem registro no documento tecnico.

Condicao para avancar:

- Fase 2 marcada como `validada`;
- decisoes de negocio necessarias para campos novos documentadas.

Resultado em 2026-07-16:

- Status: `validada`.
- Arquivos alterados na fase: `src/app/atas/nova/page.tsx`,
  `src/app/atas/nova/ata-form.tsx`, `src/app/globals.css` e
  `src/domain/hidden-submission.test.ts`.
- Grupo fixo por link ou por sessao de grupo unico deixou de aparecer no
  formulario, mas continua no payload.
- Selects numericos foram substituidos por controles de diminuir/aumentar para
  membros presentes, total de partilhas, quantidade por cidade e conquistas de
  tempo.
- Validacao automatizada: `npm run lint` passou; `npm run test` passou com 19
  arquivos de teste e 132 testes.
- Validacao de rota: servidor local existente em `127.0.0.1:3000` respondeu
  para `/atas/nova` com redirecionamento autenticado esperado para `/login`.
- Contrato preservado: nenhuma alteracao nesta fase em schemas, contrato
  Sheets, Server Actions, autenticacao, permissoes ou payloads.
- Decisoes pendentes documentadas no documento tecnico: origem oficial de
  `Preenchido por`, regra de duplicidade de cidade e `servidores.funcao`.

## Fase 3 - Campos novos e migracoes pequenas

Instrucao curta:

```text
Implemente somente a Fase 3: campos novos com reconciliacao controlada do
contrato Sheets e rollback documentado.
```

Escopo resumido:

- `duracao`;
- `formato_outros`;
- `grupos.ultima_reuniao_anterior`;
- `servidores.funcao`, se aprovado.

Checkpoint:

- contrato Sheets reconciliado em DEV;
- leitura agregada continua sem quebrar dados antigos;
- testes de schema, conversores, escrita, leitura e agregacao passam;
- rollback/backup registrado antes da reconciliacao;
- `npm run lint` e `npm run test` passam.

Condicao para avancar:

- Fase 3 marcada como `validada`;
- planilha DEV conferida manualmente.

Resultado em 2026-07-16:

- Status: `validada`.
- Arquivos alterados na fase: contrato Sheets, schemas de dominio/formulario,
  conversores Sheets, reconciliacao estrutural, formulario de ata, detalhe da
  ata, formulario de grupo e testes relacionados.
- Campos adicionados ao contrato: `grupos.ultima_reuniao_anterior`,
  `atas.duracao`, `atas.formato_outros` e `servidores.funcao`.
- `servidores.funcao` entrou como texto opcional, sem lista rigida nesta fase.
- `formato_outros` entrou como texto opcional associado ao formato visual
  `Outros`; se `Outros` for selecionado, o texto e obrigatorio no backend.
- Validacao automatizada: `npm run lint` passou; `npm run test` passou com 19
  arquivos de teste e 136 testes.
- Reconciliação DEV aplicada com
  `GOOGLE_SHEETS_ID=1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU npm run sheets:reconcile-contract`.
  Resultado: `addedColumns=[grupos.ultima_reuniao_anterior, atas.duracao,
  atas.formato_outros, servidores.funcao]`, `createdSheets=[]`,
  `validatedSheets=[grupos, usuarios_grupo, grupo_horarios, atas, servidores,
  participacao, visitantes, ingressos, trocas_chaveiro]`,
  `appliedRequestCount=11`.
- Idempotencia DEV validada com segunda execucao do mesmo comando. Resultado:
  `addedColumns=[]`, `createdSheets=[]`, mesmas nove abas validadas e
  `appliedRequestCount=5`.
- Rollback minimo registrado: em DEV, remover as colunas adicionadas acima e
  reexecutar a versao anterior do contrato, se necessario. O repositorio nao
  possui rotina automatizada de backup/export da planilha; antes de repetir em
  PROD, duplicar/exportar a planilha manualmente.

## Fase 4 - Visitantes, ingressos e membros internacionais

Instrucao curta:

```text
Implemente somente a Fase 4: reestruturacao de visitantes, ingressos e membros
internacionais, preservando compatibilidade com dados existentes.
```

Escopo resumido:

- decidir e implementar identificador sequencial de visitante;
- decidir se ingresso vira atributo de visitante ou se a aba historica permanece;
- modelar membros internacionais;
- atualizar resumo, detalhe e indicadores.

Checkpoint:

- dados antigos continuam legiveis;
- indicadores nao contam visitantes/ingressos em duplicidade;
- resumo e detalhe exibem o novo modelo;
- testes cobrem dados antigos e novos;
- plano de migracao e rollback conferido.

Condicao para avancar:

- Fase 4 marcada como `validada`;
- decisoes sobre ingresso e membros internacionais encerradas.

## Fases posteriores

Fase 5 - Numeracao e duplicidade:

- so iniciar apos fechar criterio oficial de duplicidade e regra de numeracao.

Fase 6 - Seguranca do link:

- so iniciar apos decidir se o link e permanente, temporario, por reuniao ou uso
  unico.

Fase 7 - Ciclo de vida, edicao e auditoria:

- so iniciar apos decidir se ata enviada pode ser editada, por quem e ate
  quando.

Fase 8 - PDF e relatorios:

- so iniciar apos estabilizar o modelo exibido no detalhe da ata.

## Principais riscos e dependencias

- Responsavel com multiplos grupos pode impactar a simplificacao da home.
- Campos de responsavel/e-mail afetam autenticacao, convite e recuperacao de
  senha.
- Link publico atual e reutilizavel; seguranca exige decisao de negocio.
- Edicao de ata conflita com o modelo atual de ata somente leitura.
- Migracoes no Sheets exigem backup, reconciliacao e testes antes de PROD.
- PDF depende do modelo final de detalhe da ata.

## Regra operacional

1. Antes de iniciar uma fase, marcar seu status como `em execucao`.
2. Implementar somente o escopo da fase.
3. Rodar os checkpoints definidos.
4. Se aprovado, marcar como `validada`.
5. Se surgir decisao pendente, marcar como `bloqueada`.
6. Atualizar primeiro o documento tecnico quando houver mudanca de escopo.
