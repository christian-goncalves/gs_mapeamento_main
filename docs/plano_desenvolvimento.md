# Plano de desenvolvimento do GS Mapeamento

## Objetivo do MVP

Entregar uma aplicação web própria para usuários autorizados criarem, listarem,
visualizarem e editarem atas. O Google Sheets será a fonte oficial dos dados e
continuará disponível para manutenção manual controlada.

## Escopo funcional

### Incluído

- login Google por Auth.js
- autorização por lista de e-mails
- cadastro e seleção de grupos
- criação de atas
- listagem e visualização de atas
- edição de atas e registros relacionados
- informações gerais, servidores, participação, visitantes e trocas de chaveiro
- indicadores derivados do contrato de Participação
- validação de dados lidos ou escritos no Sheets

### Não incluído

- exclusão pela aplicação
- formulário público
- Jotform ou automações de terceiros
- banco de dados local ou relacional
- finanças, ingressos, partilhas, anexos e informações extras

## Arquitetura prevista

- Next.js App Router na Vercel.
- Server Components para páginas e consultas autenticadas.
- Server Actions para criação e edição.
- Auth.js com Google OAuth e `AUTH_ALLOWED_EMAILS` no ambiente do servidor.
- Camada de domínio para schemas, regras e cálculos.
- Adaptador da Google Sheets API inicializado apenas no servidor e sob demanda.
- Uma pasta de trabalho com as seis abas definidas no contrato de dados.

O acesso não será protegido apenas pelo `proxy` do Next.js. Cada Server
Component e Server Action deverá validar sessão e e-mail autorizado antes de
consultar ou alterar dados.

## Etapas

### 1. Contrato e modelo

- Harmonizar a documentação.
- Validar o DBML no dbdiagram.io.
- Aprovar visualmente o diagrama.

Critério de aceite: os documentos e o diagrama descrevem as mesmas seis
entidades, campos e relações.

### 2. Google Sheets

- Criar a pasta de trabalho e as seis abas.
- Aplicar os cabeçalhos na ordem do contrato.
- Configurar listas, booleanos, inteiros, datas e campos obrigatórios.
- Compartilhar a planilha somente com a conta de serviço do backend e com os
  administradores responsáveis.

Critério de aceite: um conjunto de dados válido pode ser preenchido manualmente
sem listas dentro de células e um valor inválido é sinalizado pela planilha.

### 3. Fundação da aplicação

- Inicializar Next.js App Router com TypeScript.
- Configurar Auth.js, Google OAuth e lista de e-mails.
- Configurar variáveis da Vercel para autenticação e Google Sheets.
- Implementar adaptador server-only e schemas do domínio.

Critério de aceite: usuário permitido acessa a aplicação; usuário não permitido
é bloqueado; nenhum segredo chega ao navegador.

### 4. Fluxo de atas

- Implementar criação atômica lógica de ata e registros relacionados.
- Implementar listagem, detalhe e edição.
- Calcular indicadores em leitura, sem persistir totais derivados.
- Exibir erros encontrados em linhas editadas manualmente.

Critério de aceite: criar, consultar e corrigir uma ata funciona de ponta a
ponta e a soma de presenças acima do total é rejeitada.

### 5. Validação e implantação

- Testar regras do domínio e adaptação das linhas do Sheets.
- Testar autenticação e autorização em todas as leituras e mutações.
- Testar falha parcial de escrita sem sucesso falso.
- Implantar na Vercel e executar o fluxo completo em produção.

Critério de aceite: o MVP funciona com a planilha real, somente para usuários
autorizados, sem dependência de arquivos locais de credenciais.

## Variáveis previstas

- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_ALLOWED_EMAILS`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

Os nomes podem ser ajustados apenas se a versão adotada do Auth.js exigir outra
convenção, mantendo a mesma separação entre configuração pública e segredos.

## Segurança antes do desenvolvimento

Os JSONs de credenciais atualmente presentes no diretório não devem ser usados
como artefatos versionáveis. Antes de iniciar a aplicação:

1. Rotacionar ou revogar as chaves atuais no Google Cloud.
2. Remover os JSONs do diretório do projeto.
3. Criar `.gitignore` para `.env*` e arquivos de credenciais.
4. Configurar novos segredos localmente e na Vercel.
5. Compartilhar apenas a planilha do MVP com a nova conta de serviço.
