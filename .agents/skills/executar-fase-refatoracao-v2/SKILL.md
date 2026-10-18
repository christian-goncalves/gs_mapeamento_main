---
name: executar-fase-refatoracao-v2
description: Executa uma fase da refatoração V2 do GS Mapeamento, requisito por requisito, em um ciclo de trabalho, com pausas somente para validações manuais ou gates externos. Use com “Executar fase 2” ou “continuar”.
---

# Executar fase da refatoração V2

Execute uma fase completa por ciclo de trabalho. Dentro dela, implemente e confira cada requisito individualmente, mantendo o contexto focado na fase atual. Continue em outro ciclo somente se o usuário solicitar, a janela de contexto estiver próxima do limite ou uma validação externa/manual for necessária.

## Preparação

1. Confirme que está na raiz deste checkout e leia `AGENTS.md` e `docs/desenvolvimento/diretrizes-agentes.md`.
2. Confira `git status` e os diffs existentes. Preserve todo trabalho preexistente; não restaure, apague, faça stage ou commit de mudanças incidentais.
3. Leia o checklist de execução para localizar a primeira fase incompleta ou o ponto de pausa. Se o usuário indicar uma fase, siga essa indicação e confira dependências no plano.
4. Consulte o plano e leia a especificação e o contrato técnico dos requisitos que serão executados. Use a rastreabilidade para critérios e checkpoints relacionados. Leia documentos detalhados de outras fases ou evidências históricas somente quando a tarefa depender deles.
5. Para a V2, as referências principais ficam em `docs/desenvolvimento/refatoracao-v2/`, `docs/produto/refatoracao-v2/` e `docs/arquitetura/refatoracao-v2/`. O checklist é a única fonte do andamento.

## Executar a fase

1. Identifique os requisitos ainda pendentes da fase. Não refaça requisito já concluído; confira se mudanças posteriores ou testes mostram regressão antes de considerá-lo fechado.
2. Trabalhe os requisitos um por vez: confirme o critério observável, localize os arquivos proprietários, implemente a menor mudança coerente e rode verificações direcionadas. Registre internamente o resultado e siga ao próximo requisito independente.
3. Faça a validação funcional, visual e de regressão apropriada à fase. Ao fim, execute as verificações gerais definidas pelo projeto/plano e registre resultados reais, inclusive falhas preexistentes e seu alcance.
4. Não crie um relatório separado para cada requisito. Mantenha o progresso de trabalho na conversa e nos resultados de ferramentas; atualize o checklist em um único resumo no fechamento da fase ou quando precisar registrar uma pausa, uma decisão ou um bloqueio manual.
5. Atualize plano, rastreabilidade ou documentos detalhados somente quando escopo, dependência, critério, tarefa ou contrato tiver mudado. Preserve evidências de fases anteriores como histórico; acrescente ou altere evidência quando houver fato novo relevante, como uma nova execução externa ou mudança de estado de checkpoint.

## Pausas e gates

- Código local e testes sintéticos podem avançar conforme autorização já registrada, mesmo quando um checkpoint operacional anterior continua aberto.
- Pare apenas a parte que dependa de validação manual, decisão do usuário ou autorização de efeito externo. Conclua antes o trabalho independente da fase e prepare o material concreto para a validação: o que foi feito, como conferir e qual resultado deve ser observado.
- Após a validação, retome do ponto registrado. “Continuar” significa seguir a fase pendente indicada no checklist, sem repetir tarefas concluídas.
- Checkpoint é conferência consolidada da fase, não uma solicitação de aprovação por tarefa local. Não declare a fase ou checkpoint aceito enquanto os critérios obrigatórios não estiverem comprovados.
- Um checkpoint não concede autorização para gravar em planilhas reais, migrar dados, fazer cutover, publicar, ativar funcionalidade ou alterar configuração externa. Verifique autorização explícita e gates aplicáveis imediatamente antes de cada ação.
- Para o GS Mapeamento, CP-01 permanece gate operacional para novas gravações reais, migração e cutover; seu estado não bloqueia por si só desenvolvimento local da F2. A autorização anterior de teste de escrita não se estende a operações de negócio. Preserve as evidências F1 existentes, inclusive registros de ledger e readback.
- Se uma ação externa autorizada tiver resultado incerto, não faça retry automático nem uma segunda mutação. Reconcilie pelo identificador/ledger disponível e pare se o resultado continuar inconclusivo.

## Atualizar o andamento

No resumo do checklist, registre por requisito: estado, mudança principal, verificações e resultado, pendência manual/externa e próximo ponto de retomada. No fechamento da fase, registre também os critérios do checkpoint, o que foi comprovado, o que ficou pendente e os links para evidências já existentes ou realmente necessárias. Não replique nos demais documentos o histórico que já está registrado.

## Entrega ao usuário

Informe a fase e os requisitos tratados, arquivos de produto alterados, verificações executadas e resultados, mudanças no checklist, pendências que exigem ação do usuário e estado real do checkpoint. Separe código local validado de comportamento comprovado em ambiente externo. Se a fase não puder ser concluída, explique o impedimento específico e deixe o ponto de retomada registrado no checklist.
