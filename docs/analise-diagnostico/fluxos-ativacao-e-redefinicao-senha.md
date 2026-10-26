# Investigação dos fluxos de ativação e redefinição de senha

## Objeto da investigação

Identificar, além da página de login, onde ficam as telas que permitem criar a senha após o cadastramento de um grupo e redefinir a senha por link enviado por e-mail.

## Contexto

Foram examinados o código atual do checkout `/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento` e as duas telas apresentadas pelo usuário: `/login` e `/esqueci-senha`.

## Evidências examinadas

- `src/app/login/page.tsx:49-80`: tela de login e link para `/esqueci-senha`.
- `src/app/esqueci-senha/page.tsx:4-14`: tela que solicita o e-mail para redefinição.
- `src/app/esqueci-senha/actions.ts:11-28`: criação do token e envio do e-mail de redefinição.
- `src/app/redefinir-senha/[token]/page.tsx:7-31`: tela de destino do link de redefinição.
- `src/app/redefinir-senha/[token]/reset-password-form.tsx:6-24` e `src/app/redefinir-senha/actions.ts:22-41`: formulário e gravação da nova senha.
- `src/app/ativar-acesso/[token]/page.tsx:9-41`: tela de destino do convite de primeiro acesso.
- `src/app/ativar-acesso/[token]/activation-form.tsx:6-24` e `src/app/ativar-acesso/actions.ts:22-39`: formulário e gravação da senha inicial.
- `src/app/grupos/actions.ts:54-58,284-328`: retorno do cadastro e envio do convite após salvar o grupo.
- `src/app/admin/grupos/novo/page.tsx:24-49` e `src/app/admin/grupos/[grupoId]/page.tsx:21-59`: carregamento do convite pendente e montagem do link na área administrativa.
- `src/app/grupos/group-editor.tsx:1065-1093`: campo visual “Link de ativação do acesso do grupo”, cópia e rotação do convite.
- `src/lib/email/activation-email.ts:16-53`: geração de `/ativar-acesso/{token}` e conteúdo do e-mail de criação de senha.
- `src/lib/email/password-reset-email.ts:16-45`: geração de `/redefinir-senha/{token}` e conteúdo do e-mail de redefinição.
- `src/lib/sheets/group-users.ts:134-189,210-246`: estados pendente/ativo, validade dos tokens e consumo dos links.
- Prints fornecidos pelo usuário: `/login` mostra o link “Esqueci minha senha”; `/esqueci-senha` mostra o formulário “Redefinir senha”.

## Estado observado

### 1. Após o cadastramento do grupo: criação da senha inicial

- A tela administrativa de criação é `/admin/grupos/novo`. A rota legada `/grupos/novo` apenas redireciona para ela (`src/app/grupos/novo/page.tsx:6-8`).
- Depois que um administrador salva um grupo com `email_acesso_grupo`, o sistema sincroniza o usuário do grupo (`src/app/grupos/actions.ts:301-304`). Para um usuário novo, ele fica `pendente`, recebe `convite_token` e validade de 14 dias (`src/lib/sheets/group-users.ts:134-165`).
- Quando o convite é novo, a ação chama `sendActivationEmail` (`src/app/grupos/actions.ts:304-307`). O e-mail contém o link `/ativar-acesso/{token}` e o texto “Use o link abaixo para criar sua senha” (`src/lib/email/activation-email.ts:16-52`).
- A própria área administrativa mostra o link em `/admin/grupos/novo?grupoId={id}` após o cadastro, ou em `/admin/grupos/{grupoId}` ao editar o grupo (`src/app/admin/grupos/novo/page.tsx:28-44`, `src/app/admin/grupos/[grupoId]/page.tsx:36-55`).
- O componente apresenta o rótulo “Link de ativação do acesso do grupo”, permite copiar o link e permite rotacionar o convite (`src/app/grupos/group-editor.tsx:1067-1092`).
- A pessoa acessa `/ativar-acesso/{token}`. Essa tela apresenta “Ativar acesso”, o grupo, o e-mail e os campos “Nova senha” e “Confirmar senha” (`src/app/ativar-acesso/[token]/page.tsx:33-40`, `src/app/ativar-acesso/[token]/activation-form.tsx:10-23`).

### 2. Redefinição de senha

- A entrada do fluxo é `/esqueci-senha`, acessível pelo link “Esqueci minha senha” da tela `/login` (`src/app/login/page.tsx:78-80`).
- Nessa tela, a pessoa informa o e-mail e aciona “Enviar link” (`src/app/esqueci-senha/page.tsx:6-13`, `src/app/esqueci-senha/password-reset-request-form.tsx:12-22`).
- Para um usuário ativo, o sistema cria um novo token com validade de 1 dia e envia o e-mail de redefinição (`src/app/esqueci-senha/actions.ts:22-27`, `src/lib/sheets/group-users.ts:210-223`).
- O link enviado aponta para `/redefinir-senha/{token}` (`src/lib/email/password-reset-email.ts:16-44`).
- A tela de destino é `/redefinir-senha/{token}`. Com token válido, ela mostra “Nova senha”, o e-mail e os campos de nova senha; com token inválido ou expirado, mostra “Link inválido ou expirado” e oferece pedir novo link (`src/app/redefinir-senha/[token]/page.tsx:15-30`).

## Análise

Os dois fluxos têm telas de destino diferentes e usam tokens dinâmicos:

| Situação | Tela que gera ou expõe o link | Tela acessada pelo destinatário | Validade observada |
| --- | --- | --- | --- |
| Primeiro acesso após cadastro do grupo | `/admin/grupos/novo?grupoId={id}` ou `/admin/grupos/{grupoId}`, além do e-mail de ativação | `/ativar-acesso/{token}` | 14 dias |
| Redefinição de senha | `/esqueci-senha`, após informar o e-mail | `/redefinir-senha/{token}` | 1 dia |

O token de ativação cria a senha inicial e, depois do uso, é apagado. O token de redefinição é criado para usuário já ativo e também é apagado quando a nova senha é salva (`src/lib/sheets/group-users.ts:180-189,238-246`).

## Diagnóstico

As páginas procuradas existem no sistema:

- Para criar a senha após o cadastro do grupo: **`/ativar-acesso/{token}`**. O link é enviado por e-mail e também fica copiável na tela administrativa do grupo.
- Para redefinir uma senha existente: **`/esqueci-senha`** é a tela de solicitação e **`/redefinir-senha/{token}`** é a tela que recebe o link e permite cadastrar a nova senha.

## Grau de certeza

Alto. As rotas, os componentes, as ações server-side, a geração dos links e os pontos de exibição estão presentes e correlacionados no código atual.

## Pontos ainda não comprovados

- Esta verificação não enviou e-mail, não alterou Google Sheets e não executou um cadastro ou redefinição reais.
- A entrega efetiva do e-mail depende das variáveis `APP_URL`, `RESEND_API_KEY` e `EMAIL_FROM` no ambiente em execução; o código apenas demonstra que o envio é tentado quando o convite atende às condições descritas.
