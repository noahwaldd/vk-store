# VK Store

E-commerce de roupas, perfumes e acessórios com Next.js 16.2.6, App Router,
TypeScript, Tailwind CSS, shadcn/ui, Zustand, React Hook Form, Zod, Supabase,
Mercado Pago e animações GSAP.

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` ou preencha o `.env` local:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_URL=
NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET=product-images
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PRODUCTS_URL=http://localhost:3000/produtos
NEXT_PUBLIC_CART_URL=http://localhost:3000/carrinho
NEXT_PUBLIC_CHECKOUT_URL=http://localhost:3000/checkout
NEXT_PUBLIC_CHECKOUT_SUCCESS_URL=http://localhost:3000/checkout?status=success
NEXT_PUBLIC_CHECKOUT_FAILURE_URL=http://localhost:3000/checkout?status=failure
NEXT_PUBLIC_CHECKOUT_PENDING_URL=http://localhost:3000/checkout?status=pending
NEXT_PUBLIC_LOGIN_URL=http://localhost:3000/login
MERCADO_PAGO_ACCESS_TOKEN=
ADMIN_EMAILS=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SUPPORT_EMAIL=atendimento@vkstore.com.br
SUPABASE_S3_ACCESS_KEY_ID=
SUPABASE_S3_SECRET_ACCESS_KEY=
SUPABASE_S3_ENDPOINT=
SUPABASE_S3_REGION=sa-east-1
```

## Supabase

1. Rode o SQL de `supabase/schema.sql` no SQL Editor do Supabase.
2. Confirme que o bucket público `product-images` existe.
3. Crie um admin localmente:

```bash
npm run admin:create -- --email admin@vkstore.com --password "senha-forte"
```

O script cria ou atualiza o usuário no Supabase Auth com
`app_metadata.role = "admin"`. Como fallback, você também pode colocar e-mails
autorizados em `ADMIN_EMAILS`, separados por vírgula.

## Estrutura principal

- `app/`: rotas App Router públicas, checkout e admin.
- `components/`: componentes reutilizáveis e componentes shadcn/ui locais.
- `lib/`: Supabase, produtos, carrinho e checkout Mercado Pago.
- `store/`: store Zustand do carrinho.
- `schemas/`: validações Zod.
- `types/`: tipos de produto e pedido.
- `supabase/schema.sql`: tabelas iniciais e bucket de imagens.
"# Vk-Store" 
