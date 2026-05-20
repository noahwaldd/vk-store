create type "UserRole" as enum ('user', 'admin');

create table if not exists "users" (
  "id" uuid primary key default gen_random_uuid(),
  "email" text not null,
  "name" text,
  "password_hash" text not null,
  "role" "UserRole" not null default 'user',
  "failed_login_attempts" integer not null default 0 check ("failed_login_attempts" >= 0),
  "locked_until" timestamptz,
  "disabled_at" timestamptz,
  "last_login_at" timestamptz,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now(),
  constraint "users_email_lowercase_chk" check ("email" = lower("email")),
  constraint "users_password_hash_scrypt_chk" check ("password_hash" like 'scrypt$%')
);

create unique index if not exists "users_email_key" on "users"("email");
create index if not exists "users_role_idx" on "users"("role");
create index if not exists "users_locked_until_idx" on "users"("locked_until");
