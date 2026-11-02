// Sales & Returns Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Sale, SaleCreate } from '~/types/api.generated'

export function createSaleService(client: AdminApiClient) {
  return {
    listSales: (params?: Record<string, unknown>) =>
      client.get<Sale[]>(API_ENDPOINTS.sales.base, params),

    getSale: (id: string) =>
      client.get<Sale>(API_ENDPOINTS.sales.detail(id)),

    createSale: (body: SaleCreate) =>
      client.post<Sale>(API_ENDPOINTS.sales.base, body),

    completeSale: (id: string, body?: unknown) =>
      client.post<Sale>(API_ENDPOINTS.sales.complete(id), body),

    cancelSale: (id: string) =>
      client.post(API_ENDPOINTS.sales.cancel(id)),

    listReturns: (params?: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.sales.returns, params),

    createReturn: (body: unknown) =>
      client.post(API_ENDPOINTS.sales.returns, body),
  }
}

