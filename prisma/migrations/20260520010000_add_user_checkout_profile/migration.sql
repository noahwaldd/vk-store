alter table "users"
  add column "checkout_name" text,
  add column "checkout_email" text,
  add column "checkout_phone" text,
  add column "checkout_cep" text,
  add column "checkout_address" text,
  add column "checkout_number" text,
  add column "checkout_city" text,
  add column "checkout_state" text,
  add column "legal_accepted_at" timestamptz(6);

update "users"
set
  "checkout_name" = coalesce(nullif("name", ''), nullif(trim(concat_ws(' ', "first_name", "last_name")), '')),
  "checkout_email" = "email",
  "checkout_phone" = "phone",
  "legal_accepted_at" = "created_at"
where "legal_accepted_at" is null;

create index "users_legal_accepted_at_idx" on "users"("legal_accepted_at");
