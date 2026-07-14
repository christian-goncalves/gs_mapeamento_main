# Arquitetura de dados

## Objetivo

Definir como o domínio do MVP é validado, persistido e reconstruído. O Google
Sheets é a fonte oficial e não existe banco de dados local.

O [modelo DBML](modelo-de-dados.dbml) representa visualmente as oito abas, sem
indicar adoção de banco relacional.

## Componentes

- Next.js App Router na Vercel.
- Server Components para leituras autenticadas.
- Server Actions para criação.
- Camada de domínio independente para schemas, regras e indicadores.
- Adaptador server-only para a Google Sheets API.
- Auth.js com Google e lista de e-mails autorizados.

Cada leitura e mutação valida novamente a sessão e o e-mail permitido.

## Persistência

Uma pasta de trabalho contém oito abas:

| Aba | Responsabilidade |
| --- | --- |
| `grupos` | Cadastro controlado dos grupos |
| `grupo_horarios` | Horários recorrentes vinculados por `grupo_id` |
| `atas` | Dados escalares de cada reunião |
| `servidores` | Servidores vinculados por `ata_id` |
| `participacao` | Presenças por localidade vinculadas por `ata_id` |
| `visitantes` | Visitantes vinculados por `ata_id` |
| `ingressos` | Ingressos vinculados por `ata_id` |
| `trocas_chaveiro` | Trocas de ficha vinculadas por `ata_id` |

`grupo_id` é o identificador interno dos grupos. `zoom_id` é um atributo externo
repetível e nunca é usado como chave de relacionamento.

`grupos.link_formulario_ata` é o identificador do link simplificado de
preenchimento da ata. Esse link é gerado pela aplicação a partir do nome do
grupo, é único entre grupos e não cria uma estrutura paralela de convites,
tokens, expiração ou auditoria de acesso.

`atas.preenchido_por` registra o nome informado pela pessoa que preencheu a ata.
Esse campo substitui a necessidade de cadastro separado de responsáveis pela
ata.

Os campos e valores aceitos estão nos contratos de
[Informações Gerais](../produto/contratos/informacoes-gerais.md) e
[Participação](../produto/contratos/participacao.md).

## Reconciliação estrutural

A rotina `npm run sheets:reconcile-contract` reconcilia a estrutura declarada do
contrato com a planilha alvo: valida abas existentes, cria abas ausentes e
adiciona colunas faltantes sem gravar registros de negócio.

Essa rotina é diferente de `npm run sheets:reconcile-protections`, que atua
somente sobre intervalos protegidos e política de edição manual. Mudanças de
contrato devem passar pela reconciliação estrutural antes de validações
funcionais em DEV e, depois, em PROD.

## Normalização e auditoria

- Uma célula contém um único valor.
- Uma linha representa um único registro.
- Dados repetíveis ocupam linhas próprias.
- Entidades de reunião usam `ata_id`; horários usam `grupo_id`.
- IDs são UUIDs gerados pelo backend.
- `created_at` e `updated_at` usam ISO 8601.
- A coluna `grupos.ordem` é mantida por compatibilidade visual na planilha; a
  aplicação ordena grupos alfabeticamente por `grupo_nome`.
- Totais derivados nunca são persistidos; `total_partilhas` é fato informado e
  fica na aba `atas`.

## Leitura

O adaptador confere os cabeçalhos, converte as linhas e preserva a localização
original de cada registro. A leitura agregada:

1. valida individualmente as oito abas;
2. resolve referências por `grupo_id` e `ata_id`;
3. separa registros válidos e inválidos;
4. calcula indicadores apenas com dados válidos;
5. informa aba, linha, campo e mensagem para correção manual.

Grupos inativos não aparecem em novos formulários, mas continuam identificáveis
em atas históricas.

## Acesso

Administradores são os e-mails em `AUTH_ALLOWED_EMAILS`. Responsáveis de grupo
são reconhecidos pelo campo `email_acesso_grupo` da aba `grupos`. O link
`/preencher/{link_formulario_ata}` permite abrir somente o formulário do grupo
correspondente, sem login Google e sem acesso a painel administrativo.

## Criação atômica

O rascunho não é persistido. Após a confirmação do resumo, o backend:

1. revalida autorização, link público ou dados;
2. confirma que o grupo existe e está ativo;
3. consulta a chave `grupo_id + data_reuniao + hora_inicio`;
4. gera UUIDs e timestamps;
5. grava ata e dependentes em um único `spreadsheets.batchUpdate`;
6. retorna sucesso somente após a confirmação da API.

As suboperações do lote devem ser atômicas: uma falha impede todas as escritas.
Atas persistidas são somente leitura na aplicação.

O Sheets não oferece restrição única condicional. A consulta da chave de negócio
e o bloqueio de reenvio na interface reduzem o risco de duplicidade, mas duas
requisições realmente simultâneas ainda podem competir. Um bloqueio distribuído
externo não faz parte do MVP.

## Valores controlados

- O domínio usa códigos internos para enums.
- O Sheets mantém rótulos em português quando o enum possui rótulo externo; os
  códigos de `tempo_limpo` são persistidos como `1M`, `2M`, `3M`, `6M`, `9M`,
  `12M`, `18M` e `MULTIPLOS_ANOS`.
- O adaptador converte nos dois sentidos e rejeita valores desconhecidos.
- `plataforma` aceita inicialmente somente `Zoom`.
- `visitantes.cidade` e `ingressos.cidade` persistem `Nome - UF`.

## Base de municípios

A API de Localidades do IBGE é a fonte primária. Um script gera um JSON local
com `id`, `nome` e `uf`, validando IDs únicos, 27 UFs e campos obrigatórios. O
mesmo arquivo alimenta o autocomplete e a validação do backend.

O JSON é atualizado manualmente antes de implantações relevantes ou quando o
IBGE alterar a divisão municipal. Não há dependência externa em tempo de
execução.

Fonte: https://servicodados.ibge.gov.br/api/docs/localidades

## Edição manual

`MANUAL_SHEETS_EDIT_ENABLED` declara a política:

- `true`: mantém a edição manual;
- `false`: uma rotina administrativa aplica proteções às abas e permite a
  escrita da conta de serviço conforme as garantias do Sheets.

A flag não bloqueia células sozinha. A rotina deve reconciliar idempotentemente
a configuração com os intervalos protegidos. O proprietário continua capaz de
administrar e remover as proteções. A rotina identifica somente as proteções
gerenciadas pela aplicação por uma descrição estável e nunca altera proteções
criadas manualmente.

## Indicadores derivados

O backend calcula, sem persistir:

- total de localidades;
- total de estados;
- total de países;
- total de visitantes;
- total de ingressos;
- total de trocas de ficha pela soma de `quantidade`;
- membros sem localidade informada.
