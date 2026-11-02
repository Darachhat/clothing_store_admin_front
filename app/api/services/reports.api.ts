// Reports Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { DashboardData } from '~/types'

export function createReportService(client: AdminApiClient) {
  return {
    getDashboard: (period?: string) =>
      client.get<DashboardData>(API_ENDPOINTS.reports.dashboard, { period }),

    getSalesReport: (params: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.reports.sales, params),

    getInventoryReport: (params: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.reports.inventory, params),

    getPurchasesReport: (params: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.reports.purchases, params),

    getProfitReport: (params: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.reports.profit, params),
  }
}

