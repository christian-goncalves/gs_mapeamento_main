# Diagnóstico das reuniões de julho

## Objeto da investigação

Verificar por que os dados de reuniões de julho de 2026 não apareciam corretamente no painel local e esclarecer a divergência restante na seção por horário.

## Evidências examinadas

- `.env.local`: a aplicação local está configurada para a planilha de desenvolvimento; o conteúdo das credenciais não foi registrado.
- Abas de grupos, horários e atas da planilha de desenvolvimento, consultadas em modo de leitura.
- Captura do painel mensal de julho de 2026 com o grupo correto selecionado.
- Código `src/app/relatorios/monthly-group-dashboard-data.ts`, que seleciona atas por grupo e mês, calcula reuniões previstas a partir dos horários ativos e compara grupo, data e hora.

## Estado observado

- O grupo selecionado na captura está cadastrado na planilha de desenvolvimento e associado à conta autenticada localmente.
- Existem atas do grupo para julho de 2026, registradas em horários diferentes dos horários ativos configurados para as reuniões previstas.
- A captura confirma que o painel está no grupo correto e apresenta os indicadores consolidados de julho.
- As reuniões previstas aparecem como “sem ATA / Sala fechada”, e a seção por horário não inclui os horários registrados nas atas.

## Análise

Os indicadores consolidados usam as atas filtradas por grupo e mês. Por isso, os registros do grupo em julho entram nos totais exibidos.

A lista de reuniões previstas usa os horários ativos da aba `grupo_horarios`. O painel cruza cada reunião prevista com uma ata usando grupo, data e hora. Como os horários configurados não coincidem com os horários das atas de julho, nenhuma ata corresponde exatamente às ocorrências previstas. Isso explica as reuniões marcadas como sem ata e os resultados zerados nos horários configurados. As médias e os totais consolidados continuam considerando as atas do mês.

Os dados observados não permitem concluir qual horário deve prevalecer. A decisão depende da agenda real do grupo.

## Diagnóstico

A conexão local com a planilha de desenvolvimento está funcionando, e os dados de julho do grupo selecionado aparecem no painel. A vinculação não precisa ser trocada para recuperar esses valores.

A divergência está entre os horários configurados como ativos e os horários registrados nas atas. A regra atual exige correspondência de grupo, data e hora para considerar que uma reunião prevista possui ata. Não foram alterados os dados da planilha, os horários, `.env.local` ou a lógica do painel.

## Grau de certeza

- **Alto:** a aplicação local está usando a planilha de desenvolvimento; a captura exibe indicadores consolidados; os horários das atas diferem dos horários ativos; o código compara grupo, data e hora para identificar atas das reuniões previstas.
- **Pendente de decisão do responsável pelo grupo:** se os horários configurados ou os horários das atas refletem a agenda correta, e se uma ata fora do horário previsto deve quitar uma reunião agendada.

## Próximo passo

Confirmar a agenda real do grupo e a regra desejada para atas em horários diferentes. Com essa confirmação, será possível decidir entre atualizar os horários ativos na planilha ou ajustar a regra do painel, sem presumir qual fonte está correta.
