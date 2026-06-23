# Contrato do MVP - Informações Gerais

## Objetivo

Definir os campos escalares de identificação da reunião exibidos na seção
Informações Gerais da aplicação.

Na persistência, esses campos ficam na aba `atas`. Servidores são repetíveis e,
por isso, ficam na aba `servidores`.

## Campos da seção

| Campo | Controle | Regra |
| --- | --- | --- |
| grupo_id | seleção | Grupo ativo cadastrado na aba `grupos` |
| data_reuniao | data | Obrigatória |
| hora_inicio | seleção de hora | Obrigatória, em intervalos de 30 minutos |
| plataforma | seleção | Obrigatória e com valores controlados |
| tipo_reuniao | seleção única | `aberta` ou `fechada` |
| formatos | seleção múltipla | Pelo menos um formato obrigatório |
| servidores | lista repetível | Um nome por item |

O usuário seleciona o grupo pelo nome. A aplicação persiste o `grupo_id` UUID;
`zoom_id` e `ordem` pertencem ao cadastro do grupo e não são identificadores da
ata.

## Formatos de reunião

As opções controladas são:

- Partilha
- Estudo
- Temática
- Literatura
- Passos
- Tradições

Na aba `atas`, cada opção é armazenada em uma coluna booleana própria:

- `formato_partilha`
- `formato_estudo`
- `formato_tematico`
- `formato_literatura`
- `formato_passos`
- `formato_tradicoes`

## Horários

Os horários aceitos começam em `00:00`, avançam em intervalos de 30 minutos e
terminam em `23:30`.

## Servidores

Cada servidor gera uma linha na aba `servidores`, vinculada à reunião por
`ata_id`. Não existem colunas `servidor_1`, `servidor_2` ou limite fixo de
servidores.

## Campos fora desta seção

- `ata_id`, `created_at` e `updated_at` são gerados pelo backend.
- `total_membros_presentes` pertence à seção Participação, embora seja
  persistido na linha principal da aba `atas`.
- `total_partilhas` também é persistido na linha principal da aba `atas`.
- Localidades, visitantes, ingressos e trocas de chaveiro ficam em suas
  próprias abas.
- Tema, hora de encerramento, ID manual e número da reunião não fazem parte do
  MVP.

O fluxo de confirmação, imutabilidade e deduplicação está definido no
[Escopo do MVP](../escopo-mvp.md).
