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

// Translations CMS Types
export interface TranslationItem {
  id: string
  ref_id?: string
  schema_name: string
  table_name: string
  column_name: string
  en?: string | null
  km?: string | null
  cn?: string | null
  jp?: string | null
  kr?: string | null
  note?: string | null
  status_code: 'ACTIVE' | 'INACTIVE' | string
  created_datetime?: string
  updated_datetime?: string
}

export interface TranslationItemCreate {
  schema_name: string
  table_name: string
  column_name: string
  en?: string
  km?: string
  cn?: string
  jp?: string
  kr?: string
  note?: string
  status_code?: string
}

export interface TranslationItemUpdate {
  schema_name?: string
  table_name?: string
  column_name?: string
  en?: string
  km?: string
  cn?: string
  jp?: string
  kr?: string
  note?: string
  status_code?: string
}

export interface TranslationPagination {
  items: TranslationItem[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TranslationPurgeResult {
  status: string
  message: string
}

