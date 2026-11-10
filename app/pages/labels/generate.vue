<template>
  <div class="page-root">
    <!-- Header (no-print) -->
    <PageHeader
      class="no-print"
      title="បោះពុម្ពស្លាកទំនិញ • Product Sticker &amp; Label Studio"
      description="Modern Khmer garment stickers (50×30mm, 40×30mm, 60×40mm) with Code-128 barcode &amp; UTF-8 Khmer typography"
      back-to="/labels"
      back-label="Labels &amp; Barcodes"
    >
      <template #actions>
        <AppButton
          variant="default"
          :loading="generating"
          :disabled="selectedIds.length === 0"
          @click="generateLabelsPdf"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-arrow-down-tray" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">ទាញយក PDF ({{ totalLabels }})</span>
        </AppButton>

        <AppButton
          variant="primary"
          :disabled="selectedIds.length === 0"
          @click="printStickersBrowser"
        >
          <template #icon-left>
            <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពស្លាកទំនិញ (Print Product Label • {{ totalLabels }})</span>
        </AppButton>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-4 items-start no-print">
      <!-- Left: Variant Selector & Sticker Configuration -->
      <div class="flex flex-col gap-4 min-w-0">
        <!-- Sticker Format Settings -->
        <AppCard title="1. ទំហំស្លាកទំនិញ & ការកំណត់ (Sticker Format & Printer Setup)">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="form-field col-span-2">
              <label class="field-label kh-text">ទំហំស្លាកទំនិញ (Label Size Preset)</label>
              <AppSelect
                v-model="settings.paper_size"
                :options="paperPresetOptions"
                @update:model-value="onPresetChange"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Sticker Width (mm)</label>
              <input v-model.number="settings.label_width_mm" type="number" min="25" max="100" class="field-input" />
            </div>

            <div class="form-field">
              <label class="field-label">Sticker Height (mm)</label>
              <input v-model.number="settings.label_height_mm" type="number" min="18" max="80" class="field-input" />
            </div>

            <div class="form-field">
              <label class="field-label">Barcode Format</label>
              <AppSelect
                v-model="settings.code_type"
                :options="[
                  { label: 'Code-128 Barcode (Standard Retail)', value: 'BARCODE' },
                  { label: 'QR Code (2D)', value: 'QR' },
                ]"
              />
            </div>

            <div class="form-field">
              <label class="field-label">Sheet Columns</label>
              <input
                v-model.number="settings.columns"
                type="number"
                :min="1"
                :max="6"
                :disabled="isThermalRollMode"
                class="field-input"
              />
            </div>

            <div class="form-field col-span-2">
              <label class="field-label kh-text">ឈ្មោះហាងលើស្លាក (Store Header)</label>
              <input
                v-model="settings.store_name_override"
                type="text"
                placeholder="គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ "
                class="field-input kh-text"
              />
            </div>

            <div class="form-field col-span-2">
              <label class="checkbox-row">
                <input v-model="settings.show_khr" type="checkbox" class="native-checkbox" />
                <span>Show Secondary KHR Price (1 USD = 4,100 ៛)</span>
              </label>
            </div>
          </div>
        </AppCard>

        <!-- Variant Selector -->
        <AppCard title="2. ជ្រើសរើសទំនិញ & ចំនួនស្លាក (Select Variants & Quantities)">
          <div class="selector-toolbar">
            <div class="search-wrap">
              <SearchBar
                v-model="productSearch"
                placeholder="ស្វែងរក ឬ ស្កេនកូដទំនិញ (Search or scan SKU, barcode, QR)..."
                @scan="handleScanSelectVariant"
              />
            </div>
            <div class="toolbar-btns">
              <AppButton size="sm" variant="ghost" @click="selectAllFiltered">Select Visible</AppButton>
              <AppButton v-if="selectedIds.length > 0" size="sm" variant="ghost" @click="selectedIds = []">
                Clear ({{ selectedIds.length }})
              </AppButton>
            </div>
          </div>

          <div v-if="loadingVariants" class="empty-box">
            Loading product variants...
          </div>

          <div v-else-if="filteredVariants.length === 0" class="empty-box">
            No matching product variants found.
          </div>

          <div v-else class="variant-list">
            <div
              v-for="variant in filteredVariants"
              :key="variant.id"
              class="variant-item"
              :class="{ 'is-selected': isSelected(variant.id) }"
              @click="toggleVariant(variant.id)"
            >
              <input
                type="checkbox"
                class="native-checkbox"
                :checked="isSelected(variant.id)"
                @click.stop="toggleVariant(variant.id)"
              />

              <div class="variant-info">
                <div class="variant-name kh-text">{{ variant.product?.name || variant.sku }}</div>
                <div class="variant-meta kh-text">
                  <span class="mono">{{ variant.sku }}</span>
                  <span v-if="variant.color?.name || variant.size?.name">
                    &bull; {{ [variant.color?.name, variant.size?.name].filter(Boolean).join(' / ') }}
                  </span>
                  <span>&bull; <strong>${{ Number(variant.selling_price).toFixed(2) }}</strong></span>
                </div>
              </div>

              <div class="qty-control" @click.stop>
                <button type="button" class="qty-btn" @click="stepQty(variant.id, -1)">
                  <UIcon name="i-heroicons-minus" class="w-3 h-3" />
                </button>
                <input
                  v-model.number="quantities[variant.id]"
                  type="number"
                  min="1"
                  max="500"
                  class="qty-input"
                />
                <button type="button" class="qty-btn" @click="stepQty(variant.id, 1)">
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right: Live Sticker Preview -->
      <div class="flex flex-col gap-4 min-w-0">
        <AppCard title="3. មើលស្លាកទំនិញមុនបោះពុម្ព (Live Khmer Sticker Preview)">
          <div class="preview-summary">
            <span>
              <strong>{{ selectedIds.length }}</strong> variant(s) &bull;
              <strong>{{ totalLabels }}</strong> total sticker(s) &bull;
              {{ settings.label_width_mm }}×{{ settings.label_height_mm }} mm
            </span>
            <span class="preview-mode-tag">
              {{ isThermalRollMode ? 'Thermal Roll (1 per label)' : `${settings.paper_size} Sheet (${settings.columns} cols)` }}
            </span>
          </div>

          <div v-if="expandedPreviewStickers.length === 0" class="flex flex-col items-center justify-center gap-2 py-14 px-5 text-ink-tertiary text-[12.5px] text-center">
            <UIcon name="i-heroicons-tag" class="w-8 h-8" />
            <p>Check one or more variants on the left to preview product stickers.</p>
          </div>

          <div v-else class="bg-slate-100 border border-border-subtle rounded-md p-5 max-h-[620px] overflow-auto flex justify-center">
            <div
              class="preview-grid"
              :class="isThermalRollMode ? 'is-thermal' : 'is-sheet'"
              :style="{
                '--sticker-w': `${settings.label_width_mm}mm`,
                '--sticker-h': `${settings.label_height_mm}mm`,
              }"
            >
              <div
                v-for="(v, idx) in expandedPreviewStickers.slice(0, 40)"
                :key="`${v.id}_${idx}`"
                class="kh-product-sticker"
                :class="`size-${settings.label_width_mm}x${settings.label_height_mm}`"
              >
                <div class="kh-sticker__store">
                  {{ settings.store_name_override.trim() || defaultBrandHeader }}
                </div>

                <div class="kh-sticker__product-name">
                  {{ v.product?.name || v.sku }}
                </div>

                <div class="kh-sticker__info-row">
                  <div class="kh-sticker__meta">
                    <div class="kh-sticker__sku-line">
                      SKU: <span class="mono font-bold">{{ v.sku }}</span>
                    </div>
                    <div class="kh-sticker__variant-line">
                      <span>ពណ៌: <strong>{{ v.color?.name || 'ទូទៅ' }}</strong></span>
                      <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ v.size?.name || 'Free' }}</strong></span>
                    </div>
                  </div>

                  <div class="kh-sticker__price-box">
                    <div class="kh-sticker__price-usd">${{ Number(v.selling_price).toFixed(2) }}</div>
                    <div v-if="settings.show_khr" class="kh-sticker__price-khr">{{ formatRiel(Number(v.selling_price)) }}</div>
                  </div>
                </div>

                <div v-if="settings.code_type === 'BARCODE'" class="kh-sticker__barcode-zone">
                  <div class="kh-sticker__barcode-wrap">
                    <img :src="generateBarcodeSvgDataUri(v.barcode || v.sku)" :alt="v.barcode || v.sku" class="kh-sticker__barcode-img" />
                  </div>
                  <div class="kh-sticker__barcode-text">
                    {{ v.barcode || v.sku }}
                  </div>
                </div>

                <div v-else class="kh-sticker__qr-zone">
                  <img :src="generateQrSvgDataUri(v.qr_reference || v.barcode || v.sku)" :alt="v.sku" class="kh-sticker__qr-img" />
                  <div class="kh-sticker__barcode-text">
                    {{ v.barcode || v.sku }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Dedicated Print-Only Output Area -->
    <div
      id="admin-printable-stickers"
      class="print-only-stickers"
      :class="isThermalRollMode ? 'is-thermal-print' : 'is-sheet-print'"
      :style="{
        '--sticker-w': `${settings.label_width_mm}mm`,
        '--sticker-h': `${settings.label_height_mm}mm`,
        '--sheet-cols': String(settings.columns || 4),
      }"
    >
      <div
        v-for="(v, idx) in expandedPreviewStickers"
        :key="`print_${v.id}_${idx}`"
        class="kh-product-sticker"
        :class="`size-${settings.label_width_mm}x${settings.label_height_mm}`"
      >
        <div class="kh-sticker__store">
          {{ settings.store_name_override.trim() || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់ ' }}
        </div>

        <div class="kh-sticker__product-name">
          {{ v.product?.name || v.sku }}
        </div>

        <div class="kh-sticker__info-row">
          <div class="kh-sticker__meta">
            <div class="kh-sticker__sku-line">
              SKU: <span class="mono font-bold">{{ v.sku }}</span>
            </div>
            <div class="kh-sticker__variant-line">
              <span>ពណ៌: <strong>{{ v.color?.name || 'ទូទៅ' }}</strong></span>
              <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ v.size?.name || 'Free' }}</strong></span>
            </div>
          </div>

          <div class="kh-sticker__price-box">
            <div class="kh-sticker__price-usd">${{ Number(v.selling_price).toFixed(2) }}</div>
            <div v-if="settings.show_khr" class="kh-sticker__price-khr">{{ formatRiel(Number(v.selling_price)) }}</div>
          </div>
        </div>

        <div v-if="settings.code_type === 'BARCODE'" class="kh-sticker__barcode-zone">
          <div class="kh-sticker__barcode-wrap">
            <img :src="generateBarcodeSvgDataUri(v.barcode || v.sku)" :alt="v.barcode || v.sku" class="kh-sticker__barcode-img" />
          </div>
          <div class="kh-sticker__barcode-text">
            {{ v.barcode || v.sku }}
          </div>
        </div>

        <div v-else class="kh-sticker__qr-zone">
          <img :src="generateQrSvgDataUri(v.qr_reference || v.barcode || v.sku)" :alt="v.sku" class="kh-sticker__qr-img" />
          <div class="kh-sticker__barcode-text">
            {{ v.barcode || v.sku }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductVariant } from '~/types'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'
import { generateBarcodeSvgDataUri, generateQrSvgDataUri } from '~/utils/labelSvg'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Generate Product Stickers — Clothing Store' })

const route = useRoute()
const { listVariants } = useVariantApi()
const { generateLabels } = useLabelApi()
const { brand, loadBrand } = useBrand()
const { stickerTemplate, loadStickerTemplate } = useStickerTemplate()
const { addToast } = useAppToast()

const defaultBrandHeader = computed(
  () =>
    stickerTemplate.value.store_header?.trim() ||
    brand.value.store_name_kh?.trim() ||
    brand.value.store_name?.trim() ||
    'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់',
)

const productSearch = ref('')
const allVariants = ref<ProductVariant[]>([])
const selectedIds = ref<string[]>([])
const quantities = reactive<Record<string, number>>({})
const loadingVariants = ref(true)
const generating = ref(false)

const paperPresetOptions = [
  { label: 'Thermal Sticker Roll — 50 × 30 mm (Default)', value: 'THERMAL_50x30' },
  { label: 'Thermal Sticker Roll — 40 × 30 mm (Compact)', value: 'THERMAL_40x30' },
  { label: 'Thermal Sticker Roll — 60 × 40 mm (Large)', value: 'THERMAL_60x40' },
  { label: 'A4 Sticker Sheet (Grid — 4 Columns • 50 × 30 mm)', value: 'A4' },
  { label: 'A5 Sticker Sheet (Grid — 3 Columns)', value: 'A5' },
]

const settings = reactive({
  paper_size: 'THERMAL_50x30',
  label_width_mm: 50,
  label_height_mm: 30,
  columns: 1,
  code_type: 'BARCODE',
  show_khr: false,
  store_name_override: '',
})

const isThermalRollMode = computed(() =>
  ['THERMAL_50x30', 'THERMAL_40x30', 'THERMAL_60x40', 'CUSTOM_58mm', 'CUSTOM_80mm'].includes(settings.paper_size) || settings.columns === 1,
)

function onPresetChange(preset: string) {
  if (preset === 'THERMAL_50x30') {
    settings.label_width_mm = 50
    settings.label_height_mm = 30
    settings.columns = 1
  } else if (preset === 'THERMAL_40x30') {
    settings.label_width_mm = 40
    settings.label_height_mm = 30
    settings.columns = 1
  } else if (preset === 'THERMAL_60x40') {
    settings.label_width_mm = 60
    settings.label_height_mm = 40
    settings.columns = 1
  } else if (preset === 'A4') {
    settings.label_width_mm = 48
    settings.label_height_mm = 30
    settings.columns = 4
  } else if (preset === 'A5') {
    settings.label_width_mm = 45
    settings.label_height_mm = 28
    settings.columns = 3
  }
}

const filteredVariants = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return allVariants.value
  return allVariants.value.filter(
    v =>
      v.product?.name?.toLowerCase().includes(q) ||
      v.sku?.toLowerCase().includes(q) ||
      v.barcode?.toLowerCase().includes(q) ||
      v.qr_reference?.toLowerCase().includes(q) ||
      v.color?.name?.toLowerCase().includes(q) ||
      v.size?.name?.toLowerCase().includes(q),
  )
})

function handleScanSelectVariant(scannedCode: string) {
  const clean = scannedCode.trim().toLowerCase()
  if (!clean) return
  const exact = allVariants.value.find(
    v =>
      v.barcode?.toLowerCase() === clean ||
      v.sku?.toLowerCase() === clean ||
      v.qr_reference?.toLowerCase() === clean,
  )
  if (exact) {
    if (!selectedIds.value.includes(exact.id)) {
      selectedIds.value.push(exact.id)
      quantities[exact.id] = Math.max(1, quantities[exact.id] || 1)
    } else {
      quantities[exact.id] = Math.min(500, (quantities[exact.id] || 1) + 1)
    }
    productSearch.value = ''
    addToast({
      type: 'success',
      title: 'Variant Queued for Sticker Print',
      message: `${exact.product?.name || exact.sku} (${exact.sku}) — ${quantities[exact.id]}x`,
    })
  }
}

const totalLabels = computed(() =>
  selectedIds.value.reduce((sum, id) => sum + Math.max(1, quantities[id] || 1), 0),
)

const expandedPreviewStickers = computed(() => {
  const list: ProductVariant[] = []
  const map = new Map(allVariants.value.map(v => [v.id, v]))
  for (const id of selectedIds.value) {
    const v = map.get(id)
    if (!v) continue
    const count = Math.min(500, Math.max(1, quantities[id] || 1))
    for (let i = 0; i < count; i++) {
      list.push(v)
    }
  }
  return list
})

function isSelected(id: string): boolean {
  return selectedIds.value.includes(id)
}

function toggleVariant(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
    if (!quantities[id] || quantities[id] < 1) quantities[id] = 1
  }
}

function stepQty(id: string, delta: number) {
  const next = Math.max(1, Math.min(500, (quantities[id] || 1) + delta))
  quantities[id] = next
  if (!isSelected(id)) {
    selectedIds.value.push(id)
  }
}

function selectAllFiltered() {
  const ids = new Set(selectedIds.value)
  for (const v of filteredVariants.value) {
    ids.add(v.id)
    if (!quantities[v.id]) quantities[v.id] = 1
  }
  selectedIds.value = Array.from(ids)
}

function formatRiel(usd: number): string {
  const rate = Number(stickerTemplate.value.khr_exchange_rate) || 4100
  return `${Math.round(usd * rate).toLocaleString()} ៛`
}

onMounted(async () => {
  loadBrand().catch(() => {})
  const tpl = await loadStickerTemplate()
  if (tpl) {
    settings.paper_size = tpl.paper_size || 'THERMAL_50x30'
    settings.label_width_mm = Number(tpl.label_width_mm) || 50
    settings.label_height_mm = Number(tpl.label_height_mm) || 30
    settings.columns = Number(tpl.columns) || 1
    settings.code_type = tpl.code_type || 'BARCODE'
    settings.show_khr = tpl.show_khr ?? true
    settings.store_name_override = tpl.store_header || defaultBrandHeader.value
  }

  const qPreset = typeof route.query.preset === 'string' ? route.query.preset : ''
  if (qPreset) {
    settings.paper_size = qPreset
    onPresetChange(qPreset)
  }

  try {
    const variants = (await listVariants({ limit: 300 })) as ProductVariant[]
    allVariants.value = variants || []
    const defaultQty = Math.max(1, Number(tpl?.default_copies) || 1)
    for (const v of allVariants.value) {
      quantities[v.id] = defaultQty
    }

    const qVariantId = typeof route.query.variant_id === 'string' ? route.query.variant_id : ''
    const qProductId = typeof route.query.product_id === 'string' ? route.query.product_id : ''
    if (qVariantId && allVariants.value.some(v => v.id === qVariantId)) {
      selectedIds.value = [qVariantId]
    } else if (qProductId) {
      selectedIds.value = allVariants.value.filter(v => v.product_id === qProductId).map(v => v.id)
    } else if (allVariants.value.length > 0) {
      selectedIds.value = [allVariants.value[0]!.id]
    }
  } catch (err: any) {
    addToast({ type: 'error', title: 'Failed to load variants', message: err?.message || String(err) })
  } finally {
    loadingVariants.value = false
  }
})

async function printStickersBrowser() {
  await printWithKhmerFonts({
    printContainerId: 'admin-printable-stickers',
    pageWidthMm: Number(settings.label_width_mm) || 50,
    pageHeightMm: Number(settings.label_height_mm) || 30,
    isA4Sheet: settings.paper_size === 'A4',
  })
}

async function generateLabelsPdf() {
  if (selectedIds.value.length === 0) return
  generating.value = true
  try {
    const body = {
      variants: selectedIds.value.map(id => ({
        variant_id: id,
        quantity: Math.max(1, quantities[id] || 1),
      })),
      paper_size: settings.paper_size,
      label_width_mm: settings.label_width_mm,
      label_height_mm: settings.label_height_mm,
      columns: settings.columns,
      code_type: settings.code_type,
      show_khr: settings.show_khr,
      store_name_override: settings.store_name_override.trim() || null,
    }

    const blob = await generateLabels(body)
    const url = URL.createObjectURL(blob as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `khmer-product-labels-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'PDF Generated', message: `${totalLabels.value} product sticker(s) downloaded` })
  } catch (err: any) {
    console.error(err)
    addToast({ type: 'error', title: 'Failed to generate labels PDF', message: err?.message || 'Please try again' })
  } finally {
    generating.value = false
  }
}
</script>


