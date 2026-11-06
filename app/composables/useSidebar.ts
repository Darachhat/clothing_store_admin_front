export interface NavItem {
  to: string
  label: string
  i18nKey: string
  icon: string
  exact?: boolean
  permission?: string
}

export interface NavGroup {
  key: string
  label: string
  i18nKey: string
  items: NavItem[]
}

const STORAGE_KEY = 'clothing_store_admin_sidebar_collapsed'

// Shared singleton state across layout & sidebar
const isCollapsed = ref(false)
const isMobileOpen = ref(false)

export function useSidebar() {
  const route = useRoute()
  const authStore = useAuthStore()
  const { t } = useAppTranslation()

  function initSidebar() {
    if (import.meta.client) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        isCollapsed.value = saved === '1'
      }
    }
  }

  function toggleSidebar() {
    isCollapsed.value = !isCollapsed.value
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, isCollapsed.value ? '1' : '0')
    }
  }

  function toggleMobileSidebar() {
    isMobileOpen.value = !isMobileOpen.value
  }

  function closeMobileSidebar() {
    isMobileOpen.value = false
  }

  // Raw navigation structure logically grouped per Phase 3 specification
  const rawGroups: NavGroup[] = [
    {
      key: 'overview',
      label: 'Overview',
      i18nKey: 'nav.overview',
      items: [
        { to: '/dashboard', label: 'Dashboard', i18nKey: 'nav.dashboard', icon: 'i-heroicons-squares-2x2', exact: true },
      ],
    },
    {
      key: 'store',
      label: 'Store',
      i18nKey: 'nav.store',
      items: [
        { to: '/settings/terminals', label: 'POS Registers', i18nKey: 'nav.terminals', icon: 'i-heroicons-computer-desktop', exact: true, permission: 'settings.manage' },
        { to: '/settings/receipts', label: 'Receipt Templates', i18nKey: 'nav.receipts', icon: 'i-heroicons-printer', exact: true, permission: 'settings.manage' },
        { to: '/sales', label: 'Sales Orders', i18nKey: 'nav.sales', icon: 'i-heroicons-shopping-bag', permission: 'sale.view' },
        { to: '/sales/returns', label: 'Sales Returns', i18nKey: 'nav.sales_returns', icon: 'i-heroicons-arrow-uturn-left', exact: true, permission: 'sale.view' },
      ],
    },
    {
      key: 'catalog',
      label: 'Catalog',
      i18nKey: 'nav.catalog',
      items: [
        { to: '/products', label: 'Products', i18nKey: 'nav.products', icon: 'i-heroicons-Checkroom' in {} ? 'i-heroicons-tag' : 'i-heroicons-tag', permission: 'product.view' },
        { to: '/categories', label: 'Categories', i18nKey: 'nav.categories', icon: 'i-heroicons-folder', permission: 'product.view' },
        { to: '/brands', label: 'Brands', i18nKey: 'nav.brands', icon: 'i-heroicons-Sparkles' in {} ? 'i-heroicons-sparkles' : 'i-heroicons-sparkles', permission: 'product.view' },
        { to: '/labels', label: 'Print Labels', i18nKey: 'nav.labels', icon: 'i-heroicons-qr-code', permission: 'product.view' },
      ],
    },
    {
      key: 'inventory',
      label: 'Inventory',
      i18nKey: 'nav.inventory',
      items: [
        { to: '/inventory', label: 'Stock Levels', i18nKey: 'nav.stock_levels', icon: 'i-heroicons-archive-box', exact: true, permission: 'inventory.view' },
        { to: '/inventory/movements', label: 'Movements', i18nKey: 'nav.movements', icon: 'i-heroicons-arrows-right-left', permission: 'inventory.view' },
        { to: '/inventory/transfers', label: 'Transfers', i18nKey: 'nav.transfers', icon: 'i-heroicons-truck', permission: 'inventory.transfer' },
        { to: '/inventory/adjustments', label: 'Adjustments', i18nKey: 'nav.adjustments', icon: 'i-heroicons-adjustments-horizontal', permission: 'inventory.adjust' },
      ],
    },
    {
      key: 'purchasing',
      label: 'Purchasing',
      i18nKey: 'nav.purchasing',
      items: [
        { to: '/purchases', label: 'Purchase Orders', i18nKey: 'nav.purchase_orders', icon: 'i-heroicons-clipboard-document-list', permission: 'purchase.view' },
        { to: '/suppliers', label: 'Suppliers', i18nKey: 'nav.suppliers', icon: 'i-heroicons-building-office-2', permission: 'supplier.view' },
      ],
    },
    {
      key: 'customers',
      label: 'Customers',
      i18nKey: 'nav.customers_group',
      items: [
        { to: '/customers', label: 'Customers', i18nKey: 'nav.customers', icon: 'i-heroicons-users', permission: 'customer.view' },
        { to: '/promotions', label: 'Promotions', i18nKey: 'nav.promotions', icon: 'i-heroicons-receipt-percent', permission: 'promotion.view' },
      ],
    },
    {
      key: 'finance',
      label: 'Finance',
      i18nKey: 'nav.finance',
      items: [
        { to: '/expenses', label: 'Expenses', i18nKey: 'nav.expenses', icon: 'i-heroicons-banknotes', permission: 'expense.view' },
        { to: '/reports', label: 'Reports', i18nKey: 'nav.reports', icon: 'i-heroicons-chart-bar', permission: 'report.view' },
      ],
    },
    {
      key: 'administration',
      label: 'Administration',
      i18nKey: 'nav.administration',
      items: [
        { to: '/users', label: 'Users', i18nKey: 'nav.users', icon: 'i-heroicons-user-group', permission: 'user.manage' },
        { to: '/roles', label: 'Roles & Permissions', i18nKey: 'nav.roles', icon: 'i-heroicons-shield-check', permission: 'user.manage' },
        { to: '/settings', label: 'System Settings', i18nKey: 'nav.settings', icon: 'i-heroicons-cog-6-tooth', exact: true, permission: 'settings.manage' },
        { to: '/settings/integrations', label: 'Integrations & Gateways', i18nKey: 'nav.integrations', icon: 'i-heroicons-cpu-chip', exact: true, permission: 'settings.manage' },
        { to: '/settings/translations', label: 'Translations CMS', i18nKey: 'nav.translations', icon: 'i-heroicons-language', exact: true, permission: 'settings.manage' },
        { to: '/audit-logs', label: 'Audit Logs', i18nKey: 'nav.audit_logs', icon: 'i-heroicons-CommandLine' in {} ? 'i-heroicons-command-line' : 'i-heroicons-command-line', permission: 'settings.manage' },
      ],
    },
  ]

  // Filter items by user permissions and resolve translations
  const navGroups = computed<NavGroup[]>(() => {
    return rawGroups
      .map((group) => ({
        ...group,
        label: t(group.i18nKey, group.label),
        items: group.items
          .filter((item) => !item.permission || authStore.hasPermission(item.permission))
          .map((item) => ({
            ...item,
            label: t(item.i18nKey, item.label),
          })),
      }))
      .filter((group) => group.items.length > 0)
  })

  function isActive(to: string, exact = false): boolean {
    if (exact) return route.path === to
    if (to === '/sales' && route.path.startsWith('/sales/returns')) return false
    if (to === '/settings' && route.path !== '/settings') return false
    return route.path === to || route.path.startsWith(to + '/')
  }

  const currentRouteContext = computed(() => {
    for (const group of navGroups.value) {
      for (const item of group.items) {
        if (isActive(item.to, item.exact)) {
          return {
            groupLabel: group.label,
            itemLabel: item.label,
            itemTo: item.to,
            icon: item.icon,
          }
        }
      }
    }
    return {
      groupLabel: 'Overview',
      itemLabel: 'Dashboard',
      itemTo: '/dashboard',
      icon: 'i-heroicons-squares-2x2',
    }
  })

  return {
    isCollapsed,
    isMobileOpen,
    navGroups,
    currentRouteContext,
    initSidebar,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    isActive,
  }
}
