// Purchases Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PurchaseOrder } from '~/types/api.generated'

export function createPurchaseService(client: AdminApiClient) {
  return {
    listPurchases: (params?: Record<string, unknown>) =>
      client.get<PurchaseOrder[]>(API_ENDPOINTS.purchases.base, params),

    getPurchase: (id: string) =>
      client.get<PurchaseOrder>(API_ENDPOINTS.purchases.detail(id)),

    createPurchase: (body: unknown) =>
      client.post<PurchaseOrder>(API_ENDPOINTS.purchases.base, body),

    approvePurchase: (id: string) =>
      client.post(API_ENDPOINTS.purchases.approve(id)),

    cancelPurchase: (id: string) =>
      client.post(API_ENDPOINTS.purchases.cancel(id)),

    receiveGoods: (id: string, body: unknown) =>
      client.post(API_ENDPOINTS.purchases.receipts(id), body),
  }
}

