export interface NavItem {
  label: string
  to: string
  icon: string
  shortcut?: string
  badge?: string | number
  railPrimary?: boolean
  permission?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-heroicons-chart-bar-square', railPrimary: true, permission: 'report.view' },
    ],
  },
  {
    title: 'Store',
    items: [
      { label: 'POS Registers', to: '/settings/terminals', icon: 'i-heroicons-computer-desktop', railPrimary: true, permission: 'sale.read' },
      { label: 'Receipt Templates', to: '/settings/receipts', icon: 'i-heroicons-printer', permission: 'sale.read' },
      { label: 'Sales Orders', to: '/sales', icon: 'i-heroicons-receipt-percent', permission: 'sale.read' },
      { label: 'Returns', to: '/sales/returns', icon: 'i-heroicons-arrow-uturn-left', permission: 'sale.return' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/products', icon: 'i-heroicons-tag', railPrimary: true, permission: 'product.read' },
      { label: 'Categories', to: '/categories', icon: 'i-heroicons-rectangle-stack', permission: 'product.read' },
      { label: 'Brands', to: '/brands', icon: 'i-heroicons-sparkles', permission: 'product.read' },
      { label: 'Print Labels', to: '/labels', icon: 'i-heroicons-qr-code', permission: 'product.read' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Stock Levels', to: '/inventory', icon: 'i-heroicons-cube', railPrimary: true, permission: 'inventory.read' },
      { label: 'Movements', to: '/inventory/movements', icon: 'i-heroicons-arrows-right-left', permission: 'inventory.read' },
      { label: 'Transfers', to: '/inventory/transfers', icon: 'i-heroicons-truck', permission: 'inventory.transfer' },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal', permission: 'inventory.adjust' },
    ],
  },
  {
    title: 'Purchasing',
    items: [
      { label: 'Purchase Orders', to: '/purchases', icon: 'i-heroicons-document-text', permission: 'purchase.read' },
      { label: 'Suppliers', to: '/suppliers', icon: 'i-heroicons-building-office-2', permission: 'purchase.read' },
    ],
  },
  {
    title: 'Customers',
    items: [
      { label: 'Customers', to: '/customers', icon: 'i-heroicons-users', railPrimary: true, permission: 'customer.read' },
      { label: 'Promotions', to: '/promotions', icon: 'i-heroicons-gift', permission: 'promotion.manage' },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Expenses', to: '/expenses', icon: 'i-heroicons-banknotes', permission: 'expense.manage' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Sales Report', to: '/reports/sales', icon: 'i-heroicons-chart-pie', railPrimary: true, permission: 'report.view' },
      { label: 'Inventory Report', to: '/reports/inventory', icon: 'i-heroicons-clipboard-document-list', permission: 'report.view' },
      { label: 'Purchases Report', to: '/reports/purchases', icon: 'i-heroicons-document-text', permission: 'report.view' },
      { label: 'Profit & Loss', to: '/reports/profit', icon: 'i-heroicons-currency-dollar', permission: 'report.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: 'i-heroicons-user-group', permission: 'user.manage' },
      { label: 'Roles', to: '/roles', icon: 'i-heroicons-shield-check', permission: 'user.manage' },
      { label: 'Audit Logs', to: '/audit-logs', icon: 'i-heroicons-clipboard-document-check', permission: 'settings.manage' },
      { label: 'Integrations', to: '/settings/integrations', icon: 'i-heroicons-cpu-chip', permission: 'settings.manage' },
      { label: 'Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth', permission: 'settings.manage' },
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
