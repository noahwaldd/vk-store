create table if not exists "onboarding_rate_limits" (
  "id" text primary key,
  "scope" text not null,
  "identifier_hash" text not null,
  "count" integer not null default 0,
  "reset_at" timestamptz not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create index if not exists "onboarding_rate_limits_scope_identifier_reset_idx"
  on "onboarding_rate_limits"("scope", "identifier_hash", "reset_at");

create index if not exists "onboarding_rate_limits_reset_at_idx"
  on "onboarding_rate_limits"("reset_at");
