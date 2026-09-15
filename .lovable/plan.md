# Corrigir marcação de vendas no TikTok

## Resultado
As compras aprovadas pela Cooud serão enviadas ao TikTok pelo servidor, mesmo quando o comprador fechar a página ou não concluir o redirecionamento.

## Implementação
- Conectar o evento `order.paid` do webhook da Cooud ao envio `Purchase` do TikTok.
- Ler corretamente valor, moeda, produto e comprador do formato real recebido da Cooud.
- Usar o ID estável do pedido como `event_id`, permitindo que TikTok deduplique o evento do navegador e do servidor.
- Registrar o resultado do envio no histórico técnico para identificar falhas futuras sem afetar e-mails ou pagamentos.
- Manter o pixel atual no navegador como cobertura complementar.

## Configuração necessária
- O servidor precisa do token de acesso da Events API do TikTok. A estrutura será preparada primeiro; depois, o token será solicitado pelo formulário seguro, sem aparecer no chat ou no código.

## Validação
- Confirmar que o webhook público continua respondendo normalmente.
- Validar o tratamento de um payload real `order.paid` já registrado.
- Verificar que o projeto compila e que nenhuma venda repetida gera IDs diferentes.
