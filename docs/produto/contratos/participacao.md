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

## Localidade

A seção Participação contém somente os totais. As cidades e quantidades da
reunião ficam em uma seção própria chamada `Localidade`. Cada
cidade adicionada gera uma linha na aba `participacao`.

| Campo | Controle | Regra |
| --- | --- | --- |
| localidade | autocomplete | Município brasileiro obrigatório |
| estado | derivado | UF derivada do município escolhido |
| pais | derivado | Sempre `Brasil` no MVP |
| presencas | quantidade | Obrigatória e maior que zero |

A soma das presenças nacionais e internacionais registradas para uma ata não
pode superar `total_membros_presentes`. A quantidade de membros sem localidade
informada é a diferença entre esses valores e será calculada pelo backend.

## Membros internacionais

Cada registro internacional também gera uma linha na aba `participacao`. Para
esses registros, `localidade` e `estado` ficam vazios, `pais` recebe o país
selecionado e `presencas` mantém a quantidade informada.

| Campo | Controle | Regra |
| --- | --- | --- |
| localidade | não exibido | Vazia para membros internacionais |
| pais | seleção | Obrigatório; carregado do cache local de países |
| presencas | quantidade | Obrigatória e maior que zero |

A aplicação consome o cache local `data/paises.json` durante o preenchimento.
Esse arquivo é atualizado pela REST Countries API através do script
`npm run paises:update`, que pode ser agendado diariamente no ambiente de
execução.

## Visitantes

Cada visitante gera uma linha na aba `visitantes`.

| Campo | Controle | Regra |
| --- | --- | --- |
| nome | gerado pelo backend | `visitante_1`, `visitante_2` e assim por diante, por ata |
| cidade | autocomplete | Município brasileiro obrigatório, no formato `Nome - UF` |
| descricao | seleção | Obrigatória; usa os valores controlados de categoria |
| como_chegou_a_na | seleção | Obrigatória; usa os valores controlados de origem do contato |

A interface não exibe campo de nome para visitantes. O backend gera o nome técnico
pela posição final do visitante na ata, reiniciando a contagem em cada ata.

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

- `30 dias`
- `60 dias`
- `90 dias`
- `6 meses`
- `9 meses`
- `1 ano`
- `18 meses`
- `Múltiplos anos`

Nome e padrinho ou madrinha não são coletados no MVP.

## Ingressos

Cada ingresso gera uma linha na aba `ingressos`.

| Campo | Controle | Regra |
| --- | --- | --- |
| nome | texto | Se vazio, persistir `Anonimo` |
| cidade | autocomplete | Município brasileiro obrigatório, no formato `Nome - UF` |

A interface não exibe campo de nome para ingressos. O backend persiste
`Anonimo` para manter compatibilidade com a aba `ingressos`. Um ingresso só pode
ser registrado quando a ata possui pelo menos um visitante. `total_ingressos` é derivado pela contagem de
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
