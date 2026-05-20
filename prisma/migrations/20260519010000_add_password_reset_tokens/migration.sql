create table if not exists "password_reset_tokens" (
  "id" uuid primary key default gen_random_uuid(),
  "user_id" uuid not null references "users"("id") on delete cascade,
  "token_hash" text not null,
  "expires_at" timestamptz(6) not null,
  "used_at" timestamptz(6),
  "created_at" timestamptz(6) not null default now(),
  constraint "password_reset_tokens_token_hash_sha256_chk" check (length("token_hash") = 64)
);

create unique index if not exists "password_reset_tokens_token_hash_key"
  on "password_reset_tokens"("token_hash");

create index if not exists "password_reset_tokens_user_created_idx"
  on "password_reset_tokens"("user_id", "created_at");

create index if not exists "password_reset_tokens_expires_at_idx"
  on "password_reset_tokens"("expires_at");

update "navigation_items"
set "label" = 'Finalizar pedido'
where "href" = '/checkout'
  and "label" = 'Checkout';

alter table "orders" drop column if exists "payment_provider";
alter table "orders" drop column if exists "payment_preference_id";

update "site_settings"
set "value" = jsonb_build_object(
  'enabled', true,
  'threshold', 0,
  'message', 'Atendimento pelo WhatsApp: segunda a sexta, 10:00-20:00; sábado, 10:00-18:00.'
)
where "key" = 'promo_banner'
  and coalesce("value"->>'message', '') ~* '(frete|entrega)';
