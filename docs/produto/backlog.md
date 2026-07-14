# Backlog de produto

Este arquivo registra ideias, pendencias de produto e features futuras que
surgem durante a validacao do MVP. Ele evita que novas necessidades virem
refatoracoes soltas antes de passarem por planejamento.

O MVP vigente continua definido em [Escopo do MVP](escopo-mvp.md). Itens deste
backlog so entram em implementacao depois de virarem plano aprovado no
[Plano de desenvolvimento](../desenvolvimento/plano-de-desenvolvimento.md) e
tarefas no [Checklist executivo](../desenvolvimento/checklist-executivo.md).

## Horarios personalizados por grupo

Status: pendente para planejamento pos-MVP.

Problema:

- A criacao de atas hoje usa uma lista geral de horarios.
- Alguns grupos possuem horarios fixos e recorrencias proprias.
- O usuario precisa escolher rapidamente o horario correto do grupo, sem
  depender apenas de memoria ou digitacao manual.

Exemplos conhecidos:

- `Bom dia Brasil`: diario as `09:00`.
- `USL`: `07:00` em alguns dias da semana.
- `USL`: `10:00` todos os dias.
- `USL`: `15:00` de segunda a sabado.
- `USL`: `21:30` todos os dias.

Direcao inicial:

- Registrar uma agenda padrao por grupo.
- Ao selecionar o grupo no formulario, sugerir ou restringir os horarios
  disponiveis conforme a agenda do grupo.
- Preservar a possibilidade de registrar excecoes somente se isso for aprovado
  no planejamento da feature.

Questoes para planejamento:

- A agenda deve apenas sugerir horarios ou bloquear horarios fora do padrao?
- Onde a agenda deve morar: aba `grupos`, nova aba no Sheets ou configuracao em
  codigo?
- Como representar dias da semana e excecoes?
- O campo `hora_inicio` deve continuar sendo parte da chave de duplicidade?
- Como migrar grupos existentes sem quebrar atas historicas?

Fora do escopo ate decisao explicita:

- Alterar a regra de duplicidade.
- Criar calendario completo de reunioes.
- Integrar com Google Calendar.
- Automatizar criacao recorrente de atas.

## Ajustes de UX do formulario de ata

Status: implementado.

Implementado:

- `Tipo de reuniao` exibe `Fechada` antes de `Aberta`.
- `Fechada` e o valor inicial do formulario.
- Os botoes `Adicionar...` ficam abaixo das listas preenchidas.
- As setas de reordenacao foram removidas das linhas repetidas.
- O botao `Remover` foi preservado em cada linha.

Problema:

- O formulario esta funcional, mas alguns controles atrapalham o preenchimento
  real quando ha muitas linhas repetidas.
- Em `Localidade - Cidades (UF)`, o botao `Adicionar cidade` fica no topo da
  secao. A partir da terceira cidade, o usuario precisa rolar a tela de volta
  para cima para adicionar outra localidade.
- As setas de reordenacao em cada linha ocupam espaco visual e nao sao
  prioridade no preenchimento manual.
- O tipo de reuniao precisa refletir melhor o uso esperado.

Ajustes implementados:

- Em `Tipo de reuniao`, exibir a ordem `Fechada` e depois `Aberta`.
- Deixar `Fechada` marcada por default.
- Mover todos os botoes `Adicionar...` para baixo da lista ja preenchida,
  mantendo o botao perto do proximo item que sera criado.
- Priorizar esse ajuste em `Localidade - Cidades (UF)`, onde a lista tende a
  crescer mais.
- Remover os botoes de seta para cima/baixo das linhas repetidas.
- Manter o botao `Remover` em cada linha.

Critério de aceite atendido:

- O usuario consegue adicionar terceira, quarta e demais cidades sem voltar ao
  topo da secao.
- A tela fica mais limpa em desktop e mobile.
- O fluxo de revisao e envio continua inalterado.
- Nenhuma regra de persistencia, autenticacao ou contrato Sheets muda por causa
  desse ajuste visual.

## Exportar ata confirmada em PDF

Status: pendente para planejamento pos-MVP.

Problema:

- Apos o envio, a aplicacao mostra a ata em modo somente leitura, com
  informacoes gerais, indicadores, servidores, participacao por localidade,
  visitantes, ingressos e troca de ficha.
- O usuario pode precisar guardar, compartilhar ou imprimir esse resumo como
  comprovante de registro.
- Hoje a tela confirma o registro visualmente, mas nao oferece download em PDF.

Direcao inicial:

- Adicionar uma acao `Baixar PDF` na tela de detalhe da ata.
- O PDF deve representar a ata confirmada, nao o rascunho do formulario.
- O conteudo deve usar os mesmos dados relidos do Sheets que alimentam a tela
  somente leitura.
- O arquivo deve ter nome previsivel, por exemplo:
  `ata-bom-dia-brasil-2026-06-24.pdf`.

Questoes para planejamento:

- Gerar o PDF no servidor ou usar impressao/download pelo navegador?
- O PDF precisa ter identidade visual propria ou pode seguir o layout limpo da
  tela atual?
- Deve incluir data/hora de geracao do documento?
- Deve incluir identificador tecnico `ata_id` para auditoria?
- O botao deve aparecer apenas no detalhe da ata ou tambem logo apos a
  confirmacao de envio?

Critério de aceite futuro:

- Depois de enviar uma ata, o usuario consegue baixar um PDF da ata confirmada.
- O PDF contem os mesmos dados exibidos no detalhe somente leitura.
- O download nao cria nem altera linhas no Sheets.
- O recurso respeita a autorizacao existente: apenas usuario permitido acessa e
  baixa o PDF.
- A ata continua imutavel; exportar PDF nao cria fluxo de edicao.
