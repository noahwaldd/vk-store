create extension if not exists "pgcrypto";

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text not null,
  price numeric(10, 2) not null check (price > 0),
  compare_at_price numeric(10, 2),
  stock integer not null default 0 check (stock >= 0),
  variations jsonb not null default '[]'::jsonb,
  featured boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt text,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (product_id, position)
);

create table if not exists navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  location text not null default 'primary' check (location in ('primary', 'secondary', 'footer')),
  position integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  document text,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'canceled')),
  total numeric(10, 2) not null default 0,
  mercado_pago_preference_id text,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price > 0),
  variation text,
  created_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on products(category_id);
create index if not exists products_deleted_at_idx on products(deleted_at);
create index if not exists products_active_created_at_idx
  on products(created_at desc)
  where deleted_at is null;
create index if not exists products_active_featured_idx
  on products(featured, created_at desc)
  where deleted_at is null;
create index if not exists products_active_category_idx
  on products(category_id, created_at desc)
  where deleted_at is null;
create index if not exists product_images_product_id_idx on product_images(product_id);
create index if not exists navigation_items_location_position_idx
  on navigation_items(location, position, label);
create index if not exists orders_customer_id_idx on orders(customer_id);
create index if not exists order_items_order_id_idx on order_items(order_id);

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table navigation_items enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

drop policy if exists "Public can read categories" on categories;
drop policy if exists "Public can read active products" on products;
drop policy if exists "Public can read active product images" on product_images;
drop policy if exists "Public can read enabled navigation items" on navigation_items;

create policy "Public can read categories"
  on categories
  for select
  to anon, authenticated
  using (true);

create policy "Public can read active products"
  on products
  for select
  to anon, authenticated
  using (deleted_at is null);

create policy "Public can read active product images"
  on product_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from products
      where products.id = product_images.product_id
        and products.deleted_at is null
    )
  );

create policy "Public can read enabled navigation items"
  on navigation_items
  for select
  to anon, authenticated
  using (enabled = true);

insert into categories (name, slug, description)
values
  ('Roupas', 'roupas', 'Camisetas, calças, jaquetas e peças casuais.'),
  ('Perfumes', 'perfumes', 'Fragrâncias masculinas, femininas e unissex.'),
  ('Acessórios', 'acessorios', 'Bonés, bolsas, carteiras, óculos e itens do dia a dia.')
on conflict (slug) do nothing;

insert into navigation_items (label, href, location, position, enabled)
values
  ('Produtos', '/produtos', 'primary', 10, true),
  ('Roupas', '/produtos?categoria=roupas', 'primary', 20, true),
  ('Perfumes', '/produtos?categoria=perfumes', 'primary', 30, true),
  ('Acessorios', '/produtos?categoria=acessorios', 'primary', 40, true),
  ('Roupas', '/produtos?categoria=roupas', 'secondary', 10, true),
  ('Perfumes', '/produtos?categoria=perfumes', 'secondary', 20, true),
  ('Acessorios', '/produtos?categoria=acessorios', 'secondary', 30, true),
  ('Promocoes', '/produtos', 'secondary', 90, true),
  ('Produtos', '/produtos', 'footer', 10, true),
  ('Carrinho', '/carrinho', 'footer', 20, true),
  ('Checkout', '/checkout', 'footer', 30, true),
  ('Login', '/login', 'footer', 40, true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
