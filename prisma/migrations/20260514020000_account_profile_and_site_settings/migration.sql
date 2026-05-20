alter table "users"
  add column if not exists "first_name" text,
  add column if not exists "last_name" text,
  add column if not exists "phone" text;

create index if not exists "users_phone_idx" on "users"("phone");

update "users"
set
  "first_name" = coalesce("first_name", nullif(split_part("name", ' ', 1), '')),
  "last_name" = coalesce(
    "last_name",
    nullif(trim(substring(coalesce("name", '') from length(split_part(coalesce("name", ''), ' ', 1)) + 1)), '')
  )
where "name" is not null;

create table if not exists "site_settings" (
  "key" text primary key,
  "value" jsonb not null,
  "updated_at" timestamptz not null default now()
);
