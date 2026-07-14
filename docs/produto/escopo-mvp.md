# Escopo do MVP

## Objetivo

Permitir que usuários autorizados registrem atas de reuniões, consultem o
histórico e visualizem indicadores derivados. O Google Sheets permanece como
fonte oficial dos dados.

## Incluído

- Login Google com lista de e-mails autorizados.
- Responsável de grupo com login Google vinculado ao próprio grupo.
- Link único por grupo para preenchimento de ata sem acesso administrativo.
- Seleção de grupos ativos.
- Horários recorrentes por grupo.
- Criação, listagem e visualização de atas.
- Informações Gerais e Participação.
- Servidores, localidades, visitantes, ingressos, partilhas e trocas de ficha.
- Indicadores calculados sem persistência de totais derivados.
- Validação dos dados lidos e escritos no Sheets.
- Manutenção manual controlada na planilha.

## Não incluído

- Edição ou exclusão de atas enviadas pela aplicação.
- Convites individuais, tokens, expiração ou auditoria avançada de acesso.
- Banco de dados local ou relacional.
- Integração operacional com Jotform ou automações de terceiros.
- Finanças, anexos e informações extras.
- Visitantes internacionais.

Features futuras que surgirem durante a validação devem ser registradas no
[Backlog de produto](backlog.md) antes de virarem plano de implementação.

## Envio imutável

- O formulário permanece como rascunho no navegador até a confirmação.
- Dependentes podem ser adicionados, reordenados ou removidos antes do envio.
- Um diálogo apresenta o resumo completo para conferência.
- O backend revalida o conteúdo antes de persistir qualquer linha.
- Depois do envio, a aplicação oferece apenas listagem e visualização.

## Prevenção de duplicidade

A chave de negócio é:

```text
grupo_id + data_reuniao + hora_inicio
```

`zoom_id` não participa porque pode ser compartilhado por mais de um grupo. O
backend consulta essa combinação antes da gravação e rejeita o reenvio. A
interface bloqueia confirmações repetidas enquanto a requisição estiver ativa.

## Municípios brasileiros

Localidades da reunião, visitantes e ingressos selecionam cidades por
autocomplete em uma lista controlada. O IBGE é a fonte oficial; a aplicação usa
um JSON mínimo local com `id`, `nome` e `uf`, sem chamada externa durante o
preenchimento. O Sheets persiste `Nome - UF` onde a cidade é um atributo da
pessoa e persiste cidade, UF e país separados na aba de participação.

## Edição manual e testes

- A edição manual no Sheets começa habilitada.
- Uma configuração server-only permitirá reconciliar proteções das abas.
- Testes de escrita usam uma planilha exclusiva, nunca a planilha oficial.

Os detalhes técnicos estão em
[Arquitetura de dados](../arquitetura/arquitetura-de-dados.md).
