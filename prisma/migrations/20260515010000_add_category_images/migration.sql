alter table "categories"
  add column if not exists "image_url" text,
  add column if not exists "image_key" text;
