// Centralized API Contract Types - Re-exported from Generated Backend OpenAPI Schemas
import type {
  BRAND_RESPONSE_SCHEMA,
  CATEGORY_RESPONSE_SCHEMA,
  CUSTOMER_RESPONSE_SCHEMA,
  PRODUCT_WITH_VARIANTS_SCHEMA,
  PRODUCT_VARIANT_RESPONSE_SCHEMA,
  PURCHASE_ORDER_RESPONSE_SCHEMA,
} from './api.generated'

export * from './api.generated'

export type Brand = BRAND_RESPONSE_SCHEMA & {
  code?: string
}

export type Category = CATEGORY_RESPONSE_SCHEMA & {
  code?: string
}

export type Customer = CUSTOMER_RESPONSE_SCHEMA & {
  code?: string
  full_name?: string
  loyalty_points?: number
  total_spent?: number
}

export type Product = PRODUCT_WITH_VARIANTS_SCHEMA & {
  sku_prefix?: string
  category_name?: string | null
  brand_name?: string | null
  gender?: string
  season?: string | null
  cost_price?: number | string
  retail_price?: number | string
  variant_count?: number
}

export type ProductVariant = PRODUCT_VARIANT_RESPONSE_SCHEMA & {
  color_code?: string | null
  cost_price_override?: number | string | null
  retail_price_override?: number | string | null
}

export type PurchaseOrder = PURCHASE_ORDER_RESPONSE_SCHEMA & {
  supplier_name?: string | null
  expected_at?: string | null
  received_at?: string | null
}

// Frontend-only View Models and Presentation Types
export interface PosTerminal {
  id: string
  branch_id: string
  warehouse_id: string
  code: string
  name: string
  status_code: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | string
  device_identifier?: string | null
  receipt_prefix?: string | null
  last_active_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  branch_name?: string
  warehouse_name?: string
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
  device_identifier?: string | null
  receipt_prefix?: string | null
  status_code?: string
  notes?: string | null
}

export interface PosTerminalUpdate {
  branch_id?: string
  warehouse_id?: string
  name?: string
  device_identifier?: string | null
  receipt_prefix?: string | null
  status_code?: string
  notes?: string | null
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
export type SupportedLocale = 'en' | 'km' | 'cn' | 'jp' | 'kr'

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

// ── Shared UI Component System Types ─────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'default' | 'outline' | 'ghost' | 'danger' | 'success' | 'link' | string
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface FilterChipItem {
  key: string
  label: string
  value: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  mobilePriority?: number
  mobileHidden?: boolean
}

export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

export interface TabItem {
  key: string
  label: string
  icon?: string
  count?: number | string
  disabled?: boolean
}

export interface DropdownMenuItem {
  key?: string
  label: string
  icon?: string
  to?: string
  variant?: 'default' | 'danger'
  disabled?: boolean
  divider?: boolean
  onSelect?: () => void
}

