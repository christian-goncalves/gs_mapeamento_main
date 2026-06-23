# Contrato do MVP - Participação

## Objetivo

Coletar fatos sobre presença, partilhas, visitantes, ingressos e trocas de
chaveiro. Totais derivados por contagem não são campos persistidos.

## Total de membros presentes

`total_membros_presentes` é obrigatório, inteiro e maior ou igual a zero. Ele é
informado uma vez na seção Participação e persistido na aba `atas`.

## Total de partilhas

`total_partilhas` é obrigatório, inteiro e maior ou igual a zero. Ele é
informado uma vez e persistido na aba `atas`.

## Participação por localidade

Não há separação entre participação nacional e internacional. Cada item gera
uma linha na aba `participacao`.

| Campo | Controle | Regra |
| --- | --- | --- |
| localidade | seleção ou texto | Cidade ou localidade obrigatória |
| estado | seleção | Obrigatório quando `pais` for Brasil |
| pais | seleção | Obrigatório |
| presencas | número inteiro | Obrigatório e maior que zero |

A soma das presenças registradas para uma ata não pode superar
`total_membros_presentes`. A quantidade de membros sem localidade informada é a
diferença entre esses valores e será calculada pelo backend.

## Visitantes

Cada visitante gera uma linha na aba `visitantes`.

| Campo | Controle | Regra |
| --- | --- | --- |
| nome | texto | Obrigatório |
| cidade | autocomplete | Município brasileiro obrigatório, no formato `Nome - UF` |
| categoria | seleção | Obrigatória |
| origem_contato | seleção | Obrigatória |

Visitantes anônimos persistem `Anonimo` no campo `nome`.

### Categorias

- Provável adicto
- Familiar
- Profissional
- Estudante
- Outro

### Origens do contato

- Indicação pessoal
- Familiar
- Profissional
- Grupo de NA
- Internet
- Redes sociais
- Rádio
- TV
- Material impresso
- Evento/Palestra
- Encaminhamento
- Outro

## Trocas de chaveiro

Cada troca gera uma linha na aba `trocas_chaveiro` e contém `tempo_limpo` e
`quantidade`.

| Campo | Controle | Regra |
| --- | --- | --- |
| tempo_limpo | seleção | Obrigatório |
| quantidade | número inteiro | Obrigatória e maior que zero |

Valores aceitos:

- `1M`
- `2M`
- `3M`
- `6M`
- `9M`
- `12M`
- `18M`
- `MULTIPLOS_ANOS`

Nome e padrinho ou madrinha não são coletados no MVP.

## Ingressos

Cada ingresso gera uma linha na aba `ingressos`.

| Campo | Controle | Regra |
| --- | --- | --- |
| nome | texto | Obrigatório |

Ingressos anônimos persistem `Anonimo`. `total_ingressos` é derivado pela
contagem de linhas válidas na aba `ingressos`.

## Valores derivados

O backend calcula e não persiste:

- total de localidades
- total de estados
- total de países
- total de visitantes
- total de ingressos
- total de trocas de chaveiro
- quantidade de membros sem localidade informada

`total_trocas_chaveiro` é a soma de `trocas_chaveiro.quantidade`.

A origem e atualização da lista de municípios estão definidas na
[Arquitetura de dados](../../arquitetura/arquitetura-de-dados.md).
