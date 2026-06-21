# Contrato do MVP - Participação

## Objetivo

Coletar somente fatos sobre presença, visitantes e trocas de chaveiro. Totais
que podem ser calculados não são campos de preenchimento.

## Total de membros presentes

`total_membros_presentes` é obrigatório, inteiro e maior ou igual a zero. Ele é
informado uma vez na seção Participação e persistido na aba `atas`.

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
| cidade | seleção | Obrigatória |
| categoria | seleção | Obrigatória |
| origem_contato | seleção | Obrigatória |

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

Cada troca gera uma linha na aba `trocas_chaveiro` e contém somente
`tempo_limpo`.

Valores aceitos:

- 30 dias
- 60 dias
- 90 dias
- 6 meses
- 9 meses
- 1 ano
- 18 meses
- Múltiplos anos

Nome e padrinho ou madrinha não são coletados no MVP.

## Valores derivados

O backend calcula e não persiste:

- total de localidades
- total de estados
- total de países
- total de visitantes
- total de trocas de chaveiro
- quantidade de membros sem localidade informada

Total de ingressos e total de partilhas estão fora do escopo do MVP.
