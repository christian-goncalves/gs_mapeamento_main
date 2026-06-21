# Arquitetura de Dados - MVP GS Mapeamento

## Objetivo

Definir o contrato mínimo para registrar reuniões de grupos em uma aplicação
web própria. O Google Sheets será a fonte oficial do MVP e cada aba representará
uma entidade do modelo.

Não haverá banco de dados local nem integração com Jotform.

## Princípios

### Dados primários

O usuário informa apenas fatos que não podem ser deduzidos, como grupo, data,
participantes por localidade, visitantes e trocas de chaveiro.

### Dados derivados

Os seguintes valores serão calculados pelo backend e nunca serão campos de
preenchimento ou colunas persistidas:

- total de localidades
- total de estados
- total de países
- total de visitantes
- total de trocas de chaveiro
- quantidade de membros sem localidade informada

### Normalização

- Uma célula contém um único valor.
- Uma linha representa um único registro.
- Dados repetíveis ocupam linhas próprias.
- Toda entidade dependente de uma reunião se relaciona por `ata_id`.
- IDs são UUIDs gerados pelo backend e não são editáveis pela interface.
- Datas e horários de auditoria usam ISO 8601.

## Entidades e abas

### `grupos`

Cadastro controlado usado na seleção do grupo.

| Campo | Tipo | Regra |
| --- | --- | --- |
| grupo_id | UUID | Chave primária |
| zoom_id | texto | ID externo do Zoom; pode se repetir |
| grupo_nome | texto | Obrigatório e único |
| ordem | inteiro | Ordem de exibição, única e a partir de 1 |
| ativo | booleano | Controla disponibilidade no formulário |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

`grupo_id` é o único identificador usado nos relacionamentos internos. O
`zoom_id` deve ser armazenado como texto para preservar o valor original e não
pode ser usado como chave, pois uma mesma reunião do Zoom pode atender mais de
um grupo. `ordem` serve apenas para apresentação e pode ser reorganizada.

### `atas`

Uma linha por reunião. Reúne os valores escalares das seções Informações Gerais
e Participação.

| Campo | Tipo | Regra |
| --- | --- | --- |
| ata_id | UUID | Chave primária |
| grupo_id | UUID | Referência obrigatória a `grupos` |
| data_reuniao | data | Obrigatória |
| hora_inicio | hora | Obrigatória, em intervalos de 30 minutos |
| plataforma | texto | Valor controlado |
| tipo_reuniao | enum | `aberta` ou `fechada` |
| formato_partilha | booleano | Formato selecionado |
| formato_estudo | booleano | Formato selecionado |
| formato_tematico | booleano | Formato selecionado |
| formato_literatura | booleano | Formato selecionado |
| formato_passos | booleano | Formato selecionado |
| formato_tradicoes | booleano | Formato selecionado |
| total_membros_presentes | inteiro | Dado informado, maior ou igual a zero |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

Pelo menos um formato de reunião deve ser selecionado.

### `servidores`

Uma linha por servidor da reunião, sem limite fixo de quantidade.

| Campo | Tipo | Regra |
| --- | --- | --- |
| servidor_id | UUID | Chave primária |
| ata_id | UUID | Referência obrigatória a `atas` |
| nome | texto | Obrigatório |
| ordem | inteiro | Ordem de apresentação, a partir de 1 |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

### `participacao`

Uma linha por localidade participante. Nacional e internacional usam a mesma
estrutura.

| Campo | Tipo | Regra |
| --- | --- | --- |
| participacao_id | UUID | Chave primária |
| ata_id | UUID | Referência obrigatória a `atas` |
| localidade | texto | Cidade ou localidade, obrigatória |
| estado | texto | Obrigatório para Brasil; vazio para outros países |
| pais | texto | Obrigatório |
| presencas | inteiro | Obrigatório e maior que zero |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

A soma de `presencas` de uma ata não pode superar
`atas.total_membros_presentes`.

### `visitantes`

Uma linha por visitante.

| Campo | Tipo | Regra |
| --- | --- | --- |
| visitante_id | UUID | Chave primária |
| ata_id | UUID | Referência obrigatória a `atas` |
| nome | texto | Obrigatório |
| cidade | texto | Valor controlado |
| categoria | enum | Conforme contrato de Participação |
| origem_contato | enum | Conforme contrato de Participação |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

### `trocas_chaveiro`

Uma linha por troca de chaveiro.

| Campo | Tipo | Regra |
| --- | --- | --- |
| troca_chaveiro_id | UUID | Chave primária |
| ata_id | UUID | Referência obrigatória a `atas` |
| tempo_limpo | enum | Conforme contrato de Participação |
| created_at | timestamp | Gerado pelo backend |
| updated_at | timestamp | Atualizado pelo backend |

## Regras de leitura e escrita

- A aplicação acessa o Sheets exclusivamente pelo backend.
- Criação e edição são transações lógicas: todas as linhas relacionadas devem
  ser validadas antes de qualquer escrita.
- Em caso de falha parcial, o backend deve restaurar os valores anteriores ou
  sinalizar a ata como inválida; nunca deve retornar sucesso silencioso.
- Edições manuais são permitidas, mas não contornam o contrato. Ao ler uma ata,
  o backend valida tipos, IDs, referências e totais.
- Registros inválidos aparecem na aplicação com erro de validação e não entram
  em indicadores até serem corrigidos.

## Arquitetura futura da aplicação

- Next.js App Router implantado na Vercel.
- Server Components para leitura autenticada.
- Server Actions para criação e edição.
- Camada de domínio independente para validações e cálculos.
- Adaptador server-only para a Google Sheets API.
- Auth.js com provedor Google e lista de e-mails autorizados.
- Autorização revalidada em cada leitura e mutação no servidor.
- Credenciais e identificador da planilha fornecidos por variáveis de ambiente.

O DBML em `docs/modelo_dados.dbml` é a representação visual deste contrato; ele
não indica a adoção de banco relacional no MVP.
