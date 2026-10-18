# Gateway Apps Script (F1)

Fonte preparada; não provisionada nem publicada.

## Configuração operacional necessária

- Propriedade de script `SPREADSHEET_ID`: ID exato da planilha autorizada para a fase.
- Propriedade de script `GATEWAY_HMAC_SECRET`: mesmo segredo aleatório configurado como `SHEETS_GATEWAY_HMAC_SECRET` no ambiente server-side Vercel.
- Propriedade de script `GATEWAY_ADMIN_EMAILS`: lista separada por vírgula, ponto e vírgula ou quebra de linha, espelhando a lista `AUTH_ALLOWED_EMAILS` do backend. Necessária para que administradores possam alterar índice de ata; sem correspondência, a validação administrativa falha fechada.
- Variável `SHEETS_GATEWAY_URL`: URL do web app no ambiente server-side Vercel.
- Serviço avançado Google Sheets API V4 habilitado pelo manifesto.
- Aba `operacoes` com a linha 1 exatamente: `operacao_id, hash_solicitacao, tipo, ator, estado, criada_em, concluida_em, resultado_ref`.

O web app deve executar como a conta operacional escolhida e expor `doPost`. Toda chamada precisa de HMAC válido, timestamp com até 5 minutos, ID de operação/hash da intenção, limites, guards e lock global. A aba ledger precisa existir; o gateway falha fechado se estiver ausente ou incompatível. Mutação e ledger são enviados juntos em um único `batchUpdate`.

Em timeout, o cliente envia uma consulta somente leitura assinada com o mesmo ID/hash. O gateway obtém o mesmo lock e procura a linha no ledger. `aplicada` permite ao cliente devolver o sucesso anterior; `nao_encontrada`, `conflito` e `indeterminada` nunca permitem repetição automática. Ausência no ledger não prova que uma chamada original ainda em trânsito foi encerrada.

O HMAC autentica o backend Vercel como chamador; o gateway também revalida a autorização final a partir da capacidade declarada e dos dados relidos sob lock. Para operações autenticadas, compara o ator ao e-mail da autorização. `criar_ata`, `atualizar_indice_ata` e mutações de grupo/horário/equipe validam grupo ativo e vínculo ativo do responsável; ações administrativas exigem e-mail em `GATEWAY_ADMIN_EMAILS`. A sincronização de usuário é administrativa e valida grupo, usuário e linha de destino. As alterações de grupo feitas por responsável ficam limitadas às colunas permitidas. A lista `GATEWAY_ADMIN_EMAILS` precisa ser mantida sincronizada e governada com `AUTH_ALLOWED_EMAILS`.

Capacidades sem sessão permanecem separadas de identidade autenticada: link público exige token atual de grupo ativo e ata no mesmo grupo; ativação e redefinição exigem token atual, validade e linha de usuário; login validado pode atualizar somente metadados de último acesso; recuperação pode alterar somente token e expiração. Simulação mensal usa a capacidade operacional própria, exige grupo ativo e valida que as atas e registros dependentes gravados pertencem ao grupo e às atas declarados. Reparo de link só aceita grupo existente ainda sem token seguro e alteração do token/data, sem outros campos. Essas políticas têm cobertura sintética local, mas ainda precisam de homologação no runtime Google Apps Script. `SHEETS_OPERATION_ACTOR` é rótulo técnico e não constitui autorização individual.

Não publique antes de revisar escopos, modo de acesso do web app, endpoint, segredo, aba `operacoes`, quotas e plano de corte. Esta fonte não contém segredos nem valores de planilha.
