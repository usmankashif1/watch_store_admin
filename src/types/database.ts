export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Brand = { id: number; name: string; logo_url: string | null; created_at: string | null };
export type Category = { id: number; name: string; description: string | null; created_at: string | null; image: string | null };
export type Collection = { id: number; name: string; description: string | null; created_at: string | null };

export type Product = {
  id: string;
  brand: string | null;
  name: string;
  short_name: string | null;
  price: number | null;
  image_url: string | null;
  strap: string | null;
  color: string | null;
  warranty: string | null;
  description: string | null;
  details: Json;
  specs: Json;
  created_at: string | null;
  brand_id: number | null;
  category_id: number | null;
  product_images: string[] | null;
};

export type ProductInput = Omit<Product, 'created_at'> & { collectionIds: number[] };
export type KeyValue = { label: string; value: string };