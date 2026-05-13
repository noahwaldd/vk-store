import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageUrl =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ??
  (supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : undefined);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const hasSupabaseAdmin = Boolean(supabaseUrl && supabaseServiceRoleKey);
export const productImagesBucket =
  process.env.NEXT_PUBLIC_PRODUCT_IMAGES_BUCKET ?? "product-images";
export const supabaseStorageUrl = storageUrl;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const supabaseAdmin = hasSupabaseAdmin
  ? createClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  : null;

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Erro interno: a conexão com o Supabase não foi inicializada corretamente.",
    );
  }

  return supabaseAdmin;
}
