// Branches & Warehouses Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Branch, Warehouse } from '~/types/api.generated'

export function createBranchService(client: AdminApiClient) {
  return {
    listBranches: () =>
      client.get<Branch[]>(API_ENDPOINTS.branches.base),

    createBranch: (body: { code: string; name: string; address?: string; phone?: string; email?: string }) =>
      client.post<Branch>(API_ENDPOINTS.branches.base, body),

    updateBranch: (id: string, body: Record<string, unknown>) =>
      client.patch<Branch>(API_ENDPOINTS.branches.detail(id), body),

    listWarehouses: (branchId?: string) =>
      client.get<Warehouse[]>(API_ENDPOINTS.branches.warehouses, branchId ? { branch_id: branchId } : undefined),

    createWarehouse: (body: { branch_id: string; name: string; location?: string; is_default?: boolean }) =>
      client.post<Warehouse>(API_ENDPOINTS.branches.warehouses, body),
  }
}

