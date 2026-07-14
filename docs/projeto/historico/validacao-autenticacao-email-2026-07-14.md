# Validacao de Autenticacao por Email

## Objetivo

Consolidar as rodadas de testes manuais ja realizadas no fluxo de autenticacao
por e-mail do GS Mapeamento, incluindo convite de acesso, redefinicao de senha,
login posterior, login com Google e diagnosticos levantados a partir dos logs e
da planilha.

Esta documentacao registra o que foi observado ate 2026-07-14. A rodada anterior
foi concluida integralmente ate o Teste 14. O proximo passo nao e retomar testes
pendentes dessa rodada, mas iniciar uma nova execucao completa depois da
exclusao dos grupos de teste.

## Escopo validado

- Criacao e edicao de grupo com responsavel.
- Envio de link de ativacao por e-mail.
- Abertura do link de ativacao.
- Criacao e redefinicao de senha.
- Tentativa de login com e-mail e senha apos troca de senha.
- Login com Google para administrador.
- Login com Google para responsavel cadastrado.
- Bloqueio de Google sem acesso cadastrado.
- Reuso de link de ativacao.
- Validacao forte de senha no servidor.

## Fontes e evidencias

- Testes manuais reportados durante a validacao local em `localhost:3000`.
- Logs recentes de desenvolvimento em `.next/dev/logs/next-development.log`.
- Leituras read-only e mascaradas das abas `usuarios_grupo` e `grupos`.
- Mensagens exibidas pela UI durante os testes.
- Correcoes aplicadas nos arquivos de autenticacao, ativacao e schemas do
  Google Sheets.
- Validacoes automatizadas executadas com `npm run lint`, testes unitarios
  focados e requisicao HTTP local para a rota de ativacao.

## Rodada 1 - Redefinicao de senha com login recusado

### Contexto

O teste comecou com um usuario solicitando redefinicao de senha. O e-mail de
redefinicao foi recebido normalmente, o link abriu, a nova senha foi cadastrada
e o sistema confirmou sucesso. Ao voltar para a tela de login e informar o
mesmo e-mail com a nova senha, o acesso foi recusado.

Tambem foi testado login com Google usando um e-mail diferente do administrador.
O login nao foi concluido e a tela retornou erro de acesso negado.

### Fluxo executado

1. Solicitar redefinicao de senha.
2. Receber o link por e-mail.
3. Acessar o link.
4. Definir nova senha.
5. Receber confirmacao de senha alterada.
6. Tentar login com o mesmo e-mail e a nova senha.
7. Tentar login com Google usando e-mail nao administrador.

### Resultado observado

- O envio do e-mail funcionou.
- A tela de redefinicao funcionou.
- A senha foi aceita e gravada.
- O login por e-mail e senha retornou acesso negado.
- O login Google com e-mail sem acesso tambem retornou acesso negado.

### Evidencias

- Os logs registraram `AccessDenied` no caminho de credenciais, passando por
  `signInWithPasswordAction`.
- Os logs tambem registraram `AccessDenied` no callback OAuth do Google.
- A leitura da aba `usuarios_grupo` mostrou usuario ativo com hash presente.
- O hash gravado tinha formato esperado para `scrypt`.
- O campo `ultimo_login` foi atualizado durante a tentativa de login.
- O usuario apontava para um `grupo_id` que nao existia mais entre os grupos
  ativos.
- A leitura da aba `grupos` mostrou somente o grupo ativo atual, sem o grupo
  vinculado ao usuario testado.

### Diagnostico

O problema nao era hash nem persistencia da nova senha. A atualizacao de
`ultimo_login` indicou que a senha informada foi validada com sucesso.

O acesso foi negado depois da validacao da senha porque a autorizacao exige que
o responsavel esteja ativo e vinculado a um grupo ativo. O usuario testado
estava vinculado a um grupo removido durante a limpeza manual dos dados.

O comportamento do Google seguiu a mesma regra: o e-mail administrador entra se
estiver em `AUTH_ALLOWED_EMAILS`; outros e-mails so entram se forem responsaveis
ativos de grupo ativo.

### Decisao registrada

A limpeza manual dos grupos fez parte da preparacao para testes limpos. Os
grupos removidos foram movidos para a aba `Pagina 7`, mantida como referencia
dos grupos arquivados. Esse contexto explica a existencia de responsaveis
orfanos durante a rodada.

## Rodada 2 - Convite, ativacao e testes com grupos novos

### Contexto

A segunda rodada partiu da administracao de grupos. O objetivo era testar o
fluxo limpo de criacao de grupo, envio de convite, ativacao do responsavel,
politica de senha e reuso do link.

Foram usados grupos de teste criados manualmente pela UI de administracao.

### Fluxo executado

1. Editar o grupo existente `Bom dia Brasil`.
2. Salvar dados do responsavel.
3. Receber e-mail de ativacao.
4. Abrir o link de ativacao.
5. Criar grupos de teste A e B.
6. Validar criacao com mesmo Zoom ID.
7. Testar politicas de senha no link de ativacao.
8. Testar reuso de link de ativacao.
9. Prosseguir com a sequencia manual definida ate o Teste 14.

### Resultado observado

- Ao salvar o grupo `Bom dia Brasil`, o sistema enviou o e-mail de ativacao,
  mas a tela navegou para uma URL de grupo que retornou 404.
- O primeiro link copiado do e-mail estava incompleto: faltava o primeiro
  caractere do token.
- Mesmo com o token completo, a pagina de ativacao ainda retornou 404.
- A criacao dos grupos de teste A e B funcionou.
- O mesmo Zoom ID foi permitido para grupos diferentes, conforme regra de
  produto.
- A senha `11111111` foi aceita inicialmente, o que era incorreto.
- O reuso do link de ativacao retornava uma pagina 404 seca.
- A sequencia definida para a rodada foi executada integralmente ate o Teste 14.

### Evidencias

- O e-mail recebido continha o assunto de ativacao do acesso ao GS Mapeamento e
  link para `/ativar-acesso/{token}`.
- A aba de usuarios continha token pendente para o responsavel, sem hash de
  senha gravado antes da ativacao.
- A leitura do Sheets retornou `zoom_id` numerico para o grupo.
- O schema do grupo esperava `zoom_id` como texto, invalidando o grupo durante a
  leitura agregada.
- A pagina de ativacao localizou o token, mas nao encontrou o grupo valido na
  lista agregada e retornou 404.

### Diagnostico

O 404 com token completo nao era problema do token. O grupo era descartado pela
validacao porque o Google Sheets retornava o Zoom ID como numero em vez de
texto. Como a pagina de ativacao dependia da leitura agregada dos grupos, o
grupo ficava invisivel para a rota e a pagina caia em `notFound()`.

O aceite da senha `11111111` indicou que a validacao real estava fraca no
servidor. O atributo `minLength={8}` no HTML ajudava visualmente, mas nao
garantia a politica exigida.

O 404 no reuso do link nao era falha de seguranca, mas era uma experiencia ruim:
um token ja utilizado ou invalido nao tinha pagina explicativa.

### Correcoes aplicadas

- `src/lib/sheets/schemas.ts`
  - O schema de `zoom_id` passou a aceitar valor numerico do Sheets e converter
    para texto.
- `src/lib/sheets/schemas.test.ts`
  - Adicionado teste cobrindo Zoom ID numerico retornado pelo Sheets.
- `src/lib/auth/password-policy.ts`
  - Criada politica compartilhada de senha.
  - Regra obrigatoria: minimo de 8 caracteres, uma letra maiuscula, uma letra
    minuscula e um numero.
- `src/app/ativar-acesso/actions.ts`
  - A ativacao passou a usar a politica forte no servidor.
- `src/app/redefinir-senha/actions.ts`
  - A redefinicao de senha passou a usar a mesma politica forte.
- `src/lib/auth/password-policy.test.ts`
  - Adicionados testes unitarios para senhas invalidas e senha valida.
- `src/app/ativar-acesso/[token]/page.tsx`
  - Token invalido, expirado ou ja utilizado passou a exibir mensagem amigavel
    em vez de 404 seco.

### Validacoes automatizadas executadas

- `npm run lint`: aprovado apos as correcoes.
- `npx vitest run src/lib/sheets/schemas.test.ts`: aprovado no teste focado do
  Zoom ID numerico.
- `npx vitest run src/lib/auth/password-policy.test.ts`: aprovado com 7 testes.
- `curl -I http://localhost:3000/ativar-acesso/token-ja-usado-ou-invalido`:
  retornou `200 OK` apos a mensagem amigavel para token invalido ou ja usado.

## Resultado consolidado da rodada concluida

A rodada anterior esta encerrada. Os testes definidos para essa execucao foram
realizados ate o Teste 14, incluindo os cenarios de criacao de grupo, ativacao,
login por e-mail e senha, login com Google, validacao de senha, troca de e-mail,
reuso de link e tratamento de erros.

Durante essa rodada, os problemas encontrados foram tratados ou registrados com
diagnostico:

- o login recusado apos redefinicao foi explicado por responsavel vinculado a
  grupo removido;
- o 404 da ativacao com token valido foi corrigido no schema de `zoom_id`;
- a senha fraca `11111111` deixou de ser aceita depois da politica forte de
  senha;
- o reuso de link deixou de retornar uma pagina 404 seca;
- Zoom ID repetido entre grupos foi mantido como comportamento permitido;
- mensagens de erro e sucesso da administracao de grupos passaram a ser ponto
  de atencao da validacao manual.

## Comportamentos confirmados

- Login Google com administrador funciona quando o e-mail esta em
  `AUTH_ALLOWED_EMAILS`.
- Login Google com responsavel cadastrado funciona e entra no proprio grupo.
- Login Google com e-mail nao cadastrado deve ser negado.
- Login por e-mail e senha depende de senha correta, usuario ativo e grupo
  ativo.
- Alterar e-mail de login de um responsavel remove o acesso anterior e exige
  nova ativacao para o novo e-mail.
- Zoom ID pode ser repetido entre grupos.
- Links de ativacao ja utilizados nao devem criar nova senha novamente.

## Estado atual

O fluxo de autenticacao por e-mail esta mais consistente que no inicio dos
testes:

- senha forte e validada no servidor;
- ativacao e redefinicao usam a mesma regra;
- Zoom ID numerico do Sheets nao invalida mais o grupo;
- token invalido, expirado ou usado nao exibe mais 404 seco;
- os erros de login por senha observados na primeira rodada foram explicados
  por usuario vinculado a grupo removido, nao por falha de hash.

## Nova rodada de validacao planejada

Nao ha pendencias abertas da rodada anterior. A proxima validacao sera uma nova
execucao completa da sequencia, do inicio ate o Teste 14.

Preparacao definida para a nova rodada:

1. Excluir o `Grupo Teste A`.
2. Excluir o `Grupo Teste B`.
3. Executar novamente todos os testes, do Teste 1 ao Teste 14.

Objetivo da nova rodada:

- validar o fluxo completo em base limpa;
- confirmar que as correcoes aplicadas continuam funcionando de ponta a ponta;
- verificar se as mensagens exibidas ao usuario estao claras;
- confirmar novamente login por e-mail e senha com responsavel de grupo ativo;
- confirmar novamente ativacao, redefinicao, Google admin, Google responsavel e
  bloqueio de Google nao cadastrado.

## Nova rodada de validacao - concluida

Estado informado apos a nova execucao:

- A sequencia completa foi executada novamente, do Teste 1 ao Teste 14.
- Todos os testes passaram pela segunda vez.
- O unico ponto identificado durante a rodada foi o envio de convite
  desnecessario no Teste 4.

Diagnostico do Teste 4:

- a sincronizacao do responsavel recriava token de convite para usuario ainda
  pendente com o mesmo e-mail;
- a Server Action enviava e-mail sempre que a sincronizacao retornava usuario
  `pendente`;
- ao salvar um grupo sem troca real de e-mail, o convite podia ser reenviado sem
  necessidade.

Correcao aplicada:

- `src/lib/sheets/group-users.ts` passou a preservar token e expiracao quando o
  responsavel ja esta pendente com o mesmo e-mail;
- `syncResponsibleGroupUser` passou a retornar `inviteCreated`, diferenciando
  convite novo de convite pendente ja existente;
- `src/app/grupos/actions.ts` passou a enviar e-mail somente quando o usuario
  esta pendente e `inviteCreated` e verdadeiro;
- `src/app/grupos/actions.test.ts` passou a cobrir o caso em que salvar o grupo
  com responsavel pendente e mesmo e-mail nao reenvia convite.

Validacao automatizada da correcao:

- `npx vitest run src/app/grupos/actions.test.ts`: 4 testes aprovados.
- `npm run lint`: aprovado.
