export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  image_key?: string | null;
  position: number;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  key?: string | null;
  alt?: string | null;
  position: number;
};

export type ProductVariation = {
  label: string;
  values: string[];
  stockByValue?: Record<string, number>;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category_id: string | null;
  category?: Category | null;
  stock: number;
  variations: ProductVariation[];
  images: ProductImage[];
  featured: boolean;
  is_offer: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProductInput = {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number | null;
  category_id: string;
  stock: number;
  variations?: ProductVariation[];
  featured?: boolean;
  is_offer?: boolean;
};
