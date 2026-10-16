# Rastreabilidade dos requisitos V2

Esta matriz liga requisito, tarefa executável, cenário de aceite e checkpoint. F1 é pré-condição técnica para todas as alterações de dados; não substitui o teste funcional da fase proprietária do requisito.

| Requisito | Tarefa(s) de implementação | Cenário de aceite resumido | CP |
| --- | --- | --- | --- |
| UX-01 | F70-T01 | Menu, rota e item selecionado corretos em desktop/mobile; sem retorno indevido. | CP-07 |
| UX-02 | F20-T01, F70-T01 | Remover somente cards/abas pedidos e preservar dados; referência anterior no cadastro. | CP-02, CP-07 |
| CAD-01 | F20-T02 | Rótulos, Brasília e ajuda utilizável por mouse, foco e toque; fuso original preservado. | CP-02 |
| MES-01 | F20-T03 | Encargos conhecidos/Outro, Desde, vago e remoção sem linhas fictícias; textos livres mantidos. | CP-02 |
| PLA-01 | F20-T04 | Catálogo e plataformas distintas por horário; ata prevista herda a selecionada. | CP-02 |
| PLA-02 | F20-T04 | Exceção de link isolada por horário, origem clara e nenhum link histórico inventado. | CP-02 |
| AGE-01 | F20-T05, F60-T01 | Conversão a Brasília consistente, inclusive virada de dia; extra não cria recorrência. | CP-02, CP-06 |
| FOR-01 | F30-T01 | Responsável e formulário público aceitam/rejeitam o mesmo payload de negócio com acesso próprio. | CP-03 |
| FOR-02 | F30-T01 | Comemorativa/Serviço persistem; formatos antigos e texto livre Outros continuam legíveis. | CP-03 |
| VIS-01 | F30-T02 | Checkbox só para Provável adicto; gera um ingresso vinculado; remoção/categoria limpa rascunho. | CP-03 |
| VIS-02 | F30-T02 | Ingressos antigos permanecem independentes sem associação inferida. | CP-03 |
| RES-01 | F30-T03 | Membros/Partilhas editáveis e validados; demais totais atualizam após listas. | CP-03 |
| RES-02 | F30-T03 | Grade 3×3 e regras de contagem aprovadas, com cidades/estados/países distintos. | CP-03 |
| DET-01 | F30-T04 | Título/índice e blocos conforme contrato; UUID e relações mantidos. | CP-03 |
| DET-02 | F30-T04 | Listas pedidas numeradas de forma consistente. | CP-03 |
| HIS-01 | F60-T01 | Data/dia/intervalo/mês, horário e preenchedor combinam por interseção; ordenação e fuso corretos. | CP-06 |
| HIS-02 | F60-T02 | Falta só após duas horas e agenda comprovada; pendente não conta como ausente. | CP-06 |
| HIS-03 | F60-T03 | Anterior/próxima respeitam filtro, acesso e ordem; sem linhas fictícias. | CP-06 |
| REV-01 | F40-T01 | Configuração do grupo aplicada no servidor; novos envios aprovados ou pendentes conforme estado. | CP-04 |
| REV-02 | F40-T01 | Desativar revisão não altera pendências já existentes. | CP-04 |
| REV-03 | F40-T02 | Responsável atua só no próprio grupo; admin atua em todos; público apenas envia. | CP-04 |
| REV-04 | F40-T03 | Seleção visível confirmada; um item inválido cancela todo o lote; paginação/filtro limpa seleção. | CP-04 |
| CIC-01 | F50-T01 | Editar/Aprovar cria nova revisão aprovada e auditada; anterior preservada; reunião contada uma vez. | CP-05 |
| CIC-02 | F50-T02 | Exclusão lógica exige motivo, preserva dependentes e sai de listagens/indicadores. | CP-05 |
| REL-01 | F40-T04, F50-T03 | Somente revisão ativa aprovada compõe indicadores, uma vez por reunião. | CP-04, CP-05 |
| REL-02 | F60-T04 | Acumulado desde fundação usa referência anterior + reuniões aprovadas até hoje; relatório mensal segue mensal. | CP-06 |
| PDF-01 | F30-T05, F70-T02 | PDF e tela concordam em datas, plataforma, totais e estado; impressão conferida. | CP-03, CP-07 |

## Dependência transversal da F1

F1-T02–T07 sustenta os contratos de todos os requisitos: readers v1/v2, colunas além de Z, permissões, concorrência, repetição, lote único e recuperação. Cada fase posterior precisa manter testes de regressão desses pontos e não pode ativar seu comportamento antes do respectivo CP.
