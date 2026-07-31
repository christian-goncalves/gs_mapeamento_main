# Contrato de execução

## Sumário

1. [Entrada e resolução](#entrada-e-resolução)
2. [Geração mensal](#geração-mensal)
3. [Validação e duplicidade](#validação-e-duplicidade)
4. [Persistência DEV](#persistência-dev)
5. [Artefatos e recuperação](#artefatos-e-recuperação)

## Entrada e resolução

A entrada contém `grupo`, `mes`, `ano`, `servidores` e `seed` opcional. Resolver
`grupo` por UUID exato ou nome sem diferenciar caixa e acentos. Rejeitar zero ou
mais de um resultado, grupo inativo e ausência de horários ativos.

Normalizar nomes com `trim`, remoção de vazios e deduplicação sem diferenciar
caixa e acentos, preservando a primeira grafia. Exigir ao menos dois nomes.
Usar a lista somente em `atas.preenchido_por` e nos dois servidores distintos
de cada ata.

## Geração mensal

Percorrer todos os dias reais do mês e associar o dia da semana aos horários
ativos cadastrados. Ordenar por `data_reuniao` e `hora_inicio`.

Gerar cada submissão com os schemas atuais:

- plataforma `zoom`, reunião `fechada`, formato `partilha`;
- duração e formato outros vazios;
- 30 a 60 membros e 10 a 17 partilhas;
- exatamente dois servidores e funções nominais, sem `Outros`;
- 10 a 20 municípios brasileiros distintos de
  `src/data/municipios-ibge.json`, com uma ou duas presenças;
- zero ou um membro internacional, nunca Brasil;
- um ou dois visitantes com enums atuais;
- um ingresso nas atas 4, 8, 12 e seguintes;
- conquistas nas atas 1, 4, 7 e seguintes, alternando uma e duas linhas,
  sempre com `quantidade: 1` e tempos distintos.

Passar toda escolha simulada pelo gerador baseado na combinação de grupo,
período, lista normalizada e seed. UUIDs são materializados apenas no commit.

## Validação e duplicidade

A chave é `grupo_id + data_reuniao + hora_inicio`. Qualquer conflito existente
ou interno aborta o mês completo. Nunca ignorar, substituir, excluir ou gravar
somente atas ausentes.

Validar cada submissão pelo `ataSubmissionSchema` e conferir horários, mês,
servidores, localidades, limites de participação, visitantes e sequências
mensais antes de preparar a escrita.

## Persistência DEV

O planejamento pode ler somente o ID de `GOOGLE_SHEETS_DEV_ID` e nunca escreve.
O commit exige simultaneamente:

- `ATA_SIMULATION_ENABLED=true`;
- `GOOGLE_SHEETS_DEV_ID` presente;
- destino idêntico ao ID DEV configurado;
- autorização explícita representada por `--authorized`;
- ausência de qualquer pedido de produção.

Antes do lote, reler o Sheets, comparar o plano regenerado, reservar sequências
e índices em memória, materializar UUIDs e salvar o manifesto pendente. Agrupar
as linhas de `atas`, `servidores`, `participacao`, `visitantes`, `ingressos` e
`trocas_chaveiro` em uma única chamada `spreadsheets.batchUpdate`.

## Artefatos e recuperação

Salvar em `artifacts/ata-simulations/<grupo>-<ano>-<mes>-<seed>/`:

- `input.json`;
- `summary.md`;
- `validation.json`;
- `commit-manifest.pending.json`;
- `commit-manifest.committed.json`, somente após confirmação.

Em falha de rede com resultado desconhecido, não repetir automaticamente.
Reconciliar todas as chaves e UUIDs do manifesto. Classificar como `committed`,
`not-committed` ou `partial-or-unknown` e relatar o estado encontrado.
