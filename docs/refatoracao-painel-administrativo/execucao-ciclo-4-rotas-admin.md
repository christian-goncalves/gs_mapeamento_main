# Execucao - Ciclo 4 - Rotas administrativas

Data: 2026-07-17

## Objetivo

Migrar a superficie administrativa de grupos para `/admin/*`, remover a home
antiga como tela funcional e preservar compatibilidade minima das rotas antigas.

## Escopo contratado

- `/` deve redirecionar por perfil;
- administrador deve cair em `/admin/grupos`;
- `/grupos` e `/grupos/novo` devem redirecionar para as novas rotas;
- `/grupos/[grupoId]` deve continuar operacional para responsavel e redirecionar
  administrador para `/admin/grupos/[grupoId]`;
- criar placeholders protegidos para `/admin/atas`, `/admin/usuarios`,
  `/admin/relatorios` e `/admin/configuracoes`;
- criar rota administrativa de logout em `/admin/logout`;
- nao alterar schemas, contrato Sheets, payloads, autenticacao ou permissoes.

## Implementacao

- Criado namespace `src/app/admin/`.
- Painel administrativo movido funcionalmente para `/admin/grupos`.
- Criacao e edicao administrativa de grupos expostas em `/admin/grupos/novo` e
  `/admin/grupos/[grupoId]`.
- Server Actions de grupos passaram a redirecionar e revalidar rotas
  administrativas.
- Fluxos operacionais de ata permanecem em `/atas/nova` e `/atas/[ataId]`.

## Validacao executada

- `npm run lint`: passou;
- `npm run test`: passou, 19 arquivos e 139 testes;
- `git diff --check`: passou;
- `npm run build`: compilou, mas falhou no type check por pendencia
  preexistente em `scripts/reset-ata-record-sheets.ts:113`.

## Validacao manual de rotas

- `npm run dev` nao foi iniciado por ja existir processo usando a porta 3000;
- o processo existente deixou de aceitar conexao HTTP durante a verificacao com
  `curl`;
- a validacao manual das rotas deve ser refeita no navegador apos reiniciar o
  dev server.

## Pendencias

- Implementar conteudo funcional de `/admin/atas`;
- implementar conteudo funcional de `/admin/usuarios`;
- implementar conteudo funcional de `/admin/relatorios`;
- implementar conteudo funcional de `/admin/configuracoes`.
- Revalidar manualmente `/`, `/admin/grupos`, `/grupos` e `/grupos/novo` apos
  reiniciar o servidor local.
