# GS Mapeamento

MVP web para registrar atas de reuniões de grupos, consultar o histórico e
produzir indicadores sem preenchimento duplicado.

## Visão geral

- Next.js App Router com TypeScript.
- Google Sheets como persistência oficial, sem banco de dados local.
- Auth.js com login Google e lista de e-mails autorizados.
- Regras de negócio e acesso ao Sheets executados no backend.
- Atas criadas, listadas e visualizadas pela aplicação.

O escopo completo e as decisões aprovadas estão em
[Escopo do MVP](docs/produto/escopo-mvp.md).

## Desenvolvimento local

```bash
npm install
npm test
npm run dev
```

As variáveis, credenciais e instruções de OAuth estão em
[Ambiente local](docs/desenvolvimento/ambiente-local.md).

## Documentação

Consulte o [índice da documentação](docs/README.md) para a ordem de leitura,
fontes canônicas, arquitetura, contratos e planejamento.

O estado das próximas entregas está no
[checklist executivo](docs/desenvolvimento/checklist-executivo.md).
