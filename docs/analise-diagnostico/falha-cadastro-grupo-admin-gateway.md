# Diagnóstico da falha ao cadastrar grupo no Admin

## Objeto da investigação

Investigar a tela de erro exibida ao salvar um novo grupo em `/admin/grupos/novo` no ambiente local `http://localhost:3000`.

## Contexto

O usuário relatou que recebe o erro ao tentar cadastrar um grupo. O worktree já continha alterações locais extensas antes desta investigação; elas foram preservadas. A análise foi somente leitura, sem envio do formulário, gravação no Sheets ou alteração do código/configuração.

## Evidências examinadas

- Captura de tela enviada pelo usuário: página `/admin/grupos/novo` mostra “Não foi possível carregar os grupos” e botão “Tentar novamente”.
- Estado do overlay de erro do Next.js na mesma aba Chrome: `Runtime Error Server`, mensagem `Grupo inativo ou inexistente.`; stack aponta `executeGatewayOperation` → `commitGroupRows` → `saveGrupo` → `saveGrupoAction`.
- `src/app/admin/grupos/novo/page.tsx:6-8`: a rota exige sessão administrativa e renderiza o formulário de grupo novo.
- `src/app/grupos/group-editor.tsx:37-53`: o grupo inicial tem ID vazio e está ativo.
- `src/app/grupos/actions.ts:155-173, 260-263`: sem ID prévio, a ação cria um UUID, exige sessão administrativa e chama `saveGrupo` como operação autenticada.
- `src/lib/sheets/group-admin.ts:207-242`: `saveGrupo` envia a operação `salvar_grupo` ao gateway.
- `apps-script/gateway/Code.js:193-203, 423-459`: para `salvar_grupo`, o gateway permite criação sem grupo preexistente quando reconhece o e-mail como administrador em `GATEWAY_ADMIN_EMAILS`; caso contrário, tenta validar que o novo ID já corresponde a grupo ativo e lança exatamente `Grupo inativo ou inexistente.`.
- `src/lib/sheets/gateway-client.ts:140-144`: a aplicação propaga ao Next.js a mensagem de recusa recebida do gateway.
- `src/app/admin/grupos/error.tsx` e `src/app/grupos/error.tsx:3-20`: o error boundary substitui a exceção original por uma mensagem genérica sobre não carregar grupos.

## Estado observado

- A rota de criação abriu e chegou à tentativa de salvar; o erro não é uma validação inline do formulário.
- O overlay técnico informa que o gateway recusou uma operação de gravação com a mensagem de grupo inativo ou inexistente.
- O novo grupo ainda não tinha ID cadastrado antes da ação; o ID é gerado durante o envio.
- A tela amigável esconde a causa técnica e apresenta uma mensagem genérica de carregamento.

## Análise

O fluxo local identifica a criação como `salvar_grupo`, envia autorização autenticada e usa um ID novo. No código do gateway disponível neste checkout, essa operação pode criar um grupo ausente somente quando o e-mail do ator consta em `GATEWAY_ADMIN_EMAILS`. Se o e-mail não estiver nessa lista, o gateway percorre a validação de grupo já existente/ativo; como o UUID acabou de ser gerado, a validação produz a mensagem vista no overlay.

Isso é compatível com a sessão administrativa aceita pela aplicação: o papel administrativo do backend e a lista administrativa mantida nas propriedades do gateway são controles separados. Também permanece compatível com o erro uma versão implantada do gateway que não contenha a regra de criação existente no código local.

## Hipóteses avaliadas

- **Sustentada — o gateway não autorizou a criação para esse ator e exigiu um grupo ativo preexistente.** A mensagem retornada e a condição no código local coincidem; o ID de grupo é novo.
- **Provável, ainda não confirmada — o e-mail autenticado não consta ou não coincide com a lista `GATEWAY_ADMIN_EMAILS` do gateway usado pela aplicação.** A lógica local leva exatamente ao erro observado nesse caso, mas o valor da propriedade e o e-mail do ator não foram examinados.
- **Também possível — o endpoint configurado está servindo uma versão antiga ou divergente do gateway.** Não foram consultados metadados do deployment nesta investigação.
- **Enfraquecida — falha de leitura/conexão simples com o Sheets.** O overlay contém uma mensagem específica de autorização/regra do gateway e aponta a pilha da mutação, não uma falha de carregamento inicial.

## Diagnóstico

A tentativa de cadastro foi recusada na validação do gateway. O gateway tratou a operação como se o ator não pudesse criar um grupo novo e exigiu um grupo já ativo; o grupo ainda não existe porque está sendo cadastrado. A explicação mais provável é divergência entre a identidade administrativa reconhecida pela aplicação e a lista `GATEWAY_ADMIN_EMAILS`, mas a lista efetiva e a versão implantada não foram verificadas.

## Grau de certeza

**Alto** para a recusa ocorrer na validação do gateway durante `salvar_grupo` e para a validação exigir um grupo ativo preexistente no caminho observado. **Médio** para a causa específica ser e-mail ausente/divergente em `GATEWAY_ADMIN_EMAILS`, pois as propriedades do deployment ativo não foram lidas.

## Pontos ainda não comprovados

- Qual e-mail a sessão autenticada enviou como ator.
- Se esse e-mail está cadastrado em `GATEWAY_ADMIN_EMAILS` no projeto Apps Script chamado pelo ambiente local.
- Se o código implantado nesse endpoint corresponde ao `apps-script/gateway/Code.js` deste checkout.
- Se alguma mutação parcial ocorreu antes do erro; não foi feita leitura de reconciliação do Sheets nesta investigação.
