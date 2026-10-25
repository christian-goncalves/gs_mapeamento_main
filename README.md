#1D4ED8

# Minhas anotações

1. Quando quiser voltar, diga: “Restaure somente /responsavel/relatorios a partir do snapshot de 22/10/2026.” O componente e o CSS também são compartilhados com outras telas, então a restauração será seletiva para preservar o Admin. O snapshot registra o código e os dados visíveis nas imagens; não copia a planilha.
- /home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento/docs/dashboard-artefatos/snapshots

2. Cores
Inspecionei com Playwright **“CSRs Brasil e Nordeste · Bahia · Dashboard executivo”**. As cinco cores vermelhas configuradas para a escala populacional são:

- <span style="display:inline-block;width:1em;height:1em;background-color:#fee5d9;border:1px solid #d6b9ae;vertical-align:middle"></span> `#fee5d9`
- <span style="display:inline-block;width:1em;height:1em;background-color:#fcae91;border:1px solid #d68e77;vertical-align:middle"></span> `#fcae91`
- <span style="display:inline-block;width:1em;height:1em;background-color:#fb6a4a;border:1px solid #d7573b;vertical-align:middle"></span> `#fb6a4a`
- <span style="display:inline-block;width:1em;height:1em;background-color:#de2d26;border:1px solid #bd2923;vertical-align:middle"></span> `#de2d26`
- <span style="display:inline-block;width:1em;height:1em;background-color:#a50f15;border:1px solid #8b1116;vertical-align:middle"></span> `#a50f15`

No gráfico renderizado agora aparecem três delas, conforme as fatias visíveis.

**Azuis do tema claro:**

- <span style="display:inline-block;width:1em;height:1em;background-color:#0b3a7a;border:1px solid #0b3a7a;vertical-align:middle"></span> Título: `#0b3a7a`
- <span style="display:inline-block;width:1em;height:1em;background-color:#1d4ed8;border:1px solid #1d4ed8;vertical-align:middle"></span> Barra lateral do título, botão “Limpar filtros”, valores dos cards e preenchimento das barras: `#1d4ed8`
- <span style="display:inline-block;width:1em;height:1em;background-color:#bfdbfe;border:1px solid #9bbbe5;vertical-align:middle"></span> Trilho/fundo das barras: `#bfdbfe`
- <span style="display:inline-block;width:1em;height:1em;background-color:#cfe2f5;border:1px solid #9bbbe5;vertical-align:middle"></span> Preenchimento azul pálido do mapa: `#cfe2f5`
- <span style="display:inline-block;width:1em;height:1em;background-color:#f3f7fb;border:1px solid #cbd5e1;vertical-align:middle"></span> Fundo geral azul-acinzentado: `#f3f7fb`
- <span style="display:inline-block;width:1em;height:1em;background-color:#12263f;border:1px solid #12263f;vertical-align:middle"></span> Texto navy: `#12263f`

**Azuis alternativos do tema escuro:**

- <span style="display:inline-block;width:1em;height:1em;background-color:#93c5fd;border:1px solid #93c5fd;vertical-align:middle"></span> Título: `#93c5fd`
- <span style="display:inline-block;width:1em;height:1em;background-color:#60a5fa;border:1px solid #60a5fa;vertical-align:middle"></span> Barra lateral do título, botão “Limpar filtros”, valores dos cards e preenchimento das barras: `#60a5fa`
- <span style="display:inline-block;width:1em;height:1em;background-color:#1e3a5f;border:1px solid #1e3a5f;vertical-align:middle"></span> Trilho/fundo das barras: `#1e3a5f`
- <span style="display:inline-block;width:1em;height:1em;background-color:#27425f;border:1px solid #27425f;vertical-align:middle"></span> Preenchimento do mapa: `#27425f`

Restaurei o tema claro após a medição.

Registrei a paleta em [cores-artefato-csrs-brasil-nordeste-bahia.md](/home/cg/Documentos/01-DEV/PROJETOS/gs-mapeamento/docs/analise-diagnostico/cores-artefato-csrs-brasil-nordeste-bahia.md).
---

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
