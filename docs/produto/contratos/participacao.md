# Contrato do MVP - Participação

## Objetivo

Coletar fatos sobre presença, partilhas, localidades, visitantes, ingressos e
trocas de ficha. Totais derivados por contagem não são campos persistidos.

## Total de membros presentes

`total_membros_presentes` é obrigatório e selecionado uma vez na seção
Participação. A interface oferece lista suspensa de 1 a 100 e inicia em 10. O
valor é persistido na aba `atas`.

## Total de partilhas

`total_partilhas` é obrigatório e selecionado uma vez na seção Participação. A
interface oferece lista suspensa de 1 a 30 e inicia em 5. O valor é persistido
na aba `atas`.

## Localidade - Cidades (UF)

A seção Participação contém somente os totais. As cidades e quantidades da
reunião ficam em uma seção própria chamada `Localidade - Cidades (UF)`. Cada
cidade adicionada gera uma linha na aba `participacao`.

| Campo | Controle | Regra |
| --- | --- | --- |
| localidade | autocomplete | Município brasileiro obrigatório |
| estado | derivado | UF derivada do município escolhido |
| pais | derivado | Sempre `Brasil` no MVP |
| presencas | quantidade | Obrigatória e maior que zero |

A soma das presenças registradas para uma ata não pode superar
`total_membros_presentes`. A quantidade de membros sem localidade informada é a
diferença entre esses valores e será calculada pelo backend.

## Visitantes

Cada visitante gera uma linha na aba `visitantes`.

| Campo | Controle | Regra |
| --- | --- | --- |
| nome | texto | Se vazio, persistir `Anonimo` |
| cidade | autocomplete | Município brasileiro obrigatório, no formato `Nome - UF` |
| categoria | seleção | Obrigatória |
| origem_contato | seleção | Obrigatória |

Na interface, o campo de nome usa `Anonimo` como placeholder. O usuário pode
clicar e escrever um nome; se deixar vazio, o backend persiste `Anonimo`.

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

## Troca de ficha

Cada troca de ficha gera uma linha na aba `trocas_chaveiro` e contém
`tempo_limpo` e `quantidade`. O nome da aba permanece técnico para preservar o
contrato existente; a interface usa `Troca de ficha`.

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
| nome | texto | Se vazio, persistir `Anonimo` |
| cidade | autocomplete | Município brasileiro obrigatório, no formato `Nome - UF` |

Ingressos seguem a mesma lógica visual de visitantes: o campo de nome usa
`Anonimo` como placeholder, o usuário pode escrever um nome e, se deixar vazio,
o backend persiste `Anonimo`. `total_ingressos` é derivado pela contagem de
linhas válidas na aba `ingressos`.

## Valores derivados

O backend calcula e não persiste:

- total de localidades
- total de estados
- total de países
- total de visitantes
- total de ingressos
- total de trocas de ficha
- quantidade de membros sem localidade informada

`total_trocas_chaveiro` é a soma de `trocas_chaveiro.quantidade`.

A origem e atualização da lista de municípios estão definidas na
[Arquitetura de dados](../../arquitetura/arquitetura-de-dados.md).
