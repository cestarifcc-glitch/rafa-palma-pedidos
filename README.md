# Site de pedidos — Café Rafa Palma

Versão inicial estática, responsiva e pronta para Vercel/GitHub.

## Arquivos
- `index.html`: estrutura e SEO.
- `styles.css`: identidade visual e responsividade.
- `products.js`: cadastro centralizado de produtos, preços e disponibilidade.
- `app.js`: carrinho, checkout e geração do pedido no WhatsApp.

## Como alterar preços e produtos
Edite somente o arquivo `products.js`.

## Fotos oficiais
No `products.js`, informe o caminho da imagem em `image`, por exemplo:

```js
image: 'assets/vivencia.jpg'
```

Crie a pasta `assets` e coloque as fotos nela.

## WhatsApp
O número configurado é `55 55 99112-8100`, armazenado sem pontuação em `app.js`.

## Frete
Nenhum valor foi inventado. A interface informa que o frete será confirmado antes do pagamento.

## Pagamento
Não há pagamento online nesta primeira versão. O pedido é enviado ao WhatsApp para fechamento.
