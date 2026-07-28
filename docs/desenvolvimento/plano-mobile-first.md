# Plano operacional Mobile First

## Objetivo

Adequar a interface do GS Mapeamento para dispositivos móveis sem alterar o
comportamento atual de Desktop e Tablet.

Neste projeto, **Mobile** significa permanentemente largura menor ou igual a
`720 px`. Toda implementação desta fase deve ficar restrita a
`@media (max-width: 720px)` ou a comportamento equivalente que não produza
efeitos acima desse limite.

## Tela inicial e contextos compartilhados

A fase começa em `/responsavel/atas/nova`.

O formulário também é utilizado por `/preencher/{link}`. Cada alteração deve
preservar simultaneamente:

- o preenchimento autenticado pelo responsável;
- o preenchimento público por qualquer usuário com o link do grupo;
- os campos, as validações, os payloads, a acessibilidade e a persistência
  existentes.

O `ResponsavelShell` pertence apenas à rota autenticada. O `AtaForm` é
compartilhado pelos dois contextos, enquanto a rota pública usa seu próprio
shell.

## Referências visuais

Cada solicitação deve conter três prints:

1. Desktop no estado atual;
2. Tablet no estado atual;
3. Mobile com o resultado desejado.

Desktop e Tablet servem exclusivamente para comparação e proteção contra
regressões. Somente o print Mobile define alterações.

## Processo por solicitação

1. Comparar os três prints e inspecionar a tela real.
2. Identificar diferenças de layout, espaçamento, dimensões, tipografia,
   navegação e estados interativos no Mobile.
3. Mapear os componentes e seletores responsáveis.
4. Registrar previamente qualquer risco para Desktop, Tablet ou para um dos
   contextos de preenchimento.
5. Implementar a menor mudança possível, priorizando CSS dentro de
   `@media (max-width: 720px)`.
6. Alterar JSX somente quando CSS for insuficiente e manter a estrutura neutra
   fora do Mobile.
7. Preservar o contrato funcional do formulário e não executar alterações no
   Google Sheets.

## Validação

Para cada alteração:

- comparar o resultado com o print Mobile desejado;
- validar `/responsavel/atas/nova` e `/preencher/{link}`;
- testar `720 px` como Mobile e `721 px` como limite de preservação;
- repetir a verificação nas larguras de Desktop e Tablet dos prints;
- verificar overflow horizontal, cortes, sobreposições e áreas clicáveis;
- exercitar adição e remoção de itens, autocompletes, controles numéricos,
  revisão, modal, erros e envio quando forem impactados;
- usar screenshots e medições do navegador como evidência;
- executar testes direcionados, `npm run test`, `npm run lint` e
  `npm run build`.

## Restrições permanentes

- Não alterar Desktop ou Tablet.
- Não criar regras responsivas fora do limite Mobile para atender a esta fase.
- Não modificar schemas, regras de negócio, serialização ou contratos do
  Google Sheets por causa de ajustes visuais.
- Não executar scripts de reconciliação ou escrita na planilha.
- Preservar as alterações já existentes no worktree.
- Manter cada diff restrito ao pedido visual corrente.

Nenhuma mudança visual deve ser implementada sem os prints correspondentes e a
análise prévia do impacto.

A remoção aprovada de `localidade` dos membros internacionais é uma exceção de
produto: vale em todas as dimensões, mantém a coluna no Sheets e persiste esse
campo vazio para registros cujo país não seja Brasil.
