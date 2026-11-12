import { useState } from '#imports'
import { useSystemSettingsApi } from '~/composables/useApi'

export interface StickerTemplateConfig {
  paper_size: string
  label_width_mm: number
  label_height_mm: number
  columns: number
  code_type: 'BARCODE' | 'QR'
  store_header: string
  show_store_header: boolean
  show_product_name: boolean
  show_sku: boolean
  show_variant_attrs: boolean
  show_price_usd: boolean
  show_khr: boolean
  khr_exchange_rate: number
  footer_note: string
  default_copies: number
}

export const DEFAULT_STICKER_TEMPLATE: StickerTemplateConfig = {
  paper_size: 'THERMAL_50x30',
  label_width_mm: 50,
  label_height_mm: 38,
  columns: 1,
  code_type: 'BARCODE',
  store_header: 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
  show_store_header: true,
  show_product_name: true,
  show_sku: true,
  show_variant_attrs: true,
  show_price_usd: true,
  show_khr: true,
  khr_exchange_rate: 4100,
  footer_note: '',
  default_copies: 1,
}

export const STICKER_PRESET_DEFINITIONS = [
  {
    id: 'THERMAL_50x30',
    label: '50 × 38 mm (Standard Roll)',
    sub: 'Best for garment hangtags & shelf stickers',
    paper_size: 'THERMAL_50x30',
    label_width_mm: 50,
    label_height_mm: 38,
    columns: 1,
  },
  {
    id: 'THERMAL_40x30',
    label: '40 × 32 mm (Compact Roll)',
    sub: 'Compact thermal sticker for accessories',
    paper_size: 'THERMAL_40x30',
    label_width_mm: 40,
    label_height_mm: 32,
    columns: 1,
  },
  {
    id: 'THERMAL_60x40',
    label: '60 × 45 mm (Large Roll)',
    sub: 'Large garment box & outer packaging label',
    paper_size: 'THERMAL_60x40',
    label_width_mm: 60,
    label_height_mm: 45,
    columns: 1,
  },
  {
    id: 'A4',
    label: 'A4 Sheet (4 Columns • 48 × 36 mm)',
    sub: 'Laser / Inkjet multi-sticker sheet',
    paper_size: 'A4',
    label_width_mm: 48,
    label_height_mm: 36,
    columns: 4,
  },
  {
    id: 'A5',
    label: 'A5 Sheet (3 Columns • 45 × 34 mm)',
    sub: 'Half-sheet multi-sticker grid',
    paper_size: 'A5',
    label_width_mm: 45,
    label_height_mm: 34,
    columns: 3,
  },
] as const

const STORAGE_KEY = 'store_sticker_template'

export function useStickerTemplate() {
  const stickerTemplate = useState<StickerTemplateConfig>('global_sticker_template', () => ({
    ...DEFAULT_STICKER_TEMPLATE,
  }))
  const isLoaded = useState<boolean>('global_sticker_template_loaded', () => false)
  const loading = useState<boolean>('global_sticker_template_loading', () => false)

  async function loadStickerTemplate(force = false) {
    if (!import.meta.client) return stickerTemplate.value

    if (!force && !isLoaded.value) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          stickerTemplate.value = {
            ...DEFAULT_STICKER_TEMPLATE,
            ...JSON.parse(cached),
          }
        }
      } catch {
        // ignore cache error
      }
    }

    if (isLoaded.value && !force) return stickerTemplate.value

    loading.value = true
    try {
      const settingsApi = useSystemSettingsApi()
      const data = await settingsApi.getStickerSettings()
      if (data && typeof data === 'object') {
        stickerTemplate.value = {
          ...DEFAULT_STICKER_TEMPLATE,
          ...stickerTemplate.value,
          ...data,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stickerTemplate.value))
      }
    } catch {
      // Fallback to cached or default
    } finally {
      isLoaded.value = true
      loading.value = false
    }
    return stickerTemplate.value
  }

  async function saveStickerTemplate(payload: Partial<StickerTemplateConfig>) {
    const merged: StickerTemplateConfig = {
      ...DEFAULT_STICKER_TEMPLATE,
      ...stickerTemplate.value,
      ...payload,
    }
    stickerTemplate.value = merged
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    }
    const settingsApi = useSystemSettingsApi()
    const saved = await settingsApi.updateStickerSettings(merged)
    if (saved && typeof saved === 'object') {
      stickerTemplate.value = {
        ...merged,
        ...saved,
      }
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stickerTemplate.value))
      }
    }
    isLoaded.value = true
    return stickerTemplate.value
  }

  return {
    stickerTemplate,
    isLoaded,
    loading,
    loadStickerTemplate,
    saveStickerTemplate,
    defaultStickerTemplate: DEFAULT_STICKER_TEMPLATE,
    stickerPresets: STICKER_PRESET_DEFINITIONS,
  }
}

