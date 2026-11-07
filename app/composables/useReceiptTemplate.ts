import { useState } from '#imports'
import { useSystemSettingsApi } from '~/composables/useApi'

export interface ReceiptCustomTemplate {
  store_name?: string
  store_name_kh?: string
  tagline?: string
  logo_url?: string
  phone?: string
  address?: string
  tax_id?: string
  paper_width?: '80mm' | '58mm'
  show_item_sku?: boolean
  show_variant_attrs?: boolean
  show_khr_conversion?: boolean
  show_tax_breakdown?: boolean
  show_cashier_name?: boolean
  show_customer_info?: boolean
  footer_message?: string
  return_policy?: string
  wifi_info?: string
  qr_content?: string
}

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptCustomTemplate = {
  store_name: 'KIM VANNAK CLOTHING',
  store_name_kh: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
  tagline: 'Premium Streetwear & Contemporary Fashion',
  logo_url: '',
  phone: '+855 23 888 999',
  address: '#123 Preah Norodom Blvd, Daun Penh, Phnom Penh',
  tax_id: 'K001-902348572',
  paper_width: '80mm',
  show_item_sku: true,
  show_variant_attrs: true,
  show_khr_conversion: true,
  show_tax_breakdown: true,
  show_cashier_name: true,
  show_customer_info: true,
  footer_message: 'THANK YOU FOR SHOPPING WITH US!\nសូមអរគុណដែលបានគាំទ្រហាងយើងខ្ញុំ!',
  return_policy: 'ទំនិញទិញរួចមិនអាចប្តូរប្រាក់វិញបានទេ (Exchange within 7 days with tag/receipt)',
  wifi_info: 'Guest Wi-Fi: Vannak_Store | Pass: fashion2026',
  qr_content: 'https://kimvannak.store',
}

const STORAGE_KEY = 'pos_receipt_template'

export function useReceiptTemplate() {
  const template = useState<ReceiptCustomTemplate>('global_receipt_template', () => ({
    ...DEFAULT_RECEIPT_TEMPLATE,
  }))
  const isLoaded = useState<boolean>('global_receipt_template_loaded', () => false)

  async function loadTemplate() {
    if (!import.meta.client) return

    // 1. Read from localStorage cache first
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        template.value = {
          ...DEFAULT_RECEIPT_TEMPLATE,
          ...JSON.parse(cached),
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // 2. Fetch remote settings from system settings API (single source of truth)
    try {
      const settingsApi = useSystemSettingsApi()
      let receiptData: any = null
      if (typeof settingsApi.getReceiptSettings === 'function') {
        try {
          receiptData = await settingsApi.getReceiptSettings()
        } catch {
          // fallback to category
        }
      }
      if (!receiptData && typeof settingsApi.getCategorySettings === 'function') {
        try {
          receiptData = await settingsApi.getCategorySettings('receipt')
        } catch {}
      }

      if (receiptData && typeof receiptData === 'object' && Object.keys(receiptData).length > 0) {
        template.value = {
          ...DEFAULT_RECEIPT_TEMPLATE,
          ...template.value,
          ...receiptData,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(template.value))
      }
    } catch {
      // retain cached or default template
    } finally {
      isLoaded.value = true
    }
  }

  async function saveTemplate(updated: ReceiptCustomTemplate) {
    if (!import.meta.client) return
    const settingsApi = useSystemSettingsApi()
    if (typeof settingsApi.updateReceiptSettings === 'function') {
      await settingsApi.updateReceiptSettings(updated)
    } else if (typeof settingsApi.updateCategorySettings === 'function') {
      await settingsApi.updateCategorySettings('receipt', updated)
    }
    template.value = {
      ...DEFAULT_RECEIPT_TEMPLATE,
      ...updated,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template.value))
  }

  return {
    template,
    isLoaded,
    loadTemplate,
    saveTemplate,
    defaultTemplate: DEFAULT_RECEIPT_TEMPLATE,
  }
}

