# Contrato de campos de atas

## Campos de texto livre

| Campo | Interface | Google Sheets |
| --- | --- | --- |
| `atas.preenchido_por` | Texto aberto com sugestoes por grupo | Texto, sem dropdown |
| `servidores.nome` | Texto aberto com sugestoes por grupo | Texto, sem dropdown |
| `atas.duracao` | Nao exibido no formulario atual; compatibilidade historica | Texto opcional, sem dropdown |
| `atas.formato_outros` | Texto aberto quando `Outros` estiver marcado | Texto opcional, sem dropdown |

As sugestoes sao ajuda de preenchimento. Nao restringem os valores aceitos e nao
devem selecionar um nome automaticamente. A busca usa o prefixo digitado desde a
primeira letra, sem diferenciar caixa ou acentos.

## Campos controlados

| Campo | Controle |
| --- | --- |
| `atas.plataforma` | Lista com `Zoom`, `Zello` e `WhatsApp`; valor fixado pelo cadastro do grupo |
| `atas.tipo_reuniao` | Lista com `Aberta` e `Fechada` |
| `atas.formato_*` | Booleanos independentes |
| `servidores.funcao` | Coordenador, Moderador, Secretario, Apoio, Anfitriao, Coanfitriao ou Outros na interface |
| `visitantes.descricao` | Valores controlados de categoria |
| `visitantes.como_chegou_a_na` | Valores controlados de origem do contato |
| `trocas_chaveiro.tempo_limpo` | Enum do dominio |

## Visitantes e ingressos

- O formulario nao coleta `visitantes.nome`; o backend gera `visitante_N` pela ordem final na ata.
- `ingressos` exige pelo menos um visitante na mesma submissao.
- Os cabecalhos antigos `categoria`, `origem_contato` e `como_chegou_a_na?` sao aliases de migracao, nao o contrato canonico.

## Cache de nomes

O arquivo `data/ata-name-suggestions.json` e um cache operacional por
`grupo_id`. Ele contem listas separadas para `preenchido_por` e `servidores`.
Uma falha ao atualizar o cache depois da gravacao no Sheets deve ser registrada,
mas nao pode declarar como falha uma ata que ja foi persistida.

O cache local requer armazenamento persistente no ambiente de execucao. Em
ambiente efemero ou somente leitura, mover esse estado para armazenamento
externo antes de depender dele em producao.
