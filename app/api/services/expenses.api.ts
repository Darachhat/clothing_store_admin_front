// Expenses Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function createExpenseService(client: AdminApiClient) {
  return {
    listExpenses: (params?: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.expenses.base, params),

    createExpense: (body: unknown) =>
      client.post(API_ENDPOINTS.expenses.base, body),

    getExpense: (id: string) =>
      client.get(API_ENDPOINTS.expenses.detail(id)),

    updateExpense: (id: string, body: unknown) =>
      client.put(API_ENDPOINTS.expenses.detail(id), body),

    deleteExpense: (id: string) =>
      client.delete(API_ENDPOINTS.expenses.detail(id)),

    listCategories: () =>
      client.get(API_ENDPOINTS.expenses.categories),

    createCategory: (body: unknown) =>
      client.post(API_ENDPOINTS.expenses.categories, body),

    updateCategory: (id: string, body: unknown) =>
      client.put(API_ENDPOINTS.expenses.categoryDetail(id), body),

    deleteCategory: (id: string) =>
      client.delete(API_ENDPOINTS.expenses.categoryDetail(id)),

    getSummary: (params?: Record<string, unknown>) =>
      client.get(API_ENDPOINTS.expenses.summary, params),
  }
}

