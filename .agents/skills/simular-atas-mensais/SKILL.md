---
name: simular-atas-mensais
description: Planeja, valida e persiste de forma atômica atas mensais simuladas para qualquer grupo ativo do GS Mapeamento, usando calendário e horários oficiais do Google Sheets, lista de nomes da execução e aleatoriedade reproduzível. Use ao gerar massa mensal de atas em DEV, conferir conflitos de grupo-data-hora, produzir manifestos de simulação ou reconciliar o resultado de uma escrita simulada.
---

# Simular atas mensais

## Preparar

1. Trabalhar na raiz do projeto GS Mapeamento.
2. Ler `AGENTS.md`, `README.md` e `docs/README.md`. Consultar somente
   documentos aplicáveis que existam no checkout atual. Não exigir instruções
   em caminhos de checkouts antigos nem pedir ao usuário que restaure material
   removido; para esta simulação, seguir também o contrato local e o código
   atual.
3. Ler [references/execution-contract.md](references/execution-contract.md)
   antes de planejar ou persistir.
4. Receber `grupo`, `mes`, `ano`, `servidores` e `seed` opcional.
5. Não buscar nomes em `data/ata-name-suggestions.json`.
6. Não aceitar horários, IDs de planilha ou destino de produção na entrada.
7. Usar somente a planilha DEV aprovada para este fluxo: `GOOGLE_SHEETS_ID`
   deve ser exatamente `1oHQ_VgwlRHEEUZP5gXyUX8RiGz0hEEZebHUhXiy1imU`. O usuário
   confirmou que esta é a única planilha existente e que não há planilha PROD.
   Se a variável estiver ausente ou diferente, parar e relatar a divergência;
   não trocar o ID automaticamente.

## Planejar

1. Salvar a entrada em arquivo JSON local não versionado.
2. Executar:

   ```bash
   npm run atas:simulate:plan -- --input <arquivo-json>
   ```

3. Confirmar no resultado:
   - grupo único e ativo;
   - horários ativos lidos da planilha Dev selecionada por `GOOGLE_SHEETS_ID` local;
   - reuniões calculadas pelo calendário real;
   - ausência de qualquer chave existente;
   - seed efetiva e quantidade total de atas;
   - manifesto pendente e validações válidas.
4. Interromper se houver qualquer conflito. Não oferecer criação parcial.
5. Apresentar:

   ```text
   Serão criadas X atas e seus registros relacionados na única planilha DEV aprovada.
   Autoriza executar?
   ```

6. Aguardar uma autorização simples e explícita. Não exigir hash.

## Persistir em DEV

Somente depois da autorização, executar:

```bash
npm run atas:simulate:commit-dev -- --run <diretorio-da-execucao> --authorized
```

O comando deve reler grupo, horários, chaves e identificadores; regenerar e
comparar os dados; materializar UUIDs; atualizar o manifesto pendente; enviar
todas as abas em uma única chamada `spreadsheets.batchUpdate`; reler o Sheets;
e criar o manifesto committed apenas após reconciliação.

As atas simuladas devem ser materializadas com `status_aprovacao: "aprovada"`;
nunca colocar essas atas em `pendente_revisao`. A simulação não altera a
configuração `grupos.revisao_atas_ativa`.

Não adicionar `--prod`. O comando usa `GOOGLE_SHEETS_ID` de `.env.local`; antes
de executar, conferir que coincide com o ID DEV aprovado acima. Não sobrescrever
o ID nem habilitar `ATA_SIMULATION_ENABLED` sem autorização explícita para a
operação real.

## Tratar falhas

- Se o planejamento informar linhas inválidas em `grupos`, não concluir que a
  planilha está errada e não pedir ao usuário para editar a base. Primeiro
  investigar o leitor e o contrato no checkout: cabeçalhos e mapeamentos em
  `contract-v2.ts`, filtragem em `rows.ts`, schemas em `schemas.ts` e validação
  em `create-simulated-atas.ts`.
- O leitor da simulação descarta somente linhas sem dados nos campos-base de
  `grupos` cujo único conteúdo esteja na extensão `revisao_atas_ativa`. Essa
  extensão não representa um grupo sozinha e não deve bloquear a simulação nem
  alterar a configuração do grupo. Nenhuma outra linha é ignorada.
- O leitor ainda valida a aba `grupos` antes de resolver o grupo solicitado e
  pode abortar por outra linha inválida fora do grupo-alvo. A mensagem resumida
  do comando não prova que os dados dessa linha estejam incorretos. Localizar,
  por leitura, aba, número da linha, campos e diagnósticos do parser; comparar
  com os cabeçalhos e regras atuais. Não fabricar fixture, contornar a validação
  nem criar plano parcial para avançar.
- Se a incompatibilidade estiver no leitor/schema, ou se não for possível
  demonstrar que a linha é inválida conforme o contrato vigente, parar e
  apresentar a evidência e o bloqueio técnico. Não recomendar alteração na
  planilha sem evidência de erro nos dados e autorização específica.
- Lote rejeitado: declarar que nenhuma linha é considerada persistida.
- Resultado de rede desconhecido: não repetir; reler e reconciliar por chaves e
  UUIDs do manifesto.
- Estado parcial ou desconhecido: parar e entregar o diretório da execução para
  diagnóstico.
- Conflito na releitura: abortar o mês inteiro e gerar novo planejamento apenas
  depois de resolver o conflito.

## Entregar

Informar grupo, período, seed, totais, destino DEV, estado da persistência e
caminho dos cinco artefatos. Confirmar se alguma escrita real ocorreu. Não
afirmar que uma planilha PROD foi bloqueada ou isolada: o usuário informou que
no ambiente atual só existe a planilha DEV aprovada.
