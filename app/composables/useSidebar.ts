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
  children?: NavItem[]
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
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: 'i-heroicons-squares-2x2',
        exact: true,
        railPrimary: true,
        permission: 'report.read',
      },
    ],
  },
  {
    key: 'store',
    title: 'Store & POS',
    items: [
      {
        label: 'Sales & Orders',
        to: '/sales',
        icon: 'i-heroicons-receipt-percent',
        railPrimary: true,
        permission: 'sale.read',
        children: [
          { label: 'Sales Orders', to: '/sales', icon: 'i-heroicons-receipt-percent', exact: true, permission: 'sale.read' },
          { label: 'Sales Returns', to: '/sales/returns', icon: 'i-heroicons-arrow-uturn-left', exact: true, permission: 'sale.refund' },
          { label: 'POS Registers', to: '/settings/terminals', icon: 'i-heroicons-computer-desktop', exact: true, permission: 'sale.read' },
          { label: 'Receipt Templates', to: '/settings/receipts', icon: 'i-heroicons-printer', exact: true, permission: 'sale.read' },
        ],
      },
    ],
  },
  {
    key: 'catalog',
    title: 'Catalog',
    items: [
      {
        label: 'Catalog & Products',
        to: '/products',
        icon: 'i-heroicons-tag',
        railPrimary: true,
        permission: 'product.read',
        children: [
          { label: 'Products', to: '/products', icon: 'i-heroicons-tag', exact: true, permission: 'product.read' },
          { label: 'Add Product', to: '/products/new', icon: 'i-heroicons-plus-circle', exact: true, permission: 'product.create' },
          { label: 'Categories', to: '/categories', icon: 'i-heroicons-rectangle-stack', exact: true, permission: 'product.read' },
          { label: 'Brands', to: '/brands', icon: 'i-heroicons-sparkles', exact: true, permission: 'product.read' },
        ],
      },
      {
        label: 'Sticker & Label Studio',
        to: '/labels',
        icon: 'i-heroicons-qr-code',
        permission: 'product.read',
        children: [
          { label: 'Label Templates', to: '/labels', icon: 'i-heroicons-qr-code', exact: true, permission: 'product.read' },
          { label: 'Batch Print Stickers', to: '/labels/generate', icon: 'i-heroicons-printer', exact: true, permission: 'product.read' },
        ],
      },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory & Purchasing',
    items: [
      {
        label: 'Inventory',
        to: '/inventory',
        icon: 'i-heroicons-cube',
        railPrimary: true,
        permission: 'inventory.read',
        children: [
          { label: 'Stock Levels', to: '/inventory', icon: 'i-heroicons-cube', exact: true, permission: 'inventory.read' },
          { label: 'Stock Movements', to: '/inventory/movements', icon: 'i-heroicons-arrows-right-left', exact: true, permission: 'inventory.read' },
          { label: 'Stock Transfers', to: '/inventory/transfers', icon: 'i-heroicons-truck', exact: true, permission: 'inventory.transfer' },
          { label: 'Stock Adjustments', to: '/inventory/adjustments', icon: 'i-heroicons-adjustments-horizontal', exact: true, permission: 'inventory.adjust' },
        ],
      },
      {
        label: 'Purchasing',
        to: '/purchases',
        icon: 'i-heroicons-document-text',
        permission: 'purchase.read',
        children: [
          { label: 'Purchase Orders', to: '/purchases', icon: 'i-heroicons-document-text', exact: true, permission: 'purchase.read' },
          { label: 'Suppliers', to: '/suppliers', icon: 'i-heroicons-building-office-2', exact: true, permission: 'purchase.read' },
        ],
      },
    ],
  },
  {
    key: 'customers',
    title: 'Customers & Marketing',
    items: [
      {
        label: 'Customers',
        to: '/customers',
        icon: 'i-heroicons-users',
        railPrimary: true,
        permission: 'customer.read',
      },
      {
        label: 'Promotions & Loyalty',
        to: '/promotions',
        icon: 'i-heroicons-gift',
        permission: 'sale.read',
      },
    ],
  },
  {
    key: 'analytics',
    title: 'Finance & Reports',
    items: [
      {
        label: 'Reports & Analytics',
        to: '/reports',
        icon: 'i-heroicons-presentation-chart-line',
        railPrimary: true,
        permission: 'report.read',
        children: [
          { label: 'Reports Overview', to: '/reports', icon: 'i-heroicons-presentation-chart-line', exact: true, permission: 'report.read' },
          { label: 'Sales Report', to: '/reports/sales', icon: 'i-heroicons-chart-pie', exact: true, permission: 'report.read' },
          { label: 'Inventory Report', to: '/reports/inventory', icon: 'i-heroicons-clipboard-document-list', exact: true, permission: 'report.read' },
          { label: 'Purchases Report', to: '/reports/purchases', icon: 'i-heroicons-document-text', exact: true, permission: 'report.read' },
          { label: 'Profit & Loss', to: '/reports/profit', icon: 'i-heroicons-currency-dollar', exact: true, permission: 'report.read' },
        ],
      },
      {
        label: 'Store Expenses',
        to: '/expenses',
        icon: 'i-heroicons-banknotes',
        permission: 'report.read',
      },
    ],
  },
  {
    key: 'administration',
    title: 'Administration',
    items: [
      {
        label: 'Access & Security',
        to: '/users',
        icon: 'i-heroicons-user-group',
        permission: 'user.manage',
        children: [
          { label: 'Users', to: '/users', icon: 'i-heroicons-user-group', exact: true, permission: 'user.manage' },
          { label: 'Roles & Permissions', to: '/roles', icon: 'i-heroicons-shield-check', exact: true, permission: 'user.manage' },
          { label: 'Audit Logs', to: '/audit-logs', icon: 'i-heroicons-clipboard-document-check', exact: true, permission: 'settings.manage' },
        ],
      },
      {
        label: 'System Settings',
        to: '/settings',
        icon: 'i-heroicons-cog-6-tooth',
        permission: 'settings.manage',
        children: [
          { label: 'General Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth', exact: true, permission: 'settings.manage' },
          { label: 'BRAND_MODEL & Identity', to: '/settings/brand', icon: 'i-heroicons-sparkles', exact: true, permission: 'settings.manage' },
          { label: 'Integrations', to: '/settings/integrations', icon: 'i-heroicons-cpu-chip', exact: true, permission: 'settings.manage' },
          { label: 'Translations CMS', to: '/settings/translations', icon: 'i-heroicons-language', exact: true, permission: 'settings.manage' },
        ],
      },
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
  'Store & POS': 'nav_section.store',
  Catalog: 'nav_section.catalog',
  'Inventory & Purchasing': 'nav_section.inventory',
  'Customers & Marketing': 'nav_section.customers',
  'Finance & Reports': 'nav_section.reports',
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
          label: item.children
            ? item.label
            : t(ROUTE_TRANSLATION_MAP[item.to] || item.label, item.label),
          children: item.children?.map(child => ({
            ...child,
            label: t(ROUTE_TRANSLATION_MAP[child.to] || child.label, child.label),
          })),
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

  const allNavPaths = computed(() => {
    const paths: string[] = []
    for (const sec of APP_NAV_SECTIONS) {
      for (const item of sec.items) {
        paths.push(item.to)
        if (item.children) {
          for (const child of item.children) {
            paths.push(child.to)
          }
        }
      }
    }
    return paths
  })

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
        if (item.children) {
          for (const child of item.children) {
            if (isActive(child.to, child.exact)) {
              return {
                groupLabel: item.label,
                itemLabel: child.label,
                itemTo: child.to,
                icon: child.icon || item.icon,
              }
            }
          }
        }
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
      icon: 'i-heroicons-squares-2x2',
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
