# Especificação funcional da refatoração V2

## Situação e origem

Base de especificação funcional confirmada pelo usuário na ESP-Q10 em 16/10/2026, após entrevista por grilling. Não autoriza implementação, escrita no Sheets ou publicação.

Base confirmada: [diagnóstico V2 e decisões Q1–Q22](../../analise-diagnostico/refatoracao-v2-2026-10-16.md). Este documento transforma as decisões em requisitos verificáveis; não substitui o registro das evidências. Os contratos canônicos afetados serão harmonizados na etapa de especificação aprovada, antes de habilitar novos comportamentos.

Plano e acompanhamento: [índice da execução](../../desenvolvimento/refatoracao-v2/README.md). Contratos transversais: [contratos técnicos](../../arquitetura/refatoracao-v2/contratos-tecnicos.md).

## Requisitos e critérios de aceite

Cada ID permanece estável entre especificação, tarefa, teste e checkpoint. Os cenários abaixo são critérios de produto; a distribuição em arquivos de teste pertence ao detalhamento de cada fase.

| ID | Regra e alcance | Critério de aceite observável |
| --- | --- | --- |
| UX-01 | Menu do responsável: Dados cadastrais → Histórico de atas → Relatórios. Padronizar títulos e rótulos do material aprovado. | Cada item abre sua rota em desktop e mobile; selecionado acompanha a rota; navegação não retorna indevidamente a Dados cadastrais. |
| UX-02 | Retirar cards e abas indicados no histórico; retirar card de horários ativos e levar referência anterior ao cadastro. | Valores persistidos permanecem preservados; desaparecem somente os elementos visuais pedidos; histórico mantém acesso a atas e filtros. |
| CAD-01 | Dados cadastrais simplificam rótulos de email/link da ata; Horários de Reunião informa Brasília com ajuda acessível. | Informação funciona por mouse, foco e toque; ausência do seletor de fuso não elimina o fuso original necessário à leitura histórica. |
| MES-01 | Servidores da Mesa permite selecionar encargos conhecidos e Outro, informar nome e Desde, remover encargo e apresentar (vago). | Não criar linhas fictícias para encargos vazios; campos livres continuam livres no domínio/Sheets; modal e ações refletem o cadastro real. |
| PLA-01 | Grupo tem catálogo de plataformas com nome, link e ações; cada horário aponta para uma plataforma. | Dois horários do mesmo grupo podem usar plataformas diferentes; ata prevista herda a plataforma do horário selecionado. |
| PLA-02 | Link do horário herda o catálogo e permite exceção própria. | Alterar exceção não altera outros horários; origem do link efetivo é identificável; histórico não recebe links antigos inventados. |
| AGE-01 | Exibição em Brasília e conversão a partir do fuso de origem; reuniões extras escolhem plataforma do grupo. | Conversão de data/horário é consistente em formulário, histórico, filtros, detalhe e PDF, inclusive virada de dia. Extra não cria recorrência automaticamente. |
| FOR-01 | Responsável e link público compartilham campos e validações de preenchimento. Data/Horário e prefixo Grupo seguem o material; Preenchido por permanece coletado. | Mesmo payload de negócio é aceito/rejeitado nos dois contextos, respeitada a autorização própria de cada entrada. |
| FOR-02 | Adicionar Comemorativa e Serviço, mantendo formatos atuais e Outros como texto livre. | Opções novas persistem e são relidas; atas antigas continuam legíveis; não impor enum ao texto de Outros. |
| VIS-01 | Visitante tem Cidade/Descrição na primeira linha; origem e checkbox Ingresso na linha inferior responsiva, com lixeira inferior. | Checkbox somente para Provável adicto; uma marcação gera um ingresso com a cidade do visitante; não há preenchimento separado duplicado. Remoção ou mudança de categoria elimina o ingresso derivado no rascunho. |
| VIS-02 | Preservar visitantes e ingressos históricos independentes. | Leitura não associa pessoas/cidades por palpite; uma ata antiga continua exibindo seus ingressos registrados. |
| RES-01 | Resumo ao fim do formulário substitui Participação como bloco de coleta de Membros e Partilhas. | Os dois totais continuam editáveis e validados; os demais totais são calculados e atualizados após alteração das listas. |
| RES-02 | Grade 3 × 3: Servidores/Membros/Partilha; Visitantes/Ingresso/Conquista; Cidades/Estados/Outros países. | Servidores/visitantes/ingressos contam itens; conquistas somam quantidades; cidades e estados brasileiros são distintos; países estrangeiros distintos excluem Brasil. |
| DET-01 | Título Ata de reunião nº …, índice sem # e 01–09; remover identificação técnica visual; reorganizar informações gerais. | Data, hora, preenchido por, plataforma, tipo e formatos ficam no bloco correspondente; Membros/Partilhas aparecem nos totais; UUID e relações persistidos não são apagados. |
| DET-02 | Numerar listas conforme padrão de Servidores. | Localidades, membros internacionais, visitantes, ingressos e conquistas possuem numeração consistente e legível. |
| HIS-01 | Filtros de data específica/intervalo/mês, horário e preenchido por combinam por interseção; padrão por data e horário decrescentes. | Duas reuniões no mesmo dia continuam distintas; filtro de preenchedor usa `ata.preenchido_por`; conversão para Brasília é considerada no filtro e ordenação. |
| HIS-02 | Não enviada é uma ocorrência comprovada da agenda sem ata ativa recebida, após duas horas do início. | Linha mostra data, horário e estado vermelho, sem inventar número, preenchedor ou UUID; pendente é ata recebida e não é classificada como ausente; não projetar faltantes em passado sem agenda comprovada. |
| HIS-03 | Ata anterior/Próxima ata respeitam filtro e ordem da listagem de origem. | Percorrem somente atas existentes e acessíveis; linha sem ata não é destino; abertura direta tem navegação de grupo definida no detalhamento. |
| REV-01 | Revisão desmarcada por padrão: novos envios entram aprovados, apresentados como Enviada. Marcada: entram Pendentes de revisão. | Ambos os contextos de preenchimento respeitam a configuração no servidor; dados legados não são reclassificados retroativamente. |
| REV-02 | Desligar revisão não aprova pendências antigas. | Ata que já estava pendente permanece assim; apenas próximos envios seguem a nova configuração. |
| REV-03 | Responsável aprova no próprio grupo; administrador em todos os grupos; link público só envia. | Ações no servidor rejeitam acesso a outro grupo e não confiam em controles ocultos da interface. |
| REV-04 | Aprovação em lote dos pendentes explicitamente selecionados na página visível, com confirmação do conjunto/quantidade. | Se a validação anterior à escrita detectar qualquer item alterado, excluído ou não autorizado, o lote inteiro é cancelado e os itens são informados. Trocar página/filtro limpa a seleção; limite técnico será fechado na F0. |
| CIC-01 | Editar abre apresentação preenchida do resumo e cria revisão, com motivo/autor/data. | Aprovar por responsável/admin gera nova revisão já aprovada; anterior fica substituída e preservada; reunião conta uma vez; identidade visual permanece. |
| CIC-02 | Exclusão é lógica, com confirmação e motivo, conforme contrato canônico. | Ata e dependentes permanecem auditáveis; deixam listagens e indicadores normais; índices não são reutilizados. |
| REL-01 | Somente revisões ativas aprovadas entram em indicadores. | Pendente, substituída e excluída não aumentam totais; dados de reunião são contados uma vez. |
| REL-02 | Reuniões desde a fundação = referência anterior + reuniões com ata ativa aprovada até hoje. | Usa todo o histórico até hoje mesmo em relatório de mês antigo; demais indicadores continuam mensais; não contar faltantes ou revisões duplicadas. |
| PDF-01 | PDF acompanha dados e rótulos do detalhe, com composição própria de impressão. | Números, datas, plataforma, totais e estado não contradizem a tela; evidências visuais cobrem impressão e ausência de identificação técnica pedida. |

## Casos de referência para aprovação

- Revisão ligada + envio público: ata persistida pendente, visível no histórico, ausente dos totais.
- Aprovação pelo responsável do grupo: mesma reunião passa a contar uma vez; repetir a mesma operação não duplica efeito.
- Tentativa de outro grupo: ação negada e nenhuma escrita.
- Editar aprovada + Aprovar: versão anterior preservada, nova versão aprovada, total de reuniões permanece o mesmo.
- Desligar revisão com pendências existentes: pendências continuam aguardando aprovação.
- Lote com um item inválido detectado antes da escrita: nenhuma aprovação iniciada.

## Decisões desta etapa de especificação

| Entrevista | Decisão |
| --- | --- |
| ESP-Q1 | Mapa completo e contratos compartilhados definidos; detalhamento de cada fase antes de sua execução. |
| ESP-Q2 | Publicações por blocos completos e compatíveis, após validação em DEV. |
| ESP-Q3 | Conferência do usuário ao fim de cada fase; verificações internas das tarefas automatizadas. |
| ESP-Q4 | Pendências antigas mantidas ao desativar revisão. |
| ESP-Q5 | Edição seguida de Aprovar gera nova revisão já aprovada. |
| ESP-Q6 | Invalidade detectada na conferência de um item cancela todo o lote. |
| ESP-Q7 | Exigir coordenação compartilhada das gravações da aplicação antes de habilitar novas mutações; componente, custos e operação serão apresentados separadamente. Não há autorização de provisionamento. |
| ESP-Q8 | Seleção em lote somente da página visível, com conferência do conjunto e quantidade. |
| ESP-Q9 | Blocos de preenchimento/detalhe usam Cidades e Outros países, alinhados aos indicadores; preservar campos internos e histórico. |
| ESP-Q10 | Em 16/10/2026, o usuário confirmou a base documental: 27 requisitos, contratos transversais, ordem F0–F7 e checkpoints por fase. A F0 permanece aguardando instrução de execução. |

## Fechamento desta especificação

As decisões de produto e método desta rodada e a conferência global do pacote documental estão concluídas na ESP-Q10. Dicionário físico, mecanismo de coordenação, dimensionamento do lote e procedimento operacional de recuperação são entregáveis explícitos da preparação F0 e precisam estar fechados antes da implementação F1. Esses itens não são declarados implementados ou aprovados por antecipação.
