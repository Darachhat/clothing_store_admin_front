// Customers Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Customer, CustomerCreate, CustomerUpdate } from '~/types/api.generated'

export function createCustomerService(client: AdminApiClient) {
  return {
    listCustomers: (params?: Record<string, unknown>) =>
      client.get<Customer[]>(API_ENDPOINTS.customers.base, params),

    getCustomer: (id: string) =>
      client.get<Customer>(API_ENDPOINTS.customers.detail(id)),

    createCustomer: (body: CustomerCreate) =>
      client.post<Customer>(API_ENDPOINTS.customers.base, body),

    updateCustomer: (id: string, body: CustomerUpdate) =>
      client.put<Customer>(API_ENDPOINTS.customers.detail(id), body),

    getLoyalty: (id: string) =>
      client.get(API_ENDPOINTS.customers.loyalty(id)),

    adjustPoints: (id: string, body: { points: number; note?: string; reference_type?: string; reference_id?: string }) =>
      client.post(API_ENDPOINTS.customers.adjustPoints(id), body),
  }
}

