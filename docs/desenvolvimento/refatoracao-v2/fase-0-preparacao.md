# F0 — Preparação e fechamento dos contratos

## Objetivo e limites

Deixar a primeira implementação delimitada, verificável e reversível. Documento integrante da base confirmada na ESP-Q10 em 16/10/2026. Execução da F0 iniciada por instrução do usuário em 16/10/2026. Não alterar schemas da aplicação, reconciliar planilhas, criar atas de teste ou publicar nesta fase de preparação.

## Entradas

Diagnóstico confirmado, especificação funcional, contratos transversais e método de execução aceito. A conferência global do pacote e as decisões de produto desta etapa foram concluídas na ESP-Q10. Os entregáveis técnicos de preparação permanecem descritos abaixo e têm seu andamento registrado exclusivamente no [checklist](checklist-execucao.md).

## Tarefas

| ID | Trabalho delimitado | Entrega/evidência |
| --- | --- | --- |
| F00-T01 | Registrar branch, commit, worktree e dependências locais; preservar alterações do usuário. | Identificação da base e inventário do que não pertence à V2; nenhum descarte/commit incidental. |
| F00-T02 | Identificar os ambientes reais e acesso por papel, sem expor valores de segredos. Confirmar separação entre planilhas DEV/PROD e destino do servidor/preview. | Mapa de ambientes com evidência recente e capacidade de leitura/teste; pendências de acesso explícitas. A troca de conta no navegador, se necessária, é coordenada com o usuário. |
| F00-T03 | Inspecionar configuração dos testes e efeitos externos; executar baseline somente após comprovar isolamento. | Resultados de `npm test`, `npm run lint`, `npm run build`; falhas preexistentes separadas e impacto classificado. Nada de teste de escrita em produção. |
| F00-T04 | Fechar representação física e máquina de estados dos contratos comuns; confrontar dados legados por leitura autorizada. | Dicionário de campos, cabeçalhos/intervalos, compatibilidade antigo/novo, invariantes, regras de migração e mapa de consumidores. |
| F00-T05 | Inventariar todos os escritores da planilha e especificar prova da coordenação/repetição, recuperação após timeout e limite do lote. | Garantias e limites expressos; matriz de cenários simultâneos; componente, custos e operação apresentados; decisão registrada antes de provisionar algo. Abranger criação legada, versões implantadas e política de edição manual no corte. |
| F00-T06 | Definir export, identificação de ponto de retorno e conferência da recuperação de dados. | Roteiro de backup/recuperação verificável, incluindo dados criados depois do backup; sem executar restauração nesta fase. |
| F00-T07 | Completar matriz requisito → tarefa → cenário → checkpoint e detalhar F1. | Todos os requisitos cobertos pelo mapa; F1 com tarefas e aceite operacional concretos; contratos canônicos afetados identificados para harmonização. |
| F00-T08 | Apresentar CP-00 ao usuário e registrar o resultado. | Aceite ou ajustes com evidências vinculadas no checklist; F1 não inicia automaticamente. |

## CP-00 — Critérios de saída

- Base e ambientes identificados sem suposição de que `.env.local` aponta para DEV.
- Baseline atual conhecido, sem misturar falha anterior com regressão futura.
- Contratos comuns e recuperação compreensíveis, com garantias realizáveis.
- F1 pronta para revisão: entradas, tarefas, testes, limite de alteração e retorno.
- Aprovação do usuário registrada antes de avançar.

## Condições de parada

Ambiente de teste confundido com produção; teste com efeito externo desconhecido; incompatibilidade histórica sem regra definida; mecanismo de concorrência ainda não escolhido; falta de evidência para a recuperação proposta; divergência de escopo. Registrar o impedimento e continuar somente atividades independentes seguras.

## Recuperação da própria F0

F0 não muda comportamento nem dados de negócio. Preservar documentos e evidências; não executar comandos de limpeza do worktree. Se alguma ferramenta gerar artefato incidental, identificar precisamente e remover/restaurar somente o efeito da própria execução, preservando o trabalho do usuário.
