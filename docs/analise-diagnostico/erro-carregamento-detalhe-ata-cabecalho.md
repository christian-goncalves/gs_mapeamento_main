# Diagnóstico: erro ao carregar detalhe da ata por cabeçalho inválido

## Objeto da investigação

Falha repetida ao confirmar uma ata e abrir sua página de detalhe em `/atas/[ataId]`.

## Contexto

O usuário recebeu a mensagem de interface “Não foi possível gravar a ata. Nenhuma confirmação foi registrada.” e, em seguida, enviou o log do servidor local. O log mostra erro HTTP 500 durante `GET /atas/3a84024d-cab0-42c9-8f4e-1cd3091adf91`, ao carregar os dados da ata no Google Sheets.

## Evidências examinadas

- Log local do Next.js fornecido pelo usuário em 2026-10-17: `rowsToObjects` lançou `Cabeçalho inválido`; `readContractSheets` propagou o erro; `AtaDetailPage` falhou no GET do detalhe.
- `src/lib/sheets/rows.ts:9-39`: o conversor compara o cabeçalho lido com o contrato e lança erro quando encontra posições vazias ou extensão incompatível.
- `src/lib/sheets/contract-v2.ts:4-20,63-75`: define os campos de extensão V2 aceitos para a aba `atas` e encaminha-os ao conversor.
- `src/lib/sheets/repository.ts:130-159,300-355`: lê as abas em lote e converte os registros antes de agregá-los.
- `src/app/atas/[ataId]/page.tsx:24-30`: a página carrega a agregação antes de localizar a ata e verificar acesso.
- Leitura de conferência da planilha de backup configurada localmente: a aba `atas` tinha 32 colunas; após os 21 campos-base havia sete células de cabeçalho vazias, seguidas por quatro cabeçalhos de extensão reconhecidos. A linha 114 já continha a ata `3a84024d-cab0-42c9-8f4e-1cd3091adf91`, com status `ativa` e `aprovada`.
- Alteração externa registrada durante a investigação: foram preenchidas apenas as células `atas!V1:AB1` com os sete nomes de extensão esperados. A resposta da API confirmou sete células atualizadas; a releitura confirmou o cabeçalho completo.
- Validação pelo leitor real do repositório, usando `.env.local` e uma leitura somente: 113 atas e 3 grupos agregados; a ata investigada e seu grupo foram encontrados.
- Aba já autenticada do Chrome em `http://localhost:3000/atas/3a84024d-cab0-42c9-8f4e-1cd3091adf91`: antes da recarga, mostrava o overlay de erro e o cabeçalho antigo; após a recarga, carregou “Ata de reunião nº 113 - USL”, seus dados e as seções relacionadas.
- Tentativa sem sessão autenticada via `curl` ao servidor local: resposta 307 para `/login`; esse método não verificou o HTML da página protegida.

## Estado observado

- A ata foi persistida na linha 114 da aba `atas` antes de ocorrer o erro do GET.
- O cabeçalho da aba tinha lacunas entre campos-base e campos de extensão, incompatíveis com `rowsToCompatibleObjects`.
- Depois do preenchimento controlado das células vazias, o leitor do próprio projeto consegue converter a aba e localizar a ata e o grupo.
- Depois de recarregar a aba autenticada, a página de detalhe abriu e exibiu os dados da ata.
- A leitura agregada ainda relata 1303 diagnósticos em registros relacionados: 1030 referências de `participacao` para `ata_id` não reconhecidas, 128 em `servidores`, 91 em `visitantes`, 36 em `trocas_chaveiro`, 17 em `ingressos` e 1 `grupo_id` em `grupo_servidores_mesa`. O item da ata investigada foi localizado apesar desses diagnósticos.

## Análise

A mensagem da interface sugere falha de gravação, mas o log fornecido é de uma requisição GET da página de detalhe, não do comando de escrita. A existência da linha 114 com o mesmo ID demonstra que a gravação ocorreu. O 500 aconteceu depois, quando a página carregou a agregação de planilhas e encontrou o cabeçalho inválido de `atas`.

As sete células vazias estavam no meio dos campos adicionais que a compatibilidade V2 espera em sequência. Isso explica por que a leitura falhava apesar de os campos-base estarem presentes. Com o cabeçalho recomposto, a mesma rotina de leitura do repositório converteu a aba e encontrou a ata e o grupo.

Os diagnósticos restantes referem-se a referências de registros em outras abas. Eles não impediram a agregação de localizar a ata investigada nesta validação; não foi estabelecido que estejam relacionados ao 500 observado.

## Diagnóstico

O erro exibido como falha ao gravar foi causado, neste caso, por um cabeçalho inconsistente na aba `atas` do Google Sheets. A gravação da ata ocorreu; a falha veio depois, ao carregar a página de detalhe. O cabeçalho foi recomposto nas sete células vazias e a leitura de verificação do repositório passou a localizar a ata e seu grupo.

## Grau de certeza

Alto para a causa e a resolução do 500 registrado: a exceção identifica o cabeçalho inválido, a leitura direta confirmou as células vazias, e após corrigir o cabeçalho tanto o leitor do repositório quanto a página autenticada localizaram e exibiram a ata.

## Pontos ainda não comprovados

- Os 1303 diagnósticos de referências em outras abas não foram investigados individualmente e não há evidência de que expliquem a falha desta ata.
