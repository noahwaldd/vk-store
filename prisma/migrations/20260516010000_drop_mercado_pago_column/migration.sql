-- Remove coluna legacy do Mercado Pago em orders
alter table "orders" drop column if exists "mercado_pago_preference_id";
