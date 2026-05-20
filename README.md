# VkStore

## Stack

- Next.js 16 App Router
- React 19
- TypeScript 6
- Tailwind CSS 4
- Prisma 7 com PostgreSQL/RDS
- NextAuth 4 com Credentials Provider
- AWS S3 para imagens privadas servidas pelo app
- Nodemailer via SMTP da Hostinger para recuperação de senha
- Zod para validação de entrada
- React Hook Form para formulários
- Zustand para carrinho no cliente
- Radix UI primitives, Lucide icons, Sonner toasts
- ESLint e build Next como checks principais

## Funcionalidades

### Público

- Home com hero configurável e imagem separada para desktop/mobile.
- Bloco de ofertas da home com textos e link configuráveis pelo painel.
- Vitrine de produtos em `/produtos`.
- Página individual de produto em `/produto/[slug]`.
- Cards exibem variações disponíveis para reduzir dúvida antes do clique.
- CTAs de carrinho e checkout usam destaque visual controlado para reforçar a ação principal.
- Toasts ficam no canto inferior esquerdo para não cobrir a sacolinha/carrinho no topo.
- Busca, filtros por categoria e ordenação no catálogo.
- Carrinho persistido no navegador via Zustand/localStorage.
- Checkout público com validação server-side dos itens e finalização pelo WhatsApp.
- Floating WhatsApp.
- Banner de consentimento de cookies.
- Páginas legais: `/privacidade`, `/cookies`, `/termos`.
- Menu mobile dedicado, com busca e links principais.

### Admin

- Painel em `/admin`, protegido por role `admin`.
- CRUD de produtos, com galeria de até 8 imagens, preço, preço comparativo, estoque, destaque, variações e soft delete.
- Galeria do produto permite adicionar múltiplas fotos, pré-visualizar antes de salvar, remover e reordenar com setas ou drag and drop.
- Cadastro, edição e ordenação de categorias com setas ou drag and drop.
- Categorias podem ter imagem para o bloco "Compre por seção".
- Categorias ordenadas refletem na home, nos filtros, no header e nos links de loja do footer.
- Gerenciamento de navegação por área (`primary`, `secondary`, `footer`).
- Destinos protegidos do sistema não aparecem para edição no dashboard de navegação.
- Configuração visual em `/admin/aparencia`:
  - imagem do login, com opção de preto e branco;
  - imagem hero desktop;
  - imagem hero mobile;
  - chamada, título, descrição e link do bloco de ofertas da home.
- Confirmação de exclusão em ações destrutivas de categorias e navegação.

### Conta e autenticação

- Login por e-mail e senha.
- Registro de usuário comum.
- Recuperação de senha por e-mail, único envio transacional do site.
- Cadastro aceita apenas domínios de e-mail conhecidos, mas a interface não lista a whitelist; use `ALLOWED_EMAIL_DOMAINS` para acrescentar domínios separados por vírgula.
- Cadastro sugere correções pontuais de domínio quando o usuário digita um erro comum.
- Rate limit gratuito de cadastro por IP hasheado no banco, sem armazenar o IP puro.
- Roles: `user` e `admin`.
- Lockout por tentativas falhas de login.
- Hash de senha com scrypt.
- Middleware/proxy protege rotas `/admin`.
- Server actions administrativas também chamam `requireAdminUser()`.

## Arquitetura

Principais diretórios:

```text
app/                    Rotas App Router, layouts, pages e server actions por rota
components/             Componentes de UI, formulários, storefront e admin
lib/                    Regras de negócio, auth, Prisma, e-mail, S3 e helpers
lib/generated/prisma/   Prisma Client gerado
prisma/                 Schema e migrations
schemas/                Schemas Zod de formulários e payloads
store/                  Estado client-side, hoje carrinho
types/                  Tipos compartilhados
scripts/                Validações e scripts operacionais quando existirem
```

Padrão geral:

- Pages e layouts ficam em `app/`.
- Server actions específicas de rota ficam em `app/**/actions.ts`.
- Regras reutilizáveis ficam em `lib/`.
- Validação de entrada fica em `schemas/`.
- Persistência passa por Prisma, sem SQL raw nos fluxos principais.
- Componentes client-side são marcados com `"use client"`.
- Código server-only sensível usa `server-only` quando aplicável.

## Banco de dados

Banco principal: PostgreSQL.

Modelos principais:

- `User`: usuários, senha hash, role, lockout e status.
- `PasswordResetToken`: tokens hasheados e temporários de recuperação de senha.
- `SiteSetting`: configurações visuais em JSON.
- `OnboardingRateLimit`: contadores temporários de cadastro por identificador hasheado.
- `Category`: categorias com imagem opcional.
- `Product`: produtos, estoque, variações, destaque e soft delete.
- `ProductImage`: imagens ordenadas por produto.
- `NavigationItem`: links configuráveis por área.
- `Customer`: dados do cliente do checkout.
- `Order`: pedido com status `pending`, `paid` ou `canceled`.
- `OrderItem`: snapshot dos itens do pedido.

Migrations ficam em `prisma/migrations`.

Comandos:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Imagens e assets

As imagens são enviadas ao S3 e servidas pelo app via `/api/assets/[...key]`.

Controles mantidos:

- Bucket privado.
- Chaves geradas com `crypto.randomUUID()`.
- Prefixos permitidos:
  - `products/`
  - `site/login/`
  - `site/hero/`
  - `site/categories/`
- Bloqueio de `..` em chaves.
- Limite de 5 MB por imagem.
- Tipos aceitos: JPG, PNG, WebP, AVIF.
- URLs públicas internas apontam para `/api/assets/...`, não diretamente para S3.

## Checkout pelo WhatsApp

Fluxo atual:

1. Carrinho fica no cliente.
2. Checkout envia dados e itens para server action.
3. Servidor revalida produtos, disponibilidade, variações, cupons e preços pelo banco.
4. Pedido é criado como `pending`.
5. O app cria um link `wa.me` com a mensagem do pedido já preenchida.
6. Cliente finaliza disponibilidade, retirada e forma de pagamento no WhatsApp configurado.

Importante:

- O checkout público não deve baixar estoque antes de confirmação operacional do pedido.
- A baixa definitiva de estoque deve ficar em um fluxo administrativo/operacional após confirmação via atendimento.

## E-mail transacional

O único e-mail enviado pelo site é o de recuperação de senha.

Configuração Hostinger:

- `SMTP_HOST="smtp.hostinger.com"`
- `SMTP_PORT="465"`
- `SMTP_SECURE="true"`
- `SMTP_USER="suporte@lojavkstore.com.br"`
- `SMTP_PASSWORD`: senha da caixa de e-mail na Hostinger.
- `EMAIL_FROM="VK Store <suporte@lojavkstore.com.br>"`

## LGPD

O projeto inclui:

- Política de privacidade.
- Política de cookies.
- Termos de uso.
- Banner de consentimento de cookies.
- Aceite obrigatório de privacidade no checkout.
- Aceite obrigatório de privacidade no cadastro.
- Variáveis públicas para dados legais e contato do controlador/DPO.

Variáveis usadas:

- `NEXT_PUBLIC_LEGAL_NAME`
- `NEXT_PUBLIC_LEGAL_DOCUMENT`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_DPO_EMAIL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

## Boas práticas mantidas

- Validação de payloads com Zod.
- Server-side revalidation de dados sensíveis do checkout.
- Preços e produtos do checkout são reidratados do banco, não confiados do cliente.
- Server actions administrativas exigem `requireAdminUser()`.
- Middleware/proxy reforça proteção de `/admin`.
- Hash de senha com scrypt.
- Lockout básico de login por tentativas falhas.
- Prisma typed queries nos fluxos principais.
- Sem `dangerouslySetInnerHTML` nos fluxos revisados.
- Upload com allowlist de MIME, limite de tamanho e prefixos gerenciados.
- CTAs e badges respeitam `prefers-reduced-motion`, evitando animações para quem reduziu movimento no sistema.
- Navegação impede edição de destinos protegidos do sistema.
- Exclusões importantes pedem confirmação do usuário.
- Conteúdo legal e aceite de privacidade estão presentes nos fluxos de dados pessoais.
- Estoque não é decrementado no checkout público antes de confirmação operacional do pedido.

## Scripts operacionais

`package.json` referencia:

- `storage:ensure`
- `user:upsert`

No estado atual do workspace, os arquivos `scripts/ensure-storage.mjs` e `scripts/upsert-user.mjs` não estão versionados. Antes de depender desses comandos, recuperar ou recriar os scripts.

Script existente:

- `scripts/validate-checkout-stock-safety.mjs`: valida invariante de segurança do checkout, se restaurado.

## Pontos pendentes conhecidos

- Definir o fluxo administrativo para marcar pedidos como `paid` ou `canceled`.
- Definir o fluxo operacional para baixar estoque após confirmação pelo atendimento.
- Informar `SMTP_PASSWORD` em produção para ativar recuperação de senha.
- Definir rotina operacional para criação inicial de usuários admin.
- Revisar `DATABASE_SSL_REJECT_UNAUTHORIZED` para produção conforme o certificado usado pelo banco.
- Restaurar ou implementar scripts operacionais ausentes citados no `package.json`.

## Conversão e UX

Decisões aplicadas:

- Produto em oferta recebe badge com contraste controlado e movimento leve.
- Botões de adicionar ao carrinho, finalizar compra e ícone do carrinho têm pulso discreto para guiar a atenção.
- A página de produto usa galeria com imagem principal, miniaturas e navegação lateral.
- A galeria administrativa usa drag and drop e setas para mudar a ordem das fotos.
- A imagem do login usa `object-contain` para evitar corte em telas largas ou uploads de logo.
- Toasts confirmam ações sem bloquear o botão de carrinho.
- Variações aparecem no card do produto para o cliente avaliar tamanho/volume antes de abrir a página.

Referências usadas:

- Baymard Institute: listas de produtos, avaliação por thumbnails e galeria de imagens em e-commerce.
- Nielsen Norman Group: hierarquia visual e clareza de ação primária.
- Boas práticas de toast/snackbar: feedback deve ser breve e não cobrir controles importantes.

## Rotas principais

Públicas:

- `/`
- `/produtos`
- `/produto/[slug]`
- `/carrinho`
- `/checkout`
- `/login`
- `/esqueci-senha`
- `/redefinir-senha`
- `/conta`
- `/privacidade`
- `/cookies`
- `/termos`

Admin:

- `/admin`
- `/admin/produtos`
- `/admin/produtos/novo`
- `/admin/produtos/[id]/editar`
- `/admin/categorias`
- `/admin/navegacao`
- `/admin/aparencia`

API:

- `/api/assets/[...key]`
- `/api/auth/[...nextauth]`
