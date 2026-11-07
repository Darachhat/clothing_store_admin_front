// Centralized API Composable Facade for Admin Frontend
// Integrates with app/api/client and app/api/endpoints while preserving 100% backward compatibility
import { createAdminApiClient } from '~/api/client'
import { API_ENDPOINTS } from '~/api/endpoints'
import type {
  Product,
  ProductCreate,
  ProductUpdate,
  ProductVariant,
  ProductPagination,
  Sale,
  Category,
  Brand,
  Color,
  Size,
  Supplier,
  Customer,
  PurchaseOrder,
  User,
  Role,
  Permission,
  Branch,
  Warehouse,
  Promotion,
  AUDIT_LOG_RESPONSE_SCHEMA,
  DashboardData,
  PosTerminal,
  PosTerminalCreate,
  PosTerminalUpdate,
  TranslationItem,
  TranslationItemCreate,
  TranslationItemUpdate,
  TranslationPagination,
  TranslationPurgeResult,
} from '~/types'

export function useApi() {
  const client = createAdminApiClient()

  return {
    baseURL: client.baseURL,
    apiFetch: client.fetch,
    get: client.get,
    post: client.post,
    patch: client.patch,
    put: client.put,
    delete: client.delete,
  }
}

export function useProductApi() {
  const { apiFetch, baseURL } = useApi()

  return {
    listProducts: (params?: Record<string, unknown>) =>
      apiFetch<ProductPagination>(API_ENDPOINTS.products.base, { params, query: params }),
    getProduct: (id: string) =>
      apiFetch<Product>(API_ENDPOINTS.products.detail(id)),
    createProduct: (body: ProductCreate | unknown) =>
      apiFetch<Product>(API_ENDPOINTS.products.base, { method: 'POST', body: body as any }),
    updateProduct: (id: string, body: ProductUpdate | unknown) =>
      apiFetch<Product>(API_ENDPOINTS.products.detail(id), { method: 'PUT', body: body as any }),
    deleteProduct: (id: string) =>
      apiFetch(API_ENDPOINTS.products.detail(id), { method: 'DELETE' }),
    getVariants: (productId: string) =>
      apiFetch<ProductVariant[]>(API_ENDPOINTS.products.variants(productId)),
    getVariantQr: (variantId: string, format: 'png' | 'svg' = 'svg') =>
      `${baseURL}${API_ENDPOINTS.products.qr(variantId, format)}`,
    getVariantBarcode: (variantId: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${baseURL}${API_ENDPOINTS.products.barcode(variantId, format, writeText)}`,
    searchByQr: (ref: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.byQr(ref)),
    searchByBarcode: (barcode: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.byBarcode(barcode)),
    searchBySku: (sku: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.bySku(sku)),
  }
}

export function useSaleApi() {
  const { apiFetch } = useApi()

  return {
    listSales: (params?: Record<string, unknown>) =>
      apiFetch<Sale[]>(API_ENDPOINTS.sales.base, { params, query: params }),
    getSale: (id: string) =>
      apiFetch<Sale>(API_ENDPOINTS.sales.detail(id)),
    createSale: (body: unknown) =>
      apiFetch<Sale>(API_ENDPOINTS.sales.base, { method: 'POST', body: body as any }),
    completeSale: (id: string, body?: unknown) =>
      apiFetch<Sale>(API_ENDPOINTS.sales.complete(id), { method: 'POST', body: body as any }),
    cancelSale: (id: string) =>
      apiFetch(API_ENDPOINTS.sales.cancel(id), { method: 'POST' }),
    listReturns: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.sales.returns, { params, query: params }),
    createReturn: (body: unknown) =>
      apiFetch(API_ENDPOINTS.sales.returns, { method: 'POST', body: body as any }),
  }
}

export function useInventoryApi() {
  const { apiFetch } = useApi()

  return {
    listStocks: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.stocks, { params, query: params }),
    listStock: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.stocks, { params, query: params }),
    listMovements: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.movements, { params, query: params }),
    createAdjustment: (body: unknown) =>
      apiFetch(API_ENDPOINTS.inventory.adjustments, { method: 'POST', body: body as any }),
    listTransfers: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.inventory.transfers, { params, query: params }),
    createTransfer: (body: unknown) =>
      apiFetch(API_ENDPOINTS.inventory.transfers, { method: 'POST', body: body as any }),
    approveTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.approveTransfer(id), { method: 'POST' }),
    dispatchTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.dispatchTransfer(id), { method: 'POST' }),
    receiveTransfer: (id: string, body?: unknown) =>
      apiFetch(API_ENDPOINTS.inventory.receiveTransfer(id), { method: 'POST', ...(body ? { body: body as any } : {}) }),
    cancelTransfer: (id: string) =>
      apiFetch(API_ENDPOINTS.inventory.cancelTransfer(id), { method: 'POST' }),
  }
}

export function useReportApi() {
  const { apiFetch } = useApi()

  return {
    getDashboard: (period?: string) =>
      apiFetch<DashboardData>(API_ENDPOINTS.reports.dashboard, { params: { period }, query: { period } }),
    getSalesReport: (params: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.sales, { params, query: params }),
    getInventoryReport: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.inventory, params ? { params, query: params } : undefined),
    getPurchasesReport: (params: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.purchases, { params, query: params }),
    getProfitReport: (params: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.reports.profit, { params, query: params }),
  }
}

export function useCatalogApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: (params?: Record<string, unknown>) =>
      apiFetch<Category[]>(API_ENDPOINTS.catalog.categories, { params, query: params }),
    createCategory: (body: unknown) =>
      apiFetch<Category>(API_ENDPOINTS.catalog.categories, { method: 'POST', body: body as any }),
    updateCategory: (id: string, body: unknown) =>
      apiFetch<Category>(API_ENDPOINTS.catalog.categoryDetail(id), { method: 'PUT', body: body as any }),
    deleteCategory: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.categoryDetail(id), { method: 'DELETE' }),

    listBrands: (params?: Record<string, unknown>) =>
      apiFetch<Brand[]>(API_ENDPOINTS.catalog.brands, { params, query: params }),
    createBrand: (body: unknown) =>
      apiFetch<Brand>(API_ENDPOINTS.catalog.brands, { method: 'POST', body: body as any }),
    updateBrand: (id: string, body: unknown) =>
      apiFetch<Brand>(API_ENDPOINTS.catalog.brandDetail(id), { method: 'PUT', body: body as any }),
    deleteBrand: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.brandDetail(id), { method: 'DELETE' }),

    listColors: (params?: Record<string, unknown>) =>
      apiFetch<Color[]>(API_ENDPOINTS.catalog.colors, { params, query: params }),
    createColor: (body: unknown) =>
      apiFetch<Color>(API_ENDPOINTS.catalog.colors, { method: 'POST', body: body as any }),
    updateColor: (id: string, body: unknown) =>
      apiFetch<Color>(API_ENDPOINTS.catalog.colorDetail(id), { method: 'PUT', body: body as any }),
    deleteColor: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.colorDetail(id), { method: 'DELETE' }),

    listSizes: (params?: Record<string, unknown>) =>
      apiFetch<Size[]>(API_ENDPOINTS.catalog.sizes, { params, query: params }),
    createSize: (body: unknown) =>
      apiFetch<Size>(API_ENDPOINTS.catalog.sizes, { method: 'POST', body: body as any }),
    updateSize: (id: string, body: unknown) =>
      apiFetch<Size>(API_ENDPOINTS.catalog.sizeDetail(id), { method: 'PUT', body: body as any }),
    deleteSize: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.sizeDetail(id), { method: 'DELETE' }),
  }
}

export function useVariantApi() {
  const { apiFetch, baseURL } = useApi()

  return {
    listVariants: (params?: Record<string, unknown>) =>
      apiFetch<ProductVariant[]>(API_ENDPOINTS.products.base + '/variants', { params, query: params }),
    getVariant: (id: string) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.variantDetail(id)),
    createVariant: (body: unknown) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.base + '/variants', { method: 'POST', body: body as any }),
    updateVariant: (id: string, body: unknown) =>
      apiFetch<ProductVariant>(API_ENDPOINTS.products.variantDetail(id), { method: 'PUT', body: body as any }),
    deleteVariant: (id: string) =>
      apiFetch(API_ENDPOINTS.products.variantDetail(id), { method: 'DELETE' }),
    getQrUrl: (id: string, format: 'png' | 'svg' = 'svg') =>
      `${baseURL}${API_ENDPOINTS.products.qr(id, format)}`,
    getBarcodeUrl: (id: string, format: 'png' | 'svg' = 'svg', writeText = false) =>
      `${baseURL}${API_ENDPOINTS.products.barcode(id, format, writeText)}`,
  }
}

export function useCustomerApi() {
  const { apiFetch } = useApi()

  return {
    listCustomers: (params?: Record<string, unknown>) =>
      apiFetch<Customer[]>(API_ENDPOINTS.customers.base, { params, query: params }),
    getCustomer: (id: string) =>
      apiFetch<Customer>(API_ENDPOINTS.customers.detail(id)),
    createCustomer: (body: unknown) =>
      apiFetch<Customer>(API_ENDPOINTS.customers.base, { method: 'POST', body: body as any }),
    updateCustomer: (id: string, body: unknown) =>
      apiFetch<Customer>(API_ENDPOINTS.customers.detail(id), { method: 'PUT', body: body as any }),
    adjustPoints: (id: string, body: { points: number; note?: string; reference_type?: string; reference_id?: string }) =>
      apiFetch(API_ENDPOINTS.customers.adjustPoints(id), { method: 'POST', body }),
  }
}

export function useSupplierApi() {
  const { apiFetch } = useApi()

  return {
    listSuppliers: (params?: Record<string, unknown>) =>
      apiFetch<Supplier[]>(API_ENDPOINTS.catalog.suppliers, { params, query: params }),
    getSupplier: (id: string) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id)),
    createSupplier: (body: unknown) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.suppliers, { method: 'POST', body: body as any }),
    updateSupplier: (id: string, body: unknown) =>
      apiFetch<Supplier>(API_ENDPOINTS.catalog.supplierDetail(id), { method: 'PUT', body: body as any }),
    deleteSupplier: (id: string) =>
      apiFetch(API_ENDPOINTS.catalog.supplierDetail(id), { method: 'DELETE' }),
  }
}

export function usePurchaseApi() {
  const { apiFetch } = useApi()

  return {
    listOrders: (params?: Record<string, unknown>) =>
      apiFetch<PurchaseOrder[]>(API_ENDPOINTS.purchases.base, { params, query: params }),
    listPurchases: (params?: Record<string, unknown>) =>
      apiFetch<PurchaseOrder[]>(API_ENDPOINTS.purchases.base, { params, query: params }),
    getOrder: (id: string) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id)),
    getPurchase: (id: string) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id)),
    createOrder: (body: unknown) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.base, { method: 'POST', body: body as any }),
    createPurchase: (body: unknown) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.base, { method: 'POST', body: body as any }),
    updateOrder: (id: string, body: unknown) =>
      apiFetch<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id), { method: 'PATCH', body: body as any }),
    approveOrder: (id: string) =>
      apiFetch(API_ENDPOINTS.purchases.approve(id), { method: 'POST' }),
    cancelOrder: (id: string) =>
      apiFetch(API_ENDPOINTS.purchases.cancel(id), { method: 'POST' }),
    cancelPurchase: (id: string) =>
      apiFetch(API_ENDPOINTS.purchases.cancel(id), { method: 'POST' }),
    listReceipts: (orderId: string) =>
      apiFetch(API_ENDPOINTS.purchases.receipts(orderId)),
    createReceipt: (body: unknown) =>
      apiFetch('/api/admin/v1/purchases/receipts', { method: 'POST', body: body as any }),
    receivePurchase: (orderId: string, body: any) =>
      apiFetch('/api/admin/v1/purchases/receipts', {
        method: 'POST',
        body: { purchase_order_id: orderId, ...(body || {}) },
      }),
  }
}

export function useExpenseApi() {
  const { apiFetch } = useApi()

  return {
    listCategories: () =>
      apiFetch(API_ENDPOINTS.expenses.categories),
    createCategory: (body: unknown) =>
      apiFetch(API_ENDPOINTS.expenses.categories, { method: 'POST', body: body as any }),
    updateCategory: (id: string, body: unknown) =>
      apiFetch(API_ENDPOINTS.expenses.categoryDetail(id), { method: 'PUT', body: body as any }),
    listExpenses: (params?: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.expenses.base, { params, query: params }),
    getExpense: (id: string) =>
      apiFetch(API_ENDPOINTS.expenses.detail(id)),
    createExpense: (body: unknown) =>
      apiFetch(API_ENDPOINTS.expenses.base, { method: 'POST', body: body as any }),
    updateExpense: (id: string, body: unknown) =>
      apiFetch(API_ENDPOINTS.expenses.detail(id), { method: 'PUT', body: body as any }),
    approveExpense: (id: string) =>
      apiFetch(API_ENDPOINTS.expenses.detail(id) + '/approve', { method: 'POST' }),
    rejectExpense: (id: string) =>
      apiFetch(API_ENDPOINTS.expenses.detail(id) + '/reject', { method: 'POST' }),
  }
}

export function usePromotionApi() {
  const { apiFetch } = useApi()

  return {
    listPromotions: (params?: Record<string, unknown>) =>
      apiFetch<Promotion[]>(API_ENDPOINTS.promotions.base, { params, query: params }),
    validateCoupon: (body: { code: string; cart_total: number }) =>
      apiFetch(API_ENDPOINTS.promotions.validate, { method: 'POST', body }),
    getPromotion: (id: string) =>
      apiFetch<Promotion>(API_ENDPOINTS.promotions.detail(id)),
    createPromotion: (body: unknown) =>
      apiFetch<Promotion>(API_ENDPOINTS.promotions.base, { method: 'POST', body: body as any }),
    updatePromotion: (id: string, body: unknown) =>
      apiFetch<Promotion>(API_ENDPOINTS.promotions.detail(id), { method: 'PUT', body: body as any }),
    deletePromotion: (id: string) =>
      apiFetch(API_ENDPOINTS.promotions.detail(id), { method: 'DELETE' }),
  }
}

export function useLabelApi() {
  const { apiFetch } = useApi()

  return {
    generateLabels: (body: unknown) =>
      apiFetch<Blob>(API_ENDPOINTS.labels.generate, { method: 'POST', body: body as any, responseType: 'blob' as any }),
    downloadLabels: (body: unknown) =>
      apiFetch<Blob>(API_ENDPOINTS.labels.generate, { method: 'POST', body: body as any, responseType: 'blob' as any }),
  }
}

export function useUserApi() {
  const { apiFetch } = useApi()

  return {
    listUsers: (params?: Record<string, unknown>) =>
      apiFetch<User[]>(API_ENDPOINTS.users.base, { params, query: params }),
    getUser: (id: string) =>
      apiFetch<User>(API_ENDPOINTS.users.detail(id)),
    createUser: (body: unknown) =>
      apiFetch<User>(API_ENDPOINTS.users.base, { method: 'POST', body: body as any }),
    updateUser: (id: string, body: unknown) =>
      apiFetch<User>(API_ENDPOINTS.users.detail(id), { method: 'PATCH', body: body as any }),
    deleteUser: (id: string) =>
      apiFetch(API_ENDPOINTS.users.detail(id), { method: 'DELETE' }),
    activateUser: (id: string) =>
      apiFetch<User>(API_ENDPOINTS.users.activate(id), { method: 'POST', body: {} as any }),
    getUserRoleHistory: (id: string, limit = 50) =>
      apiFetch<any[]>(API_ENDPOINTS.users.roleHistory(id), { params: { limit }, query: { limit } }),
    listRoles: () =>
      apiFetch<Role[]>(API_ENDPOINTS.users.roles),
    createRole: (body: unknown) =>
      apiFetch<Role>(API_ENDPOINTS.users.roles, { method: 'POST', body: body as any }),
    updateRole: (id: string, body: unknown) =>
      apiFetch<Role>(API_ENDPOINTS.users.roleDetail(id), { method: 'PATCH', body: body as any }),
    listPermissions: () =>
      apiFetch<Permission[]>(API_ENDPOINTS.users.permissions),
  }
}

export function useBranchApi() {
  const { apiFetch } = useApi()

  return {
    listBranches: () =>
      apiFetch<Branch[]>(API_ENDPOINTS.branches.base),
    updateBranch: (id: string, body: Record<string, unknown>) =>
      apiFetch(API_ENDPOINTS.branches.detail(id), { method: 'PATCH', body }),
    createBranch: (body: { code: string; name: string; address?: string; phone?: string; email?: string }) =>
      apiFetch(API_ENDPOINTS.branches.base, { method: 'POST', body }),
    listWarehouses: (branchId?: string) =>
      apiFetch<Warehouse[]>(API_ENDPOINTS.branches.warehouses, branchId ? { params: { branch_id: branchId }, query: { branch_id: branchId } } : undefined),
    createWarehouse: (body: { branch_id: string; name: string; location?: string; is_default?: boolean }) =>
      apiFetch(API_ENDPOINTS.branches.warehouses, { method: 'POST', body }),
    updateWarehouse: (id: string, body: Record<string, unknown>) =>
      apiFetch(`/api/admin/v1/warehouses/${id}`, { method: 'PATCH', body }),
  }
}

export function useAuditApi() {
  const { apiFetch } = useApi()

  return {
    listAuditLogs: (params?: {
      action?: string
      entity_type?: string
      user_id?: string
      skip?: number
      limit?: number
    }) => apiFetch<AUDIT_LOG_RESPONSE_SCHEMA[]>(API_ENDPOINTS.audit.logs, { params, query: params }),
  }
}

export function useTelegramSystemApi() {
  const { apiFetch } = useApi()

  return {
    listBots: () => apiFetch<any>(API_ENDPOINTS.system.bots),
    getBot: (id: string) => apiFetch<any>(API_ENDPOINTS.system.botDetail(id)),
    createBot: (body: { code: string; name: string; username?: string; token?: string; status_code?: string; description?: string }) =>
      apiFetch<any>(API_ENDPOINTS.system.bots, { method: 'POST', body }),
    updateBot: (id: string, body: { name?: string; username?: string; token?: string; status_code?: string; description?: string }) =>
      apiFetch<any>(API_ENDPOINTS.system.botDetail(id), { method: 'PUT', body }),
    deleteBot: (id: string) =>
      apiFetch<any>(API_ENDPOINTS.system.botDetail(id), { method: 'DELETE' }),

    listChats: (params?: { search?: string; telegram_bot_code?: string; status_code?: string; page?: number; size?: number }) =>
      apiFetch<any>(API_ENDPOINTS.system.chats, { params, query: params }),
    getChat: (id: string) => apiFetch<any>(API_ENDPOINTS.system.chatDetail(id)),
    createChat: (body: { code: string; telegram_bot_code: string; name: string; chat_type?: string; chat_id: string; thread_id?: string; description?: string; status_code?: string }) =>
      apiFetch<any>(API_ENDPOINTS.system.chats, { method: 'POST', body }),
    updateChat: (id: string, body: { telegram_bot_code?: string; name?: string; chat_type?: string; chat_id?: string; thread_id?: string; description?: string; status_code?: string }) =>
      apiFetch<any>(API_ENDPOINTS.system.chatDetail(id), { method: 'PUT', body }),
    deleteChat: (id: string) =>
      apiFetch<any>(API_ENDPOINTS.system.chatDetail(id), { method: 'DELETE' }),

    sendTestMessage: (body: { chat_code?: string; text?: string; chat_id?: string; message?: string; parse_mode?: string }) => {
      const payload = {
        chat_code: body.chat_code || 'clothing_store_alerts',
        text: body.text || body.message || '',
        parse_mode: body.parse_mode || 'HTML',
      }
      return apiFetch<any>(API_ENDPOINTS.system.sendTelegram, { method: 'POST', body: payload })
    },
    listSystemLogs: (params?: { limit?: number; offset?: number }) =>
      apiFetch<any>(API_ENDPOINTS.system.systemLogs, { params, query: params }),
    listTelegramOutboundLogs: (params?: { limit?: number }) =>
      apiFetch<any>(API_ENDPOINTS.system.telegramLogs, { params, query: params }),
  }
}

export function usePaymentGatewayApi() {
  const { apiFetch } = useApi()

  return {
    getConfig: () => apiFetch<any>(API_ENDPOINTS.system.paymentGateway),
    updateConfig: (body: Record<string, any>) =>
      apiFetch<any>(API_ENDPOINTS.system.paymentGateway, { method: 'PUT', body }),
    testConnection: () =>
      apiFetch<any>(API_ENDPOINTS.system.paymentGatewayTest, { method: 'POST' }),
  }
}

export function useTerminalApi() {
  const { apiFetch } = useApi()

  return {
    listTerminals: (params?: { branch_id?: string; status_code?: string }) =>
      apiFetch<PosTerminal[]>(API_ENDPOINTS.terminals.base, { params, query: params }),
    getTerminal: (id: string) =>
      apiFetch<PosTerminal>(API_ENDPOINTS.terminals.detail(id)),
    createTerminal: (body: PosTerminalCreate) =>
      apiFetch<PosTerminal>(API_ENDPOINTS.terminals.base, { method: 'POST', body }),
    updateTerminal: (id: string, body: PosTerminalUpdate) =>
      apiFetch<PosTerminal>(API_ENDPOINTS.terminals.detail(id), { method: 'PUT', body }),
    deleteTerminal: (id: string) =>
      apiFetch<{ message: string }>(API_ENDPOINTS.terminals.detail(id), { method: 'DELETE' }),
    heartbeat: (id: string) =>
      apiFetch<PosTerminal>(API_ENDPOINTS.terminals.heartbeat(id), { method: 'POST' }),
  }
}

export function useShiftApi() {
  const { apiFetch } = useApi()

  return {
    listShifts: (params?: {
      terminal_id?: string
      cashier_id?: string
      status_code?: string
      skip?: number
      limit?: number
    }) => apiFetch<any[]>(API_ENDPOINTS.shifts.base, { params, query: params }),
    getShift: (id: string) =>
      apiFetch<any>(API_ENDPOINTS.shifts.detail(id)),
    getShiftSummary: (id: string) =>
      apiFetch<any>(API_ENDPOINTS.shifts.summary(id)),
    closeShift: (
      id: string,
      body: { closing_cash_usd: number; closing_cash_khr?: number; notes?: string },
    ) => apiFetch<any>(API_ENDPOINTS.shifts.close(id), { method: 'POST', body }),
  }
}

export function useSystemSettingsApi() {
  const { apiFetch } = useApi()

  return {
    getCategorySettings: (category: string) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.category(category)),
    updateCategorySettings: (category: string, settings: Record<string, any>) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.category(category), {
        method: 'PUT',
        body: settings,
      }),
    getStoreSettings: () =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.store),
    updateStoreSettings: (settings: Record<string, any>) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.store, {
        method: 'PUT',
        body: settings,
      }),
    getReceiptSettings: () =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.receipt),
    updateReceiptSettings: (settings: Record<string, any>) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.receipt, {
        method: 'PUT',
        body: settings,
      }),
    getBrandSettings: () =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.brand),
    getPublicBrandSettings: () =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.brandPublic),
    updateBrandSettings: (settings: Record<string, any>) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.brand, {
        method: 'PUT',
        body: settings,
      }),
    uploadBrandLogo: (formData: FormData) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.settings.uploadLogo, {
        method: 'POST',
        body: formData,
      }),
  }
}

export function useTranslationsApi() {
  const { apiFetch } = useApi()

  return {
    getPublicTranslations: (params?: { lang?: string; schema_name?: string }) =>
      apiFetch<Record<string, any>>(API_ENDPOINTS.translations.base, { params, query: params }),
    listItems: (params?: {
      q?: string
      schema_name?: string
      table_name?: string
      status_code?: string
      page?: number
      page_size?: number
    }) => apiFetch<TranslationPagination>(API_ENDPOINTS.translations.items, { params, query: params }),
    getItem: (id: string) =>
      apiFetch<TranslationItem>(API_ENDPOINTS.translations.itemDetail(id)),
    createItem: (body: TranslationItemCreate) =>
      apiFetch<TranslationItem>(API_ENDPOINTS.translations.items, {
        method: 'POST',
        body,
      }),
    updateItem: (id: string, body: TranslationItemUpdate) =>
      apiFetch<TranslationItem>(API_ENDPOINTS.translations.itemDetail(id), {
        method: 'PUT',
        body,
      }),
    deleteItem: (id: string) =>
      apiFetch(API_ENDPOINTS.translations.itemDetail(id), {
        method: 'DELETE',
      }),
    purgeCache: () =>
      apiFetch<TranslationPurgeResult>(API_ENDPOINTS.translations.purgeCache, {
        method: 'POST',
      }),
    seedTranslations: () =>
      apiFetch<{ status: string; seeded_count: number }>(API_ENDPOINTS.translations.seed, {
        method: 'POST',
      }),
  }
}

