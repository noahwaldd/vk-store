import type { Product } from "@/types/product";

export type CartItem = {
  product: Pick<
    Product,
    | "id"
    | "name"
    | "slug"
    | "price"
    | "stock"
    | "images"
    | "category_id"
    | "compare_at_price"
  >;
  quantity: number;
  variation?: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  document?: string | null;
};

export type OrderStatus = "pending" | "paid" | "canceled";

export type Order = {
  id: string;
  customer_id: string;
  status: OrderStatus;
  total: number;
  created_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  variation?: string | null;
};
