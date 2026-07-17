# Refatoracao do painel administrativo

Esta pasta organiza a execucao do novo painel administrativo de grupos do GS
Mapeamento. A etapa e limitada ao painel do administrador; o painel do
responsavel pelo grupo nao faz parte deste conjunto de documentos.

## Documentos

- [Plano executivo](plano-executivo.md): visao macro, escopo, ciclos, riscos,
  dependencias, checkpoints e status geral.
- [Especificacao do Ciclo 1](especificacao-ciclo-1.md): fonte tecnica para a
  primeira implementacao, com arquitetura, componentes, comportamento visual,
  fluxo de dados, acessibilidade e criterios de aceite.
- [Execucao do Ciclo 1](execucao-ciclo-1.md): guia operacional dividido em
  tiros pequenos, com tarefas, checkpoints e condicoes para avancar.
- [Especificacao do Ciclo 2](especificacao-ciclo-2.md): fonte tecnica para
  ativar/inativar grupos, feedback e testes das acoes administrativas.
- [Execucao do Ciclo 2](execucao-ciclo-2.md): guia operacional do Ciclo 2 em
  quatro tiros pequenos.
- [Especificacao do Ciclo 3](especificacao-ciclo-3.md): fonte tecnica para
  responsividade, acessibilidade, loading/erro, estados e acabamento visual.
- [Execucao do Ciclo 3](execucao-ciclo-3.md): guia operacional do Ciclo 3 em
  quatro tiros pequenos.
- [Checklist de validacao](checklist-validacao.md): lista reutilizavel apos cada
  tiro.
- [Registro de execucao](registro-execucao.md): historico real a ser atualizado
  depois de cada tiro executado.
- [Decisoes](decisoes.md): registro curto de decisoes tecnicas e de produto.

## Ordem de uso

1. Ler o [Plano executivo](plano-executivo.md).
2. Usar a especificacao do ciclo ativo como contrato tecnico.
3. Executar um tiro por vez a partir do documento de execucao do ciclo ativo.
4. Validar com o [Checklist](checklist-validacao.md).
5. Atualizar [Registro de execucao](registro-execucao.md) e
   [Decisoes](decisoes.md) quando aplicavel.

Nenhuma implementacao deve avancar para o proximo tiro antes do checkpoint do
tiro atual.
