# Diagnóstico: produção lê uma aba `atas` incompatível com o contrato publicado

## Objeto da investigação

Identificar a origem dos erros de produção causados por cabeçalhos incompatíveis na aba `atas`, distinguindo problema de credenciais/acesso de problema na planilha efetivamente lida.

## Contexto

O usuário informou que a mesma conta de serviço tem acesso de Editor tanto à planilha `GS Mapeamento | DEV` (`1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU`) quanto ao backup (`1JrW05ugRILp-zc7Rbcl0fUd1meHqAthtYflmBEXJOYs`). A análise foi somente de leitura. Nenhum valor de produção foi alterado e nenhum deploy foi iniciado.

## Evidências examinadas

- Runtime Errors do projeto Vercel `prj_gnXJNHWBsiGUFtJzcaROGPWWLpBY`, janela de 24 horas: dois grupos de erro, ambos em `/login` e `/`, cinco ocorrências por grupo, mais recente em `2026-10-17T17:25:17Z`, no deployment `dpl_FMrvcjz9CV2zkq9FSGR5pXh3bqLU`.
- Mensagem de runtime: o leitor esperava os 21 cabeçalhos da aba `atas` do contrato publicado e recebeu esses 21 seguidos por `status_registro`, `status_aprovacao`, `revisao_de_ata_id`, `motivo_alteracao` e `alterado_por`.
- Cabeçalho atual de `GS Mapeamento | DEV`, lido em `atas!A1:AF1`: contém os 21 cabeçalhos esperados seguidos dos cinco campos citados pelo runtime; a planilha tem ainda outros cabeçalhos depois deles.
- Cabeçalho atual do backup, lido em `atas!A1:AF1`: contém somente os 21 cabeçalhos esperados pelo runtime.
- Permissões do backup consultadas pelo Drive e captura de tela fornecida pelo usuário para ambas as planilhas: a conta de serviço `google-drive-sheets-gmail-docs@n8n-chaves-api-drive.iam.gserviceaccount.com` consta como `writer`/Editor no backup; a captura mostra a mesma conta como Editor também em `GS Mapeamento | DEV`.
- `.env.local`, comparado sem exibir os valores: `GOOGLE_SHEETS_ID` aponta para `GS Mapeamento | DEV`; `GOOGLE_SHEETS_BACKUP_ID` aponta para o backup informado. `src/lib/sheets/client.ts:22-24` usa exclusivamente `GOOGLE_SHEETS_ID` como fonte da aplicação; buscas no código de runtime e scripts não encontraram uso de `GOOGLE_SHEETS_BACKUP_ID` na aplicação.
- Código remoto de produção em `origin/main` (`06d74dafd6625769607d575211a69ea203bcf73e`): `src/lib/sheets/contract.ts:20-24` declara exatamente 21 cabeçalhos para `atas`; `src/lib/sheets/repository.ts:131-147` lê cada aba pelo intervalo `A:Z` e passa o resultado a `rowsToObjects`; `src/lib/sheets/rows.ts:20-26` rejeita qualquer cabeçalho adicional ou fora de ordem.
- Detalhes do deployment da Vercel e imagem enviada pelo usuário: produção está `READY`, ligada à branch `main` e ao commit `06d74da`. O estado `READY` não contradiz os erros de runtime.
- O valor de `GOOGLE_SHEETS_ID` na Vercel não foi lido. A autorização anterior para leitura de variáveis de produção cobriu somente `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## Estado observado

- A identidade de serviço tem permissão de Editor nas duas planilhas identificadas.
- No ambiente local, a variável que a aplicação realmente consulta (`GOOGLE_SHEETS_ID`) seleciona DEV; a variável de backup existe separadamente e não é consultada pelo código.
- O backup tem o cabeçalho antigo de 21 colunas esperado pelo código de produção.
- A aba `atas` de DEV tem os 21 campos esperados seguidos pelos cinco campos que aparecem no erro de produção.
- O código de produção lê até a coluna Z, que corresponde aos 21 campos contratuais mais esses cinco campos extras de DEV.
- O runtime de produção continua registrando erro de leitura do contrato da aba `atas` nas rotas `/login` e `/`.

## Análise

A hipótese de falta de compartilhamento não explica o erro observado: a conta de serviço tem papel Editor nas duas planilhas, e o log é uma falha de validação do cabeçalho, não uma resposta de autenticação ou autorização da API.

O intervalo que o código publicado lê é `A:Z`, ou 26 colunas. A assinatura do erro contém exatamente 26 cabeçalhos: os 21 do contrato mais os cinco campos V2. Essa sequência coincide exatamente com `DEV!atas!A:Z`. O backup, em contraste, tem somente os 21 cabeçalhos esperados e não produziria essa mensagem se fosse o intervalo lido.

Isso aponta para a planilha DEV como fonte efetivamente lida em produção, apesar da intenção de usar o backup. A configuração local reforça a inferência: a aplicação seleciona DEV por `GOOGLE_SHEETS_ID`; `GOOGLE_SHEETS_BACKUP_ID` apenas guarda o identificador do backup e não participa da leitura. A confirmação absoluta da configuração de produção depende de comparar seu `GOOGLE_SHEETS_ID` com os IDs conhecidos. Esse valor não foi lido porque a autorização anterior para variáveis de produção se limitou a `GOOGLE_SERVICE_ACCOUNT_EMAIL`.

## Hipóteses avaliadas

- **Descartada para esta falha:** a conta de serviço não tem acesso às planilhas. A conta aparece com Editor nas duas planilhas, e o erro concreto é de cabeçalho.
- **Fortemente sustentada:** a produção está apontando para `GS Mapeamento | DEV` (ou para outra planilha com o mesmo cabeçalho em `atas!A:Z`), em vez de apontar para o backup. A comparação exata da sequência de 26 colunas e a configuração local que seleciona DEV por `GOOGLE_SHEETS_ID` sustentam essa inferência; o ID configurado na Vercel não foi lido.
- **Descartada para este erro específico:** o backup possui cabeçalho incompatível com o contrato publicado. A leitura atual do seu cabeçalho encontrou exatamente os 21 campos esperados.
- **Confirmada:** o leitor publicado rejeita cabeçalhos adicionais. A regra está explícita em `rowsToObjects` e produz a mensagem observada no runtime.

## Diagnóstico

A falha não é causada por falta de permissão da conta de serviço nem pelo cabeçalho do backup. O deployment publicado lê uma aba `atas` cujo intervalo `A:Z` contém cinco colunas V2 além das 21 aceitas pelo código. Esse cabeçalho coincide exatamente com o início da aba `atas` de `GS Mapeamento | DEV` e difere do backup, que corresponde ao contrato publicado. Localmente, a aplicação também seleciona DEV porque lê `GOOGLE_SHEETS_ID`; a variável `GOOGLE_SHEETS_BACKUP_ID` não é usada pelo leitor. Portanto, a causa mais provável é a configuração de produção estar vinculada à planilha DEV, ou a outra planilha com a mesma estrutura, e não ao backup escolhido.

## Grau de certeza

Alto para a causa imediata do erro: o contrato de 21 colunas é estrito e o runtime recebeu 26 cabeçalhos. Alto para concluir que falta de acesso não é a causa e que o cabeçalho do backup é compatível. Médio-alto para identificar DEV como origem efetiva, pois a sequência lida coincide exatamente com `DEV!atas!A:Z`, mas o `GOOGLE_SHEETS_ID` de produção não foi consultado.

## Pontos ainda não comprovados

- Se o `GOOGLE_SHEETS_ID` configurado em produção é exatamente `1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU`; a variável não foi lida.
- Se há outra planilha acessível à conta com a mesma sequência de cabeçalhos em `atas!A:Z`.
- Qual mudança ou processo acrescentou os cinco campos V2 à fonte de dados que a produção está lendo.
