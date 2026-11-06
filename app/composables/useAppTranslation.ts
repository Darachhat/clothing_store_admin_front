/**
 * Database-Backed Multi-Language Translation Composable (admin_front)
 * Supports 5 languages: English (en), Khmer (km), Chinese (cn), Japanese (jp), Korean (kr).
 * Synchronizes with Redis-cached backend endpoint `/api/v1/translations/dictionary`.
 * Strict Compliance: No emojis used (AGENTS.md). Uses clean ISO codes for flags.
 */

import { ref, computed } from 'vue'
import type { SupportedLocale } from '~/types'

export interface LocaleOption {
  code: SupportedLocale
  name: string
  native: string
  flag: string
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: 'en', name: 'English', native: 'English', flag: 'EN' },
  { code: 'km', name: 'Khmer', native: 'ភាសាខ្មែរ', flag: 'KM' },
  { code: 'cn', name: 'Chinese', native: '中文', flag: 'CN' },
  { code: 'jp', name: 'Japanese', native: '日本語', flag: 'JP' },
  { code: 'kr', name: 'Korean', native: '한국어', flag: 'KR' },
]

const STORAGE_KEY = 'clothing_store_admin_locale'
const CACHE_KEY = 'clothing_store_admin_i18n_dict'

// Built-in fallback dictionary if backend is unreachable
const FALLBACK_DICTIONARY: Record<string, Record<string, string>> = {
  en: {
    'nav.overview': 'Overview',
    'nav.dashboard': 'Dashboard',
    'nav.catalog': 'Catalog',
    'nav.products': 'Products',
    'nav.categories': 'Categories',
    'nav.brands': 'Brands',
    'nav.labels': 'Print Labels',
    'nav.inventory': 'Inventory',
    'nav.stock_levels': 'Stock Levels',
    'nav.movements': 'Movements',
    'nav.transfers': 'Transfers',
    'nav.adjustments': 'Adjustments',
    'nav.sales_crm': 'Sales & CRM',
    'nav.sales': 'Sales Orders',
    'nav.customers': 'Customers',
    'nav.promotions': 'Promotions',
    'nav.purchasing': 'Purchasing',
    'nav.purchase_orders': 'Purchase Orders',
    'nav.suppliers': 'Suppliers',
    'nav.finance': 'Finance & Reports',
    'nav.expenses': 'Expenses',
    'nav.reports': 'Reports',
    'nav.administration': 'Administration',
    'nav.users': 'Users & Staff',
    'nav.roles': 'Roles & Permissions',
    'nav.audit_logs': 'Audit Logs',
    'nav.settings': 'System Settings',
    'nav.translations': 'Translations CMS',
    'common.open_pos': 'Open POS',
    'common.sign_out': 'Sign out',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.create': 'Create',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search...',
    'common.refresh': 'Refresh',
    'common.actions': 'Actions',
    'common.status': 'Status',
  },
  km: {
    'nav.overview': 'ទិដ្ឋភាពទូទៅ',
    'nav.dashboard': 'ផ្ទាំងគ្រប់គ្រង',
    'nav.catalog': 'បញ្ជីទំនិញ',
    'nav.products': 'ផលិតផល',
    'nav.categories': 'ប្រភេទទំនិញ',
    'nav.brands': 'ម៉ាកយីហោ',
    'nav.labels': 'បោះពុម្ពស្លាក',
    'nav.inventory': 'ស្តុកទំនិញ',
    'nav.stock_levels': 'កម្រិតស្តុក',
    'nav.movements': 'ចលនាស្តុក',
    'nav.transfers': 'ផ្ទេរស្តុក',
    'nav.adjustments': 'កែតម្រូវស្តុក',
    'nav.sales_crm': 'ការលក់ និងអតិថិជន',
    'nav.sales': 'បញ្ជាទិញលក់',
    'nav.customers': 'អតិថិជន',
    'nav.promotions': 'ប្រូម៉ូសិន',
    'nav.purchasing': 'ការបញ្ជាទិញចូល',
    'nav.purchase_orders': 'បញ្ជាទិញទំនិញ',
    'nav.suppliers': 'អ្នកផ្គត់ផ្គង់',
    'nav.finance': 'ហិរញ្ញវត្ថុ និងរបាយការណ៍',
    'nav.expenses': 'ចំណាយ',
    'nav.reports': 'របាយការណ៍',
    'nav.administration': 'ការគ្រប់គ្រងប្រព័ន្ធ',
    'nav.users': 'បុគ្គលិក និងអ្នកប្រើប្រាស់',
    'nav.roles': 'តួនាទី និងសិទ្ធិ',
    'nav.audit_logs': 'កំណត់ហេតុប្រព័ន្ធ',
    'nav.settings': 'ការកំណត់ប្រព័ន្ធ',
    'nav.translations': 'គ្រប់គ្រងភាសា (CMS)',
    'common.open_pos': 'បើកផ្ទាំងលក់ POS',
    'common.sign_out': 'ចាកចេញ',
    'common.save': 'រក្សាទុក',
    'common.cancel': 'បោះបង់',
    'common.create': 'បង្កើតថ្មី',
    'common.edit': 'កែប្រែ',
    'common.delete': 'លុប',
    'common.search': 'ស្វែងរក...',
    'common.refresh': 'ផ្ទុកឡើងវិញ',
    'common.actions': 'សកម្មភាព',
    'common.status': 'ស្ថានភាព',
  },
}

// Singleton reactive state shared across components
const currentLocale = ref<SupportedLocale>('en')
const dictionary = ref<Record<string, Record<string, string>>>({ ...FALLBACK_DICTIONARY })
const isLoaded = ref(false)
const isLoading = ref(false)

export function useAppTranslation() {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBaseUrl as string) || 'http://localhost:8000'

  function initLocale() {
    if (import.meta.client) {
      const savedLocale = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
      if (savedLocale && SUPPORTED_LOCALES.some((l) => l.code === savedLocale)) {
        currentLocale.value = savedLocale
      }
      const cachedDict = localStorage.getItem(CACHE_KEY)
      if (cachedDict) {
        try {
          const parsed = JSON.parse(cachedDict)
          dictionary.value = {
            ...FALLBACK_DICTIONARY,
            ...parsed,
            en: { ...FALLBACK_DICTIONARY.en, ...(parsed.en || {}) },
            km: { ...FALLBACK_DICTIONARY.km, ...(parsed.km || {}) },
          }
        } catch {
          // Ignore corrupt local cache
        }
      }
    }
  }

  async function fetchTranslations(schemaName?: string) {
    if (isLoading.value) return
    isLoading.value = true
    try {
      const query = schemaName ? `?schema_name=${encodeURIComponent(schemaName)}` : ''
      const res = await $fetch<{
        status: string
        source: string
        locales: Record<string, Record<string, string>>
      }>(`${baseURL}/api/v1/translations/dictionary${query}`)

      if (res?.locales) {
        const merged: Record<string, Record<string, string>> = { ...dictionary.value }
        for (const [loc, map] of Object.entries(res.locales)) {
          merged[loc] = {
            ...(FALLBACK_DICTIONARY[loc] || {}),
            ...(merged[loc] || {}),
            ...map,
          }
        }
        dictionary.value = merged
        isLoaded.value = true

        if (import.meta.client) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(merged))
        }
      }
    } catch {
      // Fallback to built-in + localStorage dictionary silently
    } finally {
      isLoading.value = false
    }
  }

  function setLocale(locale: SupportedLocale) {
    currentLocale.value = locale
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, locale)
      document.documentElement.setAttribute('lang', locale === 'km' ? 'km' : locale)
    }
  }

  /**
   * Translate a key (e.g. `nav.dashboard`) with automatic fallback to English or provided default text.
   */
  function t(key: string, fallbackText?: string): string {
    const loc = currentLocale.value
    const val = dictionary.value?.[loc]?.[key]
    if (val && val.trim().length > 0) return val

    const enVal = dictionary.value?.en?.[key]
    if (enVal && enVal.trim().length > 0) return enVal

    return fallbackText ?? key
  }

  const activeLocaleOption = computed(
    () => SUPPORTED_LOCALES.find((l) => l.code === currentLocale.value) ?? SUPPORTED_LOCALES[0],
  )

  return {
    currentLocale,
    supportedLocales: SUPPORTED_LOCALES,
    activeLocaleOption,
    dictionary,
    isLoaded,
    isLoading,
    initLocale,
    fetchTranslations,
    setLocale,
    t,
  }
}
