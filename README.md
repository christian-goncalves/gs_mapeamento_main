# GS Mapeamento

MVP para registrar atas de reuniões de grupos, consultar o histórico e produzir
indicadores sem preenchimento duplicado.

## Decisões do MVP

- Aplicação web própria em Next.js App Router, hospedada na Vercel.
- Google Sheets como fonte oficial dos dados, sem banco de dados local.
- Regras de negócio e acesso ao Sheets executados somente no backend.
- Login Google com Auth.js e lista de e-mails autorizados.
- Operações de criar, listar, visualizar e editar atas.
- Edição manual no Sheets permitida, com validações nas abas e no backend.
- Exclusão de atas fora do MVP.
- Grupos identificados internamente por `grupo_id` UUID; `zoom_id` é um atributo
  externo e pode ser compartilhado por mais de um grupo.

## Escopo

O formulário da aplicação terá duas seções:

1. Informações Gerais
2. Participação

Essas seções não representam abas da planilha. Para manter os dados
normalizados, a pasta de trabalho terá seis abas:

- `grupos`
- `atas`
- `servidores`
- `participacao`
- `visitantes`
- `trocas_chaveiro`

Finanças, ingressos, partilhas, anexos e informações extras não fazem parte do
MVP.

## Documentos

- [Arquitetura dos dados](docs/arquitetura_dos_dados/arquitetura_dos_dados.md)
- [Contrato de Informações Gerais](docs/informacoes_gerais/Informações%20Gerais.md)
- [Contrato de Participação](docs/participacao/Participação.md)
- [Plano de desenvolvimento](docs/plano_desenvolvimento.md)
- [Histórico e estado atual](docs/HISTORICO.md)
- [Modelo DBML](docs/modelo_dados.dbml)
- [Como visualizar o modelo](docs/visualizacao_modelo.md)
- [Diagrama no dbdiagram.io](https://dbdiagram.io/d/6a37eb4e5c789b8acbcb38db)
- [Google Sheets do MVP](https://docs.google.com/spreadsheets/d/1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU/edit)

## Referência visual

O formulário antigo do Jotform e as imagens em `docs/` servem somente como
referência visual da ata existente. Não haverá integração, automação ou
dependência operacional do Jotform.

- Formulário de referência: https://form.jotform.com/233546279561666
- Captura local de referência: `jotaform.html`

## Segurança

Os valores locais ficam somente em `.env.local`, ignorado pelo Git. Os JSONs de
origem não fazem parte do projeto e `.env.example` contém apenas o contrato das
variáveis, sem valores. Antes da implantação, a chave da conta de serviço deve
ser rotacionada e os novos segredos devem ser configurados nas variáveis de
ambiente da Vercel. A planilha deve permanecer compartilhada somente com a conta
de serviço utilizada pelo backend.
