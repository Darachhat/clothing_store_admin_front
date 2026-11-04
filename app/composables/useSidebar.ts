export interface NavItem {
  label: string
  to: string
  icon: string
  shortcut?: string
  badge?: string | number
  railPrimary?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-heroicons-chart-bar-square', railPrimary: true },
    ],
  },
  {
    title: 'Store',
    items: [
      { label: 'POS Registers', to: '/settings/terminals', icon: 'i-heroicons-computer-desktop', railPrimary: true },
      { label: 'Receipt Templates', to: '/settings/receipts', icon: 'i-heroicons-printer' },
      { label: 'Sales Orders', to: '/sales', icon: 'i-heroicons-receipt-percent' },
      { label: 'Returns', to: '/sales/returns', icon: 'i-heroicons-arrow-uturn-left' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/products', icon: 'i-heroicons-tag', railPrimary: true },
      { label: 'Categories', to: '/categories', icon: 'i-heroicons-rectangle-stack' },
      { label: 'Brands', to: '/brands', icon: 'i-heroicons-sparkles' },
      { label: 'Print Labels', to: '/labels', icon: 'i-heroicons-qr-code' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Stock Levels', to: '/inventory', icon: 'i-heroicons-cube', railPrimary: true },
      { label: 'Movements', to: '/inventory/movements', icon: 'i-heroicons-arrows-right-left' },
      { label: 'Transfers', to: '/inventory/transfers', icon: 'i-heroicons-truck' },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal' },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      { label: 'Purchase Orders', to: '/purchases', icon: 'i-heroicons-document-text' },
      { label: 'Suppliers', to: '/suppliers', icon: 'i-heroicons-building-office-2' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', to: '/customers', icon: 'i-heroicons-users', railPrimary: true },
      { label: 'Promotions', to: '/promotions', icon: 'i-heroicons-gift' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Expenses', to: '/expenses', icon: 'i-heroicons-banknotes' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Sales Report', to: '/reports/sales', icon: 'i-heroicons-chart-pie', railPrimary: true },
      { label: 'Inventory Report', to: '/reports/inventory', icon: 'i-heroicons-clipboard-document-list' },
      { label: 'Purchases Report', to: '/reports/purchases', icon: 'i-heroicons-document-text' },
      { label: 'Profit & Loss', to: '/reports/profit', icon: 'i-heroicons-currency-dollar' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: 'i-heroicons-user-group' },
      { label: 'Roles', to: '/roles', icon: 'i-heroicons-shield-check' },
      { label: 'Audit Logs', to: '/audit-logs', icon: 'i-heroicons-clipboard-document-check' },
      { label: 'Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth' },
    ],
  },
]

export function useSidebar() {
  const isCollapsed = useState<boolean>('app_sidebar_collapsed', () => false)

  function toggle() {
    isCollapsed.value = !isCollapsed.value
  }

  function collapse() {
    isCollapsed.value = true
  }

  function expand() {
    isCollapsed.value = false
  }

  return {
    isCollapsed,
    navSections: APP_NAV_SECTIONS,
    toggle,
    collapse,
    expand,
  }
}
