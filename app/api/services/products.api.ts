// Products Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductVariant,
  ProductVariantCreate,
  ProductVariantUpdate,
  ProductPagination,
} from '~/types/api.generated'

export function createProductService(client: AdminApiClient) {
  return {
    listProducts: (params?: Record<string, unknown>) =>
      client.get<ProductPagination>(API_ENDPOINTS.products.base, params),

    getProduct: (id: string) =>
      client.get<Product>(API_ENDPOINTS.products.detail(id)),

    createProduct: (body: ProductCreate) =>
      client.post<Product>(API_ENDPOINTS.products.base, body),

    updateProduct: (id: string, body: ProductUpdate) =>
      client.put<Product>(API_ENDPOINTS.products.detail(id), body),

    deleteProduct: (id: string) =>
      client.delete(API_ENDPOINTS.products.detail(id)),

    getVariants: (productId: string) =>
      client.get<ProductVariant[]>(API_ENDPOINTS.products.variants(productId)),

    getVariant: (variantId: string) =>
      client.get<ProductVariant>(API_ENDPOINTS.products.variantDetail(variantId)),

    createVariant: (productId: string, body: ProductVariantCreate) =>
      client.post<ProductVariant>(API_ENDPOINTS.products.variants(productId), body),

    updateVariant: (variantId: string, body: ProductVariantUpdate) =>
      client.put<ProductVariant>(API_ENDPOINTS.products.variantDetail(variantId), body),

    deleteVariant: (variantId: string) =>
      client.delete(API_ENDPOINTS.products.variantDetail(variantId)),

    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${client.baseURL}${API_ENDPOINTS.products.qr(variantId, format)}`,

    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${client.baseURL}${API_ENDPOINTS.products.barcode(variantId, format, writeText)}`,

    searchByQr: (ref: string) =>
      client.get<ProductVariant>(API_ENDPOINTS.products.byQr(ref)),

    searchByBarcode: (barcode: string) =>
      client.get<ProductVariant>(API_ENDPOINTS.products.byBarcode(barcode)),

    searchBySku: (sku: string) =>
      client.get<ProductVariant>(API_ENDPOINTS.products.bySku(sku)),
  }
}

