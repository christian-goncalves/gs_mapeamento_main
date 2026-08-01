# Contrato de ciclo de vida das atas

## Decisão aprovada

Atas confirmadas não são sobrescritas nem removidas fisicamente. A aplicação
preserva o registro original e seus dependentes para manter histórico e
integridade no Google Sheets.

## Edição por revisão

- Editar cria uma nova `ata` com novos UUIDs para ela e seus dependentes.
- A nova linha referencia a versão substituída.
- A versão anterior passa a `substituida` e deixa as listagens normais.
- O índice visual do grupo permanece o mesmo; o sequencial técnico e os UUIDs
  continuam auditáveis.
- A validação de duplicidade considera apenas a revisão `ativa` da chave
  `grupo_id + data_reuniao + hora_inicio`.
- O motivo é obrigatório e registra também autor e data da revisão.

## Exclusão lógica

- Excluir exige confirmação e motivo obrigatório.
- A ata passa a `excluida`, sem apagar linhas de nenhuma aba.
- Dependentes continuam vinculados ao mesmo `ata_id` histórico.
- A ata deixa listagens e indicadores normais, mas permanece disponível para
  auditoria administrativa.
- O índice e o sequencial não são reutilizados.

## Autorização

- Administradores podem revisar ou excluir qualquer ata acessível.
- Responsáveis podem agir apenas em atas do próprio grupo.
- O formulário público não pode revisar nem excluir atas.
- Toda Server Action relê a ata e revalida a autorização antes da mutação.

## Evolução estrutural proposta

A aba `atas` receberá, por reconciliação idempotente:

- `status_registro`: `ativa`, `substituida` ou `excluida`;
- `revisao_de_ata_id`: UUID opcional da versão imediatamente anterior;
- `motivo_alteracao`: texto obrigatório em revisão ou exclusão;
- `alterado_por`: e-mail autenticado;
- `excluida_em`: timestamp opcional.

Registros históricos sem `status_registro` serão interpretados como `ativa`
durante a migração. A reconciliação estrutural e qualquer teste de escrita
devem usar exclusivamente a planilha DEV e exigem autorização explícita.

## Implementação por ciclo

1. Atualizar domínio, cabeçalhos, adaptadores e reconciliação, com testes puros.
2. Implementar leitura filtrada e auditoria administrativa.
3. Implementar formulário de revisão preenchido a partir da versão ativa.
4. Persistir a revisão em lote atômico e marcar a versão anterior.
5. Implementar confirmação e exclusão lógica atômica.
6. Habilitar os itens `Editar` e `Excluir` somente após validação completa em
   uma planilha DEV exclusiva.

Até a conclusão dessas etapas, os dois itens permanecem indisponíveis na
interface.
