# Plano executivo - painel administrativo de grupos

Data: 2026-07-16

Status geral: Ciclo 1 concluido tecnicamente em 2026-07-16; Ciclo 2 validado
em 2026-07-16 com build bloqueado por pendencia preexistente; Ciclo 3
documentado e aguardando autorizacao para implementacao.

Documento de origem: [painel-administrativo-grupos-2026-07-16.md](../projeto/painel-administrativo-grupos-2026-07-16.md).

## Objetivo

Implementar uma nova experiencia para o painel administrativo de grupos,
inspirada no layout de referencia, preservando os dados reais, a autenticacao
existente e o contrato Sheets atual.

## Escopo

Incluido nesta etapa:

- painel administrativo de grupos em `/grupos`;
- shell administrativo;
- menu lateral;
- resumo de grupos;
- abas por status;
- busca local;
- listagem responsiva;
- acoes administrativas ja existentes;
- responsividade e acessibilidade base.

Fora de escopo nesta etapa:

- painel do responsavel pelo grupo;
- alteracao de contrato Sheets;
- migracao;
- filtros avancados sem regra real;
- paginacao server-side;
- paginas funcionais de Atas, Usuarios, Relatorios e Configuracoes.

## Ciclos

### Ciclo 1 - Painel administrativo visual e funcional com dados reais

Entrega a nova estrutura de `/grupos` usando as capacidades atuais:

- dados de `readAggregatedAtas()`;
- protecao por `requireAdminSession()`;
- criacao por `/grupos/novo`;
- edicao por `/grupos/[grupoId]`;
- duplicacao por `duplicateGrupoAction`;
- inativacao por `deactivateGrupoAction`, com `deleteGrupoAction` mantida como
  compatibilidade temporaria.

Detalhes tecnicos: [especificacao-ciclo-1.md](especificacao-ciclo-1.md).

Execucao operacional: [execucao-ciclo-1.md](execucao-ciclo-1.md).

### Ciclo 2 - Acoes administrativas e estados operacionais

Entrega a ativacao/inativacao real de grupos no painel administrativo:

- normalizacao de nomenclatura de inativacao;
- `activateGrupoAction`;
- acao correta conforme status do grupo;
- confirmacao antes da mudanca;
- feedback de sucesso/erro;
- revalidacao das rotas afetadas;
- testes das Server Actions e regressao.

Detalhes tecnicos: [especificacao-ciclo-2.md](especificacao-ciclo-2.md).

Execucao operacional: [execucao-ciclo-2.md](execucao-ciclo-2.md).

### Ciclo 3 - Responsividade, acessibilidade e acabamento

Entrega o refinamento definitivo do painel administrativo em desktop, tablet e
mobile:

- comportamento final da sidebar;
- lista e acoes mobile sem overflow;
- acessibilidade de tabs, foco, teclado e icones;
- estados de loading, erro, vazio e operacao em andamento;
- decisao sobre `loading.tsx` e `error.tsx`;
- refinamento visual e regressao.

Detalhes tecnicos: [especificacao-ciclo-3.md](especificacao-ciclo-3.md).

Execucao operacional: [execucao-ciclo-3.md](execucao-ciclo-3.md).

### Ciclos posteriores

Ficam apenas referenciados, sem especificacao nesta etapa:

- avaliar entrada inteligente em `/` e possivel namespace `/admin/*`;
- avaliar paginacao somente se o volume real justificar.

## Dependencias

- `src/app/grupos/page.tsx`;
- `src/app/grupos/group-list-actions.tsx`;
- `src/app/grupos/actions.ts`;
- `src/lib/auth/require-session.ts`;
- `src/lib/auth/access.ts`;
- `src/lib/sheets/repository.ts`;
- `src/lib/sheets/group-admin.ts`;
- `src/app/globals.css`;
- Font Awesome ja instalado no projeto.

## Riscos

- quebrar a protecao admin da rota `/grupos`;
- misturar Server Components e Client Components de forma incorreta;
- criar links sem rota funcional;
- alterar CSS global de forma ampla demais;
- alterar regras de Sheets sem necessidade;
- transformar inativacao em exclusao visual;
- esconder acoes importantes no mobile.

## Checkpoints gerais

- `/grupos` continua protegido por admin;
- dados continuam vindo da fonte real;
- nenhuma mudanca em schemas, Sheets, autenticacao ou migracao;
- acoes atuais continuam funcionando;
- layout responde em desktop, tablet e mobile;
- `npm run lint` passa;
- `npm run test` passa.

## Status

| Item | Status |
| --- | --- |
| Plano executivo | criado |
| Especificacao Ciclo 1 | criada |
| Especificacao Ciclo 2 | criada |
| Especificacao Ciclo 3 | criada |
| Plano por tiros | criado |
| Checklist | criado |
| Registro de execucao | criado |
| Registro de decisoes | criado |
| Implementacao | Ciclos 1 e 2 validados; Ciclo 3 nao iniciado |
