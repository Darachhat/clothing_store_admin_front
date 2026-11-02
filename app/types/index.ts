// Centralized API Contract Types - Re-exported from Generated Backend OpenAPI Schemas
export * from './api.generated'

// Frontend-only View Models and Presentation Types
export interface PosTerminal {
  id: string
  branch_id: string
  warehouse_id: string
  code: string
  name: string
  status_code: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  last_active_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  branch?: {
    id: string
    name: string
    code: string
  }
  warehouse?: {
    id: string
    name: string
    code: string
  }
}

export interface PosTerminalCreate {
  branch_id: string
  warehouse_id: string
  code: string
  name: string
  notes?: string
}

export interface PosTerminalUpdate {
  warehouse_id?: string
  name?: string
  status_code?: string
  notes?: string
}

export interface DashboardData {
  period: string
  sales_count: number
  revenue: number
  gross_profit: number
  expenses: number
  net_profit: number
  low_stock_count: number
}
