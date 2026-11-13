// Catalog Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  CATEGORY_MODEL,
  CategoryCreate,
  CategoryUpdate,
  BRAND_MODEL,
  BrandCreate,
  BrandUpdate,
  Color,
  ColorCreate,
  ColorUpdate,
  Size,
  Supplier,
} from '~/types/api.generated'

export function createCatalogService(client: AdminApiClient) {
  return {
    // Categories
    listCategories: (params?: Record<string, unknown>) =>
      client.get<CATEGORY_MODEL[]>(API_ENDPOINTS.catalog.categories, params),
    getCategory: (id: string) =>
      client.get<CATEGORY_MODEL>(API_ENDPOINTS.catalog.categoryDetail(id)),
    createCategory: (body: CategoryCreate) =>
      client.post<CATEGORY_MODEL>(API_ENDPOINTS.catalog.categories, body),
    updateCategory: (id: string, body: CategoryUpdate) =>
      client.put<CATEGORY_MODEL>(API_ENDPOINTS.catalog.categoryDetail(id), body),
    deleteCategory: (id: string) =>
      client.delete(API_ENDPOINTS.catalog.categoryDetail(id)),

    // Brands
    listBrands: (params?: Record<string, unknown>) =>
      client.get<BRAND_MODEL[]>(API_ENDPOINTS.catalog.brands, params),
    getBrand: (id: string) =>
      client.get<BRAND_MODEL>(API_ENDPOINTS.catalog.brandDetail(id)),
    createBrand: (body: BrandCreate) =>
      client.post<BRAND_MODEL>(API_ENDPOINTS.catalog.brands, body),
    updateBrand: (id: string, body: BrandUpdate) =>
      client.put<BRAND_MODEL>(API_ENDPOINTS.catalog.brandDetail(id), body),
    deleteBrand: (id: string) =>
      client.delete(API_ENDPOINTS.catalog.brandDetail(id)),

    // Colors
    listColors: (params?: Record<string, unknown>) =>
      client.get<Color[]>(API_ENDPOINTS.catalog.colors, params),
    createColor: (body: ColorCreate) =>
      client.post<Color>(API_ENDPOINTS.catalog.colors, body),
    updateColor: (id: string, body: ColorUpdate) =>
      client.put<Color>(API_ENDPOINTS.catalog.colorDetail(id), body),
    deleteColor: (id: string) =>
      client.delete(API_ENDPOINTS.catalog.colorDetail(id)),

    // Sizes
    listSizes: (params?: Record<string, unknown>) =>
      client.get<Size[]>(API_ENDPOINTS.catalog.sizes, params),
    createSize: (body: unknown) =>
      client.post<Size>(API_ENDPOINTS.catalog.sizes, body),
    updateSize: (id: string, body: unknown) =>
      client.put<Size>(API_ENDPOINTS.catalog.sizeDetail(id), body),
    deleteSize: (id: string) =>
      client.delete(API_ENDPOINTS.catalog.sizeDetail(id)),

    // Suppliers
    listSuppliers: (params?: Record<string, unknown>) =>
      client.get<Supplier[]>(API_ENDPOINTS.catalog.suppliers, params),
    getSupplier: (id: string) =>
      client.get<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id)),
    createSupplier: (body: unknown) =>
      client.post<Supplier>(API_ENDPOINTS.catalog.suppliers, body),
    updateSupplier: (id: string, body: unknown) =>
      client.put<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id), body),
    deleteSupplier: (id: string) =>
      client.delete(API_ENDPOINTS.catalog.supplierDetail(id)),
  }
}

