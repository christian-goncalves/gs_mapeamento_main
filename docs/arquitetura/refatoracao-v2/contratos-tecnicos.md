# Contratos técnicos transversais da V2

## Situação

Contratos lógicos e diretrizes transversais confirmados como parte da base documental na ESP-Q10 em 16/10/2026. O schema físico e o mecanismo de coordenação serão fechados na F0. Não executar migração a partir deste documento. Referências: [requisitos funcionais](../../produto/refatoracao-v2/especificacao-funcional.md), [diagnóstico confirmado](../../analise-diagnostico/refatoracao-v2-2026-10-16.md) e [ciclo de vida canônico](../../produto/contratos/ciclo-de-vida-atas.md).

## Identidade e estados

- UUID identifica cada registro/revisão. A ocorrência continua distinguida por grupo, data e horário; plataforma não cria uma segunda reunião simultânea na mesma chave.
- Revisões pertencem à mesma reunião e preservam índice visual. Unicidade precisa considerar família e revisão ativa, pois a validação atual proíbe qualquer índice repetido (`src/domain/ata-identifiers.ts`).
- Ciclo de registro e aprovação são eixos separados: ativo/substituído/excluído e pendente/aprovado. O rótulo Enviada corresponde à ata recebida aprovada; Não enviada é projeção da agenda, não uma ata fictícia persistida.
- Uma revisão substituída ou excluída fica fora de indicadores, mesmo tendo sido aprovada.
- Registro legado válido sem novos estados conserva o comportamento histórico aprovado/ativo. Novo registro não pode omitir silenciosamente os estados obrigatórios após a transição.
- A configuração de revisão é lida no servidor durante o envio e afeta os novos envios; não deve ser um valor confiado ao cliente.
- Desativar revisão não altera pendências existentes. Editar e Aprovar por papel autorizado cria nova revisão aprovada, preservando a anterior e o motivo.

## Contratos por responsabilidade

| Contrato | Conteúdo necessário | Compatibilidade obrigatória |
| --- | --- | --- |
| Plataforma do grupo | Identidade estável, grupo, tipo controlado, link padrão e situação de uso | Preservar plataforma gravada em atas; não inventar link histórico a partir do cadastro atual. |
| Horário e agenda | Plataforma associada, exceção de link, fuso original e evidência de vigência | Sem vigência comprovada, não inferir falta retroativa. Alterações futuras não reescrevem ocorrências passadas. |
| Ata e revisão | Estado de registro, aprovação, encadeamento das revisões, autor, motivo e datas de auditoria | Preservar UUIDs/índice e dependentes antigos; resolver unicidade por família/versão ativa. |
| Visitante e ingresso | Marca de ingresso para provável adicto e vínculo derivado nas novas atas | Legados sem vínculo continuam legíveis e não recebem associação por coincidência de cidade ou ordem. |
| Formatos | Comemorativa e Serviço como opções controladas adicionais | Manter flags/opções existentes e texto livre de Outros. |
| Mutação | Identidade da operação, conjunto de itens, versão observada, resultado confirmado e recuperação | Reenvio após resultado desconhecido não pode aplicar cegamente a mesma operação. |

Os nomes físicos de novas colunas/abas e os mapeamentos completos são entregáveis do fechamento dos contratos na F0, sujeitos à revisão antes da F1. A confirmação desta base não declara um schema físico aprovado.

## Seleção, escrita e recuperação

- Toda mutação relê a ata e revalida autorização, estado e revisão selecionada. Aprovar atualiza somente campos necessários; evitar regravar dados de negócio da linha inteira para mudar estado.
- Revalidação de item inválido antes da escrita cancela todo o lote, conforme ESP-Q6.
- Um lote aceito para gravação deve caber em uma única `spreadsheets.batchUpdate`; se exceder o limite definido, o usuário precisa reduzir a seleção. Não dividir silenciosamente a confirmação em várias chamadas com resultado parcial.
- Falha explícita de validação da API e resultado de rede desconhecido são condições diferentes. Timeout não prova ausência de gravação; consultar o resultado pela identidade da operação antes de repetir.
- ESP-Q7 exige coordenação compartilhada antes de habilitar novas mutações; a F0 selecionará o componente e apresentará custos/operação. Mutex em memória de um processo não coordena múltiplas instâncias Vercel; releitura seguida de escrita não constitui comparação e troca atômica.
- A abrangência mínima é a planilha compartilhada, incluindo os fluxos existentes de criação que alocam linhas nas mesmas abas. Coordenar somente por grupo não protege dois grupos que escolham a mesma linha vazia. Leitura de validação, cálculo da alteração e escrita precisam fazer parte do fluxo coordenado.
- Inventariar todos os escritores: link público, responsável, administrador, scripts e versões implantadas que ainda consigam escrever. Um escritor antigo fora do protocolo e uma edição manual externa não recebem a mesma garantia. O corte operacional precisa explicitar esses limites e a política de acesso no período.
- Falha ou resultado desconhecido da coordenação não pode liberar nova escrita conflitante por conveniência. A solução precisa especificar expiração, processo interrompido, recuperação e comprovação do resultado anterior; não presumir que um lock com prazo sozinho elimina a disputa.
- Seleção de aprovação permanece na página visível e é limpa quando a página ou os filtros mudam. O conjunto exato e a versão observada de cada ata são revalidados; não ampliar automaticamente a seleção ao resultado completo do filtro.

## Compatibilidade para publicação em blocos

Fatos que exigem adaptação antes da primeira migração:

- `src/lib/sheets/rows.ts:14` exige cabeçalhos exatos, em tamanho e ordem.
- Leitores e criação usam intervalos fixos como `A:Z`; novas colunas podem ultrapassar essa faixa.
- Reconciliação reconhece migrações específicas; acrescentar colunas não garante que leitores antigos continuem funcionando.
- Escrita de criação escolhe linhas vazias e usa coordenadas fixas; sem coordenação, duas requisições podem escolher as mesmas linhas.

Contrato de implantação: preparar e validar código compatível com o contrato anterior e o novo, publicar essa compatibilidade, executar reconciliação autorizada primeiro em DEV, verificar leitura/escrita, e só então habilitar a funcionalidade correspondente no alvo aprovado. Publicação em produção e migração real exigem seus procedimentos e autorizações próprias.

O ponto seguro de retorno é uma versão compatível com os dados já gravados. Restaurar um deploy antigo estrito não é uma recuperação válida se ele rejeitar o novo cabeçalho. Não apagar automaticamente colunas ou registros novos para tentar voltar ao código anterior.

## Datas e consumo

- Fuso original é evidência necessária; exibição em Brasília pode mudar dia, mês e ordenação. Não deduzir fuso antigo somente do cadastro atual se houve alteração sem histórico.
- Filtros e navegação usam a mesma representação temporal da tela; identidade histórica permanece rastreável.
- Listagens podem mostrar pendentes; indicadores selecionam ativas aprovadas; cálculo de faltantes reconhece pendentes como atas recebidas. Essa filtragem não pode ser aplicada indiscriminadamente a toda leitura agregada.
- Tela e PDF compartilham o contrato de apresentação; impressão tem layout próprio. Ativação de uma funcionalidade inclui todos os consumidores necessários à sua correção.

## Evidências exigidas dos contratos

Testes de ida/volta de serialização, cabeçalhos anterior/novo, registros legados, colunas além de Z, permissões, duas revisões da mesma reunião, reenvio, resultado desconhecido, vigência da agenda e conversão na virada do dia. Concorrência precisa de prova conforme o mecanismo escolhido; testes unitários isolados não demonstram coordenação entre instâncias.

## Referências técnicas

- [Google Sheets batchUpdate](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/batchUpdate): aplicação conjunta das suboperações do pedido, com ressalva sobre colaboração concorrente.
- [Limites da API](https://developers.google.com/workspace/sheets/api/limits): dimensionar payload, processamento e repetição; não prometer lote ilimitado.
