alter table "products"
  add column if not exists "is_offer" boolean not null default false;

create index if not exists "products_is_offer_created_at_idx"
  on "products"("is_offer", "created_at");
