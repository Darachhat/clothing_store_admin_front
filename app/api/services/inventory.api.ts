// Inventory Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { InventoryStock, InventoryMovement } from '~/types/api.generated'

export function createInventoryService(client: AdminApiClient) {
  return {
    listStocks: (params?: Record<string, unknown>) =>
      client.get<InventoryStock[]>(API_ENDPOINTS.inventory.stocks, params),

    listMovements: (params?: Record<string, unknown>) =>
      client.get<InventoryMovement[]>(API_ENDPOINTS.inventory.movements, params),

    createAdjustment: (body: unknown) =>
      client.post(API_ENDPOINTS.inventory.adjustments, body),

    listTransfers: (params?: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.inventory.transfers, params),

    getTransfer: (id: string) =>
      client.get(API_ENDPOINTS.inventory.transferDetail(id)),

    createTransfer: (body: unknown) =>
      client.post(API_ENDPOINTS.inventory.transfers, body),

    approveTransfer: (id: string) =>
      client.post(API_ENDPOINTS.inventory.approveTransfer(id)),

    dispatchTransfer: (id: string) =>
      client.post(API_ENDPOINTS.inventory.dispatchTransfer(id)),

    receiveTransfer: (id: string) =>
      client.post(API_ENDPOINTS.inventory.receiveTransfer(id)),

    cancelTransfer: (id: string) =>
      client.post(API_ENDPOINTS.inventory.cancelTransfer(id)),
  }
}

