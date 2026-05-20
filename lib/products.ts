export {
  getCategories,
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  getRelatedProducts,
  getProducts,
  getProductsPage,
  type ProductPage,
  type ProductQueryOptions,
  type ProductSort,
} from "@/lib/products/queries";

export {
  createProduct,
  parseProductPayload,
  restoreProduct,
  softDeleteProduct,
  updateProduct,
} from "@/lib/products/actions";
