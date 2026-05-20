alter table "categories"
  add column if not exists "position" integer not null default 0;

with ranked_categories as (
  select
    "id",
    row_number() over (order by "name" asc, "id" asc) as row_number
  from "categories"
)
update "categories" as category
set "position" = ranked_categories.row_number * 10
from ranked_categories
where category."id" = ranked_categories."id"
  and category."position" = 0;

create index if not exists "categories_position_name_idx"
  on "categories"("position", "name");

update "categories"
set
  "name" = 'Acessórios',
  "description" = 'Bonés, bolsas, carteiras, óculos e itens do dia a dia.'
where "slug" = 'acessorios';

update "navigation_items"
set "label" = 'Acessórios'
where "label" = 'Acessorios';

update "navigation_items"
set "label" = 'Promoções'
where "label" = 'Promocoes';
