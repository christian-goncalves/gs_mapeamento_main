# Especificação e execução da refatoração V2

## Situação

Base documental confirmada pelo usuário em 16/10/2026, na ESP-Q10: “Confirmo a base documental”. A confirmação abrange os 27 requisitos, contratos transversais, ordem F0–F7 e conferência dos checkpoints por fase. A execução da F0 foi iniciada por instrução do usuário em 16/10/2026; o estado vigente fica exclusivamente no checklist.

## Documentos

| Fonte | Responsabilidade |
| --- | --- |
| [Diagnóstico confirmado](../../analise-diagnostico/refatoracao-v2-2026-10-16.md) | Evidências originais, estado anterior e decisões Q1–Q22 da análise. |
| [Especificação funcional](../../produto/refatoracao-v2/especificacao-funcional.md) | Requisitos, comportamentos observáveis e decisões desta etapa. |
| [Contratos técnicos](../../arquitetura/refatoracao-v2/contratos-tecnicos.md) | Identidade, estados, persistência, compatibilidade e limites de garantia. |
| [Plano de execução](plano-execucao.md) | Fases, dependências, entregas e checkpoints. |
| [F0 detalhada](fase-0-preparacao.md) | Tarefas de preparação e evidências necessárias antes de modificar comportamento. |
| [Evidências F0](evidencias-f0-2026-10-16.md) | Estado local/Vercel, baseline, leitura de DEV, contrato proposto, coordenação e recuperação. |
| [Evidências F1](evidencias-f1-2026-10-16.md) | Autorização, inventário de escritores e progresso local da compatibilidade. |
| [Rastreabilidade](rastreabilidade-v2.md) | Requisito → tarefa → cenário → checkpoint. |
| [Detalhe da F1](fase-1-compatibilidade-escrita.md) | Escopo, tarefas, testes e aceite da F1 autorizada e em andamento. |
| [Checklist de execução](checklist-execucao.md) | Única fonte de andamento, aceite dos checkpoints e ligações às evidências. |

## Método confirmado

Mapa completo e contratos comuns definidos antes de implementar, com detalhamento progressivo por fase. Desenvolvimento local pode avançar entre fases sem aguardar o fechamento de pendências operacionais da fase anterior. Checkpoints continuam registrando prontidão para gravação real, migração, cutover, publicação ou ativação; essas ações exigem autorização própria. O usuário confere o resultado funcional do pacote, sem aprovações intermediárias para cada tarefa local.

Em 16/10/2026, o usuário autorizou continuar a F2 em código local enquanto CP-01 permanece aberto como gate para novas gravações em Sheets e ativação. A autorização anterior de escrita na planilha compartilhada cobriu somente o teste F1 já registrado; não se estende a gravações de negócio da F2.
