# Diagnostico do modelo de ATA

Data: 2026-06-23

## Escopo

Este documento registra o estado atual do modelo de ATA antes da refatoracao em
3 tiros. O TIRO 1 nao altera regra de negocio nem arquivos em `src/`; serve
como mapa de rotas, contratos, payloads, persistencia e pontos de risco.

## Rotas e fluxo de criacao

- `/atas/nova` renderiza o formulario de criacao em
  `src/app/atas/nova/page.tsx` e `src/app/atas/nova/ata-form.tsx`.
- A gravacao passa por `createAtaAction` em
  `src/app/atas/nova/actions.ts`.
- A action exige sessao autorizada, `confirmed=true` e um campo `payload` em
  JSON.
- O payload e validado por `ataSubmissionSchema`.
- A persistencia oficial e `createAtaInSheets`, em
  `src/lib/sheets/create-ata.ts`.
- Apos gravar, a action revalida `/` e redireciona para `/atas/{ataId}`.
- `/` lista atas agregadas via `readAggregatedAtas`.
- `/atas/[ataId]` exibe detalhe somente leitura usando a mesma leitura
  agregada.
- Nao ha rota, Server Action ou repositorio para editar uma ata existente.

## Payload de entrada atual

O payload de criacao atual tem este formato logico:

```ts
{
  ata: {
    grupo_id,
    data_reuniao,
    hora_inicio,
    plataforma,
    tipo_reuniao,
    formatos,
    total_membros_presentes,
  },
  servidores: [{ nome }],
  participacao: [{ localidade, estado, pais, presencas }],
  visitantes: [{ nome, cidade, categoria, origem_contato }],
  trocas_chaveiro: [{ tempo_limpo }],
}
```

O backend materializa IDs e auditoria em `materializeAtaSubmission`:

- `ata_id`;
- IDs de dependentes;
- `created_at`;
- `updated_at`;
- `ordem` dos servidores.

## Contratos de dominio

Os contratos principais ficam em `src/domain/*`.

- `ataSchema` aceita `tipo_reuniao` somente por `tipoReuniaoMapping.codes`.
- `tipoReuniaoMapping` contem apenas `aberta` e `fechada`.
- `formato_estudo` nao e tipo de reuniao; aparece apenas dentro de
  `formatos`.
- `total_partilhas` ainda nao existe no dominio, no formulario ou no Sheets.
- `ingressos` ainda nao existe no dominio, no formulario, no contrato Sheets ou
  na agregacao.
- `participacao` ja suporta `localidade`, `estado`, `pais` e `presencas`.
- `visitantes` ja suporta `nome`, `cidade`, `categoria` e `origem_contato`.
- `trocas_chaveiro` contem somente `tempo_limpo`; nao existe `quantidade`.
- `tempo_limpo` usa codigos internos legados:
  `dias_30`, `dias_60`, `dias_90`, `meses_6`, `meses_9`, `ano_1`,
  `meses_18`, `multiplos_anos`.

## Validacoes atuais

- Horario de inicio aceita intervalos de 30 minutos.
- `formatos` exige ao menos um formato.
- `participacao.presencas` deve ser pelo menos 1.
- Se `pais` for Brasil, `estado` e obrigatorio; se nao for Brasil, `estado`
  deve ficar vazio.
- `visitantes.cidade` deve ser municipio conhecido.
- A soma de `participacao.presencas` nao pode superar
  `ata.total_membros_presentes`.
- `assertCreationAllowed` bloqueia grupo inexistente, grupo inativo e ata
  duplicada pela chave `grupo_id + data_reuniao + hora_inicio`.

## Persistencia Google Sheets

O contrato rigido de cabecalhos fica em `src/lib/sheets/contract.ts`.

Abas atuais:

- `grupos`;
- `atas`;
- `servidores`;
- `participacao`;
- `visitantes`;
- `trocas_chaveiro`.

A aba `atas` contem:

- identificacao e chave de reuniao;
- `plataforma`;
- `tipo_reuniao`;
- flags de formato, incluindo `formato_estudo`;
- `total_membros_presentes`;
- auditoria.

A escrita e atomica por `spreadsheets.batchUpdate` com `appendCells` em
`buildAtomicAppendRequests`. O lote atual escreve `atas`, `servidores`,
`participacao`, `visitantes` e `trocas_chaveiro`.

## Leitura e agregacao

`readAggregatedAtas` le todas as abas do contrato e delega para
`aggregateContractRows`.

A agregacao atual:

- filtra linhas invalidas por schema;
- valida integridade de referencias e duplicidade;
- rejeita dependentes que apontam para `ata_id` invalido;
- rejeita participacao cuja soma exceda `total_membros_presentes`;
- monta `AtaCompleta` por `ata_id`;
- calcula indicadores em `calcularIndicadores`.

Indicadores atuais:

- `total_localidades`;
- `total_estados`;
- `total_paises`;
- `total_visitantes`;
- `total_trocas_chaveiro` por quantidade de linhas;
- `membros_sem_localidade = total_membros_presentes - soma(presencas)`.

## Docs, reconciliacao e testes acoplados

Documentos que precisam acompanhar o contrato:

- `docs/produto/contratos/informacoes-gerais.md`;
- `docs/produto/contratos/participacao.md`;
- `docs/arquitetura/arquitetura-de-dados.md`;
- `docs/arquitetura/modelo-de-dados.dbml`;
- `docs/projeto/historico.md`;
- `docs/desenvolvimento/checklist-executivo.md`.

Scripts acoplados ao contrato:

- `scripts/reconcile-sheet-validations.mjs`;
- `scripts/reconcile-sheet-protections.ts`.

Testes atuais cobrem:

- schemas de dominio e formulario;
- regras e indicadores;
- integridade;
- agregacao;
- conversao Sheets ida/volta;
- escrita atomica;
- protecoes;
- Server Action de criacao.

## Pontos que podem quebrar nos proximos tiros

- Qualquer nova coluna no Sheets precisa entrar em `SHEET_HEADERS`, schemas,
  conversores, escrita atomica, leitura agregada, docs e reconciliacao.
- A ordem de cabecalhos e parte do contrato; alterar sem reconciliar a planilha
  causa leitura/escrita incorreta.
- `ingressos` exige nova aba, novo schema de dominio, novo schema Sheets, nova
  leitura, escrita, agregacao e validacao de integridade.
- `total_ingressos` deve ser derivado por contagem de linhas validas, nao
  persistido.
- `total_trocas_chaveiro` hoje conta linhas; com `quantidade`, deve somar
  quantidades.
- O frontend atual envia o payload full de visitantes e participacao; no TIRO 3
  ele devera enviar/normalizar o modelo hidden sem reduzir o contrato full
  persistido.
- Visitantes e ingressos anonimos devem persistir exatamente `Anonimo`, embora a
  UI exiba `Anonimo` com acento.
- A imutabilidade depende da ausencia de fluxo de update/delete e da escrita
  append-only; a refatoracao nao deve criar edicao de ata existente.
