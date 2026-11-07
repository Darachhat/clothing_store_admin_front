import { computed } from 'vue'
import { useAppTranslation } from './useAppTranslation'

export interface NavItem {
  label: string
  to: string
  icon: string
  exact?: boolean
  shortcut?: string
  badge?: string | number
  railPrimary?: boolean
  permission?: string
}

export interface NavSection {
  key?: string
  title: string
  label?: string
  items: NavItem[]
}

export interface NavGroup {
  key: string
  label: string
  items: NavItem[]
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    key: 'overview',
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: 'i-heroicons-chart-bar-square', exact: true, railPrimary: true, permission: 'report.view' },
    ],
  },
  {
    key: 'store',
    title: 'Store',
    items: [
      { label: 'POS Registers', to: '/settings/terminals', icon: 'i-heroicons-computer-desktop', exact: true, railPrimary: true, permission: 'sale.read' },
      { label: 'Receipt Templates', to: '/settings/receipts', icon: 'i-heroicons-printer', exact: true, permission: 'sale.read' },
      { label: 'Sales Orders', to: '/sales', icon: 'i-heroicons-receipt-percent', exact: true, permission: 'sale.read' },
      { label: 'Returns', to: '/sales/returns', icon: 'i-heroicons-arrow-uturn-left', exact: true, permission: 'sale.return' },
    ],
  },
  {
    key: 'catalog',
    title: 'Catalog',
    items: [
      { label: 'Products', to: '/products', icon: 'i-heroicons-tag', railPrimary: true, permission: 'product.read' },
      { label: 'Categories', to: '/categories', icon: 'i-heroicons-rectangle-stack', permission: 'product.read' },
      { label: 'Brands', to: '/brands', icon: 'i-heroicons-sparkles', permission: 'product.read' },
      { label: 'Print Labels', to: '/labels', icon: 'i-heroicons-qr-code', permission: 'product.read' },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    items: [
      { label: 'Stock Levels', to: '/inventory', icon: 'i-heroicons-cube', exact: true, railPrimary: true, permission: 'inventory.read' },
      { label: 'Movements', to: '/inventory/movements', icon: 'i-heroicons-arrows-right-left', exact: true, permission: 'inventory.read' },
      { label: 'Transfers', to: '/inventory/transfers', icon: 'i-heroicons-truck', exact: true, permission: 'inventory.transfer' },
      { label: 'Adjustments', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal', exact: true, permission: 'inventory.adjust' },
    ],
  },
  {
    key: 'purchasing',
    title: 'Purchasing',
    items: [
      { label: 'Purchase Orders', to: '/purchases', icon: 'i-heroicons-document-text', permission: 'purchase.read' },
      { label: 'Suppliers', to: '/suppliers', icon: 'i-heroicons-building-office-2', permission: 'purchase.read' },
    ],
  },
  {
    key: 'customers',
    title: 'Customers',
    items: [
      { label: 'Customers', to: '/customers', icon: 'i-heroicons-users', railPrimary: true, permission: 'customer.read' },
      { label: 'Promotions & Loyalty', to: '/promotions', icon: 'i-heroicons-gift', permission: 'promotion.manage' },
    ],
  },
  {
    key: 'finance',
    title: 'Finance',
    items: [
      { label: 'Expenses', to: '/expenses', icon: 'i-heroicons-banknotes', permission: 'expense.manage' },
    ],
  },
  {
    key: 'reports',
    title: 'Reports',
    items: [
      { label: 'Reports Overview', to: '/reports', icon: 'i-heroicons-presentation-chart-line', exact: true, permission: 'report.view' },
      { label: 'Sales Report', to: '/reports/sales', icon: 'i-heroicons-chart-pie', exact: true, railPrimary: true, permission: 'report.view' },
      { label: 'Inventory Report', to: '/reports/inventory', icon: 'i-heroicons-clipboard-document-list', exact: true, permission: 'report.view' },
      { label: 'Purchases Report', to: '/reports/purchases', icon: 'i-heroicons-document-text', exact: true, permission: 'report.view' },
      { label: 'Profit & Loss', to: '/reports/profit', icon: 'i-heroicons-currency-dollar', exact: true, permission: 'report.view' },
    ],
  },
  {
    key: 'administration',
    title: 'Administration',
    items: [
      { label: 'Users', to: '/users', icon: 'i-heroicons-user-group', permission: 'user.manage' },
      { label: 'Roles & Permissions', to: '/roles', icon: 'i-heroicons-shield-check', permission: 'user.manage' },
      { label: 'Audit Logs', to: '/audit-logs', icon: 'i-heroicons-clipboard-document-check', permission: 'settings.manage' },
      { label: 'Integrations', to: '/settings/integrations', icon: 'i-heroicons-cpu-chip', exact: true, permission: 'settings.manage' },
      { label: 'Translations CMS', to: '/settings/translations', icon: 'i-heroicons-language', exact: true, permission: 'settings.manage' },
      { label: 'Brand & Identity', to: '/settings/brand', icon: 'i-heroicons-sparkles', exact: true, permission: 'settings.manage' },
      { label: 'Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth', exact: true, permission: 'settings.manage' },
    ],
  },
]

const ROUTE_TRANSLATION_MAP: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/settings/terminals': 'nav.pos_registers',
  '/settings/receipts': 'nav.receipt_templates',
  '/sales': 'nav.sales_orders',
  '/sales/returns': 'nav.returns',
  '/products': 'nav.products',
  '/categories': 'nav.categories',
  '/brands': 'nav.brands',
  '/labels': 'nav.print_labels',
  '/inventory': 'nav.stock_levels',
  '/inventory/movements': 'nav.movements',
  '/inventory/transfers': 'nav.transfers',
  '/inventory/adjustments': 'nav.adjustments',
  '/purchases': 'nav.purchase_orders',
  '/suppliers': 'nav.suppliers',
  '/customers': 'nav.customers',
  '/promotions': 'nav.promotions',
  '/expenses': 'nav.expenses',
  '/reports': 'nav.reports',
  '/reports/sales': 'nav.sales_report',
  '/reports/inventory': 'nav.inventory_report',
  '/reports/purchases': 'nav.purchases_report',
  '/reports/profit': 'nav.profit_loss',
  '/users': 'nav.users',
  '/roles': 'nav.roles',
  '/audit-logs': 'nav.audit_logs',
  '/settings/integrations': 'nav.integrations',
  '/settings/translations': 'nav.translations',
  '/settings/brand': 'nav.brand_identity',
  '/settings': 'nav.settings',
}

const SECTION_TRANSLATION_MAP: Record<string, string> = {
  Overview: 'nav_section.overview',
  Store: 'nav_section.store',
  Catalog: 'nav_section.catalog',
  Inventory: 'nav_section.inventory',
  Purchasing: 'nav_section.purchasing',
  Customers: 'nav_section.customers',
  Finance: 'nav_section.finance',
  Reports: 'nav_section.reports',
  Administration: 'nav_section.administration',
}

const SIDEBAR_STORAGE_KEY = 'clothing_admin_sidebar_collapsed'

export function useSidebar() {
  const isCollapsed = useState<boolean>('app_sidebar_collapsed', () => false)
  const isMobileOpen = useState<boolean>('admin_sidebar_mobile_open', () => false)
  const route = useRoute()
  const { t } = useAppTranslation()

  function initSidebar() {
    if (import.meta.client) {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY)
      if (saved !== null) {
        isCollapsed.value = saved === '1'
      } else if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        isCollapsed.value = true
      }
    }
  }

  function toggleSidebar() {
    isCollapsed.value = !isCollapsed.value
    if (import.meta.client) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, isCollapsed.value ? '1' : '0')
    }
  }

  function toggle() {
    toggleSidebar()
  }

  function collapse() {
    isCollapsed.value = true
    if (import.meta.client) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, '1')
    }
  }

  function expand() {
    isCollapsed.value = false
    if (import.meta.client) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, '0')
    }
  }

  function toggleMobileSidebar() {
    isMobileOpen.value = !isMobileOpen.value
  }

  function closeMobileSidebar() {
    isMobileOpen.value = false
  }

  const localizedNavSections = computed<NavSection[]>(() => {
    return APP_NAV_SECTIONS.map(section => {
      const translatedTitle = t(SECTION_TRANSLATION_MAP[section.title] || section.title, section.title)
      return {
        ...section,
        key: section.key || section.title.toLowerCase(),
        title: translatedTitle,
        label: translatedTitle,
        items: section.items.map(item => ({
          ...item,
          label: t(ROUTE_TRANSLATION_MAP[item.to] || item.label, item.label),
        })),
      }
    })
  })

  const navGroups = computed<NavGroup[]>(() =>
    localizedNavSections.value.map(sec => ({
      key: sec.key || sec.title.toLowerCase(),
      label: sec.title,
      items: sec.items,
    })),
  )

  const allNavPaths = computed(() =>
    APP_NAV_SECTIONS.flatMap(s => s.items.map(i => i.to)),
  )

  function isActive(to: string, exact = false): boolean {
    const path = route.path
    if (to === '/dashboard') return path === '/dashboard' || path === '/'
    if (exact) return path === to
    if (path === to) return true
    if (path.startsWith(`${to}/`)) {
      const hasMoreSpecificMatch = allNavPaths.value.some(
        other => other !== to && other.length > to.length && (path === other || path.startsWith(`${other}/`)),
      )
      return !hasMoreSpecificMatch
    }
    return false
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
      groupLabel: t('nav_section.overview', 'Overview'),
      itemLabel: t('nav.dashboard', 'Dashboard'),
      itemTo: '/dashboard',
      icon: 'i-heroicons-chart-bar-square',
    }
  })

  return {
    isCollapsed,
    isMobileOpen,
    navSections: localizedNavSections,
    rawNavSections: APP_NAV_SECTIONS,
    navGroups,
    currentRouteContext,
    initSidebar,
    toggleSidebar,
    toggle,
    collapse,
    expand,
    toggleMobileSidebar,
    closeMobileSidebar,
    isActive,
  }
}
