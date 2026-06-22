# Arquitetura de dados

## Objetivo

Definir como o domínio do MVP é validado, persistido e reconstruído. O Google
Sheets é a fonte oficial e não existe banco de dados local.

O [modelo DBML](modelo-de-dados.dbml) representa visualmente as seis abas, sem
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

Uma pasta de trabalho contém seis abas:

| Aba | Responsabilidade |
| --- | --- |
| `grupos` | Cadastro controlado dos grupos |
| `atas` | Dados escalares de cada reunião |
| `servidores` | Servidores vinculados por `ata_id` |
| `participacao` | Presenças por localidade vinculadas por `ata_id` |
| `visitantes` | Visitantes vinculados por `ata_id` |
| `trocas_chaveiro` | Trocas vinculadas por `ata_id` |

`grupo_id` é o identificador interno dos grupos. `zoom_id` é um atributo externo
repetível e nunca é usado como chave de relacionamento.

Os campos e valores aceitos estão nos contratos de
[Informações Gerais](../produto/contratos/informacoes-gerais.md) e
[Participação](../produto/contratos/participacao.md).

## Normalização e auditoria

- Uma célula contém um único valor.
- Uma linha representa um único registro.
- Dados repetíveis ocupam linhas próprias.
- Entidades dependentes usam `ata_id`.
- IDs são UUIDs gerados pelo backend.
- `created_at` e `updated_at` usam ISO 8601.
- Totais derivados nunca são persistidos.

## Leitura

O adaptador confere os cabeçalhos, converte as linhas e preserva a localização
original de cada registro. A leitura agregada:

1. valida individualmente as seis abas;
2. resolve referências por `grupo_id` e `ata_id`;
3. separa registros válidos e inválidos;
4. calcula indicadores apenas com dados válidos;
5. informa aba, linha, campo e mensagem para correção manual.

Grupos inativos não aparecem em novos formulários, mas continuam identificáveis
em atas históricas.

## Criação atômica

O rascunho não é persistido. Após a confirmação do resumo, o backend:

1. revalida autorização e dados;
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
- O Sheets mantém rótulos em português.
- O adaptador converte nos dois sentidos e rejeita valores desconhecidos.
- `plataforma` aceita inicialmente somente `Zoom`.
- `visitantes.cidade` persiste `Nome - UF`.

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
- `false`: uma rotina administrativa aplica proteções às seis abas e permite a
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
- total de trocas de chaveiro;
- membros sem localidade informada.
