---
name: simular-atas-mensais
description: Planeja, valida e persiste de forma atômica atas mensais simuladas para qualquer grupo ativo do GS Mapeamento, usando calendário e horários oficiais do Google Sheets, lista de nomes da execução e aleatoriedade reproduzível. Use ao gerar massa mensal de atas em DEV, conferir conflitos de grupo-data-hora, produzir manifestos de simulação ou reconciliar o resultado de uma escrita simulada.
---

# Simular atas mensais

## Preparar

1. Trabalhar na raiz do projeto GS Mapeamento.
2. Ler `GEMINI.md`, `docs/desenvolvimento/diretrizes-agentes.md`, `README.md`, `docs/README.md` e
   `../gs-mapeamento-atas/SKILL.md`.
3. Ler [references/execution-contract.md](references/execution-contract.md)
   antes de planejar ou persistir.
4. Receber `grupo`, `mes`, `ano`, `servidores` e `seed` opcional.
5. Não buscar nomes em `data/ata-name-suggestions.json`.
6. Não aceitar horários, IDs de planilha ou destino de produção na entrada.

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
   Serão criadas X atas e seus registros relacionados no Google Sheets DEV.
   Nenhuma escrita será feita em produção.
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

Não adicionar `--prod`. O comando usa `GOOGLE_SHEETS_ID` de `.env.local`, que
deve apontar para Dev; não sobrescrever o ID para apontar a produção. Não
habilitar `ATA_SIMULATION_ENABLED` sem o usuário autorizar a operação real.

## Tratar falhas

- Lote rejeitado: declarar que nenhuma linha é considerada persistida.
- Resultado de rede desconhecido: não repetir; reler e reconciliar por chaves e
  UUIDs do manifesto.
- Estado parcial ou desconhecido: parar e entregar o diretório da execução para
  diagnóstico.
- Conflito na releitura: abortar o mês inteiro e gerar novo planejamento apenas
  depois de resolver o conflito.

## Entregar

Informar grupo, período, seed, totais, destino DEV, estado da persistência e
caminho dos cinco artefatos. Confirmar explicitamente que produção permaneceu
bloqueada e se alguma escrita real ocorreu.
