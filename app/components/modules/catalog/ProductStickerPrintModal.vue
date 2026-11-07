<template>
  <AppModal
    :model-value="modelValue"
    title="បោះពុម្ពស្លាកទំនិញ (Print Product Sticker)"
    size="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="variant" class="sticker-modal-root no-print">
      <!-- Top Controls Grid -->
      <div class="sticker-controls-grid">
        <!-- Code Format -->
        <div class="control-group">
          <label class="control-label">Code Format (ប្រភេទកូដ)</label>
          <div class="segmented-pills">
            <button
              type="button"
              class="seg-pill"
              :class="{ 'is-active': codeType === 'BARCODE' }"
              @click="codeType = 'BARCODE'"
            >
              <UIcon name="i-heroicons-bars-3-bottom-left" class="w-3.5 h-3.5" />
              <span>1D Barcode</span>
            </button>
            <button
              type="button"
              class="seg-pill"
              :class="{ 'is-active': codeType === 'QR' }"
              @click="codeType = 'QR'"
            >
              <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
              <span>2D QR Code</span>
            </button>
          </div>
        </div>

        <!-- Sticker Size Preset -->
        <div class="control-group">
          <label class="control-label">Label Size (ទំហំស្លាក)</label>
          <div class="segmented-pills">
            <button
              v-for="p in sizePresets"
              :key="p.id"
              type="button"
              class="seg-pill"
              :class="{ 'is-active': preset === p.id }"
              @click="preset = p.id"
            >
              {{ p.shortLabel }}
            </button>
          </div>
        </div>
      </div>

      <!-- Copies & KHR Row -->
      <div class="sticker-copies-bar">
        <div class="copies-left">
          <span class="control-label mb-0">Copies to Print (ចំនួនស្លាក):</span>
          <div class="qty-stepper">
            <button type="button" class="qty-btn" @click="copies = Math.max(1, copies - 1)">
              <UIcon name="i-heroicons-minus" class="w-3.5 h-3.5" />
            </button>
            <input
              v-model.number="copies"
              type="number"
              min="1"
              max="500"
              class="qty-input mono"
            />
            <button type="button" class="qty-btn" @click="copies = Math.min(500, copies + 1)">
              <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="quick-qty-group">
            <button
              v-for="q in [1, 5, 10, 20]"
              :key="q"
              type="button"
              class="quick-qty-btn"
              :class="{ 'is-active': copies === q }"
              @click="copies = q"
            >
              {{ q }}×
            </button>
          </div>
        </div>

        <label class="khr-toggle">
          <input v-model="showKhr" type="checkbox" />
          <span>Show KHR (៛)</span>
        </label>
      </div>

      <!-- Live Thermal Sticker Preview Stage -->
      <div class="sticker-preview-stage">
        <div
          class="kh-product-sticker"
          :class="`size-${labelWidthMm}x${labelHeightMm}`"
          :style="{
            '--sticker-w': `${labelWidthMm}mm`,
            '--sticker-h': `${labelHeightMm}mm`,
          }"
        >
          <div v-if="stickerTemplate.show_store_header" class="kh-sticker__store">
            {{ resolvedStoreHeader }}
          </div>

          <div v-if="stickerTemplate.show_product_name" class="kh-sticker__product-name">
            {{ resolvedProductName }}
          </div>

          <div class="kh-sticker__info-row">
            <div class="kh-sticker__meta">
              <div v-if="stickerTemplate.show_sku" class="kh-sticker__sku-line">
                SKU: <span class="mono font-bold">{{ variant.sku }}</span>
              </div>
              <div v-if="stickerTemplate.show_variant_attrs" class="kh-sticker__variant-line">
                <span>ពណ៌: <strong>{{ variant.color?.name || 'ទូទៅ' }}</strong></span>
                <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ variant.size?.name || 'Free' }}</strong></span>
              </div>
            </div>

            <div class="kh-sticker__price-box">
              <div v-if="stickerTemplate.show_price_usd" class="kh-sticker__price-usd">${{ Number(variant.selling_price || 0).toFixed(2) }}</div>
              <div v-if="showKhr" class="kh-sticker__price-khr">{{ formatRiel(Number(variant.selling_price || 0)) }}</div>
            </div>
          </div>

          <div v-if="codeType === 'BARCODE'" class="kh-sticker__barcode-zone">
            <div class="kh-sticker__barcode-wrap">
              <img
                :src="generateBarcodeSvgDataUri(variant.barcode || variant.sku)"
                :alt="variant.barcode || variant.sku"
                class="kh-sticker__barcode-img"
              />
            </div>
            <div class="kh-sticker__barcode-text">
              {{ variant.barcode || variant.sku }}
            </div>
          </div>

          <div v-else class="kh-sticker__qr-zone">
            <img
              :src="generateQrSvgDataUri(variant.qr_reference || variant.barcode || variant.sku)"
              :alt="variant.qr_reference"
              class="kh-sticker__qr-img"
            />
            <div class="kh-sticker__barcode-text">
              {{ variant.qr_reference }}
            </div>
          </div>
        </div>
      </div>

      <!-- Scan Readiness Info Banner -->
      <div class="scan-ready-banner">
        <UIcon name="i-heroicons-check-circle" class="w-4 h-4 text-slate-700 flex-shrink-0" />
        <div class="text-xs text-slate-600 leading-relaxed">
          <strong>One-Scan Ready:</strong> Scanning either the 1D Barcode
          (<span class="mono font-semibold">{{ variant.barcode || variant.sku }}</span>)
          or 2D QR (<span class="mono font-semibold">{{ variant.qr_reference }}</span>)
          adds this item directly to the Cashier POS cart and works in Scan-to-Search.
        </div>
      </div>
    </div>

    <template #footer>
      <div class="sticker-modal-footer no-print">
        <div class="footer-left">
          <AppButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-squares-2x2"
            label="Batch Studio"
            @click="openInBatchStudio"
          />
          <AppButton
            variant="secondary"
            size="sm"
            icon="i-heroicons-arrow-down-tray"
            :loading="downloadingPdf"
            label="Download PDF"
            @click="handleDownloadPdf"
          />
        </div>
        <div class="footer-right">
          <AppButton
            variant="secondary"
            size="sm"
            label="Close"
            @click="$emit('update:modelValue', false)"
          />
          <AppButton
            variant="primary"
            size="sm"
            icon="i-heroicons-printer"
            :label="`Print Sticker (${copies})`"
            @click="handleInstantPrint"
          />
        </div>
      </div>
    </template>

    <!-- Hidden Print-Only Container Teleported to Body During Print -->
    <Teleport to="body">
      <div
        v-if="modelValue && variant"
        id="admin-instant-print-stickers"
        class="instant-print-only"
        :class="preset === 'A4' ? 'is-sheet-print' : 'is-thermal-print'"
        :style="{
          '--sticker-w': `${labelWidthMm}mm`,
          '--sticker-h': `${labelHeightMm}mm`,
          '--sheet-cols': preset === 'A4' ? 4 : 1,
        }"
      >
        <div
          v-for="idx in safeCopiesCount"
          :key="`${variant.id}_${idx}`"
          class="kh-product-sticker"
          :class="`size-${labelWidthMm}x${labelHeightMm}`"
        >
          <div v-if="stickerTemplate.show_store_header" class="kh-sticker__store">
            {{ resolvedStoreHeader }}
          </div>
          <div v-if="stickerTemplate.show_product_name" class="kh-sticker__product-name">
            {{ resolvedProductName }}
          </div>
          <div class="kh-sticker__info-row">
            <div class="kh-sticker__meta">
              <div v-if="stickerTemplate.show_sku" class="kh-sticker__sku-line">
                SKU: <span class="mono font-bold">{{ variant.sku }}</span>
              </div>
              <div v-if="stickerTemplate.show_variant_attrs" class="kh-sticker__variant-line">
                <span>ពណ៌: <strong>{{ variant.color?.name || 'ទូទៅ' }}</strong></span>
                <span class="kh-sticker__var-sep">ទំហំ: <strong>{{ variant.size?.name || 'Free' }}</strong></span>
              </div>
            </div>
            <div class="kh-sticker__price-box">
              <div v-if="stickerTemplate.show_price_usd" class="kh-sticker__price-usd">${{ Number(variant.selling_price || 0).toFixed(2) }}</div>
              <div v-if="showKhr" class="kh-sticker__price-khr">{{ formatRiel(Number(variant.selling_price || 0)) }}</div>
            </div>
          </div>

          <div v-if="codeType === 'BARCODE'" class="kh-sticker__barcode-zone">
            <div class="kh-sticker__barcode-wrap">
              <img
                :src="generateBarcodeSvgDataUri(variant.barcode || variant.sku)"
                :alt="variant.barcode || variant.sku"
                class="kh-sticker__barcode-img"
              />
            </div>
            <div class="kh-sticker__barcode-text">
              {{ variant.barcode || variant.sku }}
            </div>
          </div>

          <div v-else class="kh-sticker__qr-zone">
            <img
              :src="generateQrSvgDataUri(variant.qr_reference || variant.barcode || variant.sku)"
              :alt="variant.qr_reference"
              class="kh-sticker__qr-img"
            />
            <div class="kh-sticker__barcode-text">
              {{ variant.qr_reference }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </AppModal>
</template>

<script setup lang="ts">
import type { ProductVariant } from '~/types'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'
import { generateBarcodeSvgDataUri, generateQrSvgDataUri } from '~/utils/labelSvg'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    variant: ProductVariant | null
    productName?: string
    initialCopies?: number
  }>(),
  {
    modelValue: false,
    variant: null,
    productName: '',
    initialCopies: 1,
  },
)

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const { generateLabels } = useLabelApi()
const { brand, loadBrand } = useBrand()
const { stickerTemplate, loadStickerTemplate } = useStickerTemplate()
const { addToast } = useAppToast()

const codeType = ref<'BARCODE' | 'QR'>('BARCODE')
const preset = ref<'THERMAL_50x30' | 'THERMAL_40x30' | 'THERMAL_60x40' | 'A4'>('THERMAL_50x30')
const copies = ref(1)
const showKhr = ref(true)
const downloadingPdf = ref(false)

const sizePresets = [
  { id: 'THERMAL_50x30' as const, shortLabel: '50×30mm', w: 50, h: 30, cols: 1 },
  { id: 'THERMAL_40x30' as const, shortLabel: '40×30mm', w: 40, h: 30, cols: 1 },
  { id: 'THERMAL_60x40' as const, shortLabel: '60×40mm', w: 60, h: 40, cols: 1 },
  { id: 'A4' as const, shortLabel: 'A4 Sheet', w: 48, h: 30, cols: 4 },
]

const activePresetObj = computed(() => sizePresets.find(p => p.id === preset.value) || sizePresets[0]!)
const labelWidthMm = computed(() => activePresetObj.value.w)
const labelHeightMm = computed(() => activePresetObj.value.h)
const safeCopiesCount = computed(() => Math.min(500, Math.max(1, Number(copies.value) || 1)))

const resolvedStoreHeader = computed(() => {
  return (
    stickerTemplate.value.store_header?.trim() ||
    brand.value.store_name_kh?.trim() ||
    brand.value.store_name?.trim() ||
    'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់'
  )
})

const resolvedProductName = computed(() => {
  return props.productName || props.variant?.product?.name || props.variant?.sku || ''
})

function formatRiel(usd: number): string {
  const rate = Number(stickerTemplate.value.khr_exchange_rate) || 4100
  return `${Math.round(usd * rate).toLocaleString()} ៛`
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      loadBrand().catch(() => {})
      const tpl = await loadStickerTemplate()
      if (tpl.code_type === 'QR' || tpl.code_type === 'BARCODE') {
        codeType.value = tpl.code_type
      }
      if (sizePresets.some(p => p.id === tpl.paper_size)) {
        preset.value = tpl.paper_size as any
      }
      showKhr.value = tpl.show_khr ?? true
      copies.value = Math.max(1, props.initialCopies || tpl.default_copies || 1)
    }
  },
)

async function handleInstantPrint() {
  await printWithKhmerFonts({
    printContainerId: 'admin-instant-print-stickers',
    pageWidthMm: Number(labelWidthMm.value) || 50,
    pageHeightMm: Number(labelHeightMm.value) || 30,
    isA4Sheet: preset.value === 'A4',
  })
}

async function handleDownloadPdf() {
  if (!props.variant) return
  downloadingPdf.value = true
  try {
    const body = {
      variants: [{ variant_id: props.variant.id, quantity: safeCopiesCount.value }],
      paper_size: preset.value,
      label_width_mm: labelWidthMm.value,
      label_height_mm: labelHeightMm.value,
      columns: activePresetObj.value.cols,
      code_type: codeType.value,
      show_khr: showKhr.value,
      store_name_override: resolvedStoreHeader.value,
    }
    const blob = await generateLabels(body)
    const url = URL.createObjectURL(blob as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sticker-${props.variant.sku}.pdf`
    a.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', title: 'PDF Downloaded', message: `${safeCopiesCount.value} sticker(s) generated` })
  } catch (err: any) {
    addToast({ type: 'error', title: 'Failed to generate PDF', message: err?.message || 'Please try again' })
  } finally {
    downloadingPdf.value = false
  }
}

function openInBatchStudio() {
  if (!props.variant) return
  emit('update:modelValue', false)
  navigateTo(`/labels/generate?variant_id=${props.variant.id}`)
}
</script>

<style scoped>
.sticker-modal-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sticker-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

@media (max-width: 560px) {
  .sticker-controls-grid {
    grid-template-columns: 1fr;
  }
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.control-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.segmented-pills {
  display: flex;
  gap: 4px;
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
  padding: 3px;
}

.seg-pill {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}

.seg-pill.is-active {
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-color: var(--border-subtle, #e5e7eb);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
}

.sticker-copies-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 12px;
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
}

.copies-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.qty-stepper {
  display: inline-flex;
  align-items: center;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text-secondary, #475569);
  cursor: pointer;
}

.qty-btn:hover {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.qty-input {
  width: 46px;
  height: 28px;
  text-align: center;
  border: none;
  border-left: 1px solid var(--border-subtle, #e5e7eb);
  border-right: 1px solid var(--border-subtle, #e5e7eb);
  font-size: 12.5px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  background: var(--surface-card, #ffffff);
}

.quick-qty-group {
  display: inline-flex;
  gap: 4px;
}

.quick-qty-btn {
  height: 26px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  color: var(--text-secondary, #475569);
  cursor: pointer;
}

.quick-qty-btn.is-active {
  background: var(--text-primary, #0f172a);
  color: #ffffff;
  border-color: var(--text-primary, #0f172a);
}

.khr-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  cursor: pointer;
}

.sticker-preview-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: #f1f5f9;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 8px;
}

.scan-ready-banner {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 12px;
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
}

.sticker-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 8px;
}

.footer-left,
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>

<style>
.instant-print-only {
  display: none;
}

@media print {
  @page {
    margin: 0;
  }

  body:has(#admin-instant-print-stickers) > *:not(#admin-instant-print-stickers) {
    display: none !important;
  }

  #admin-instant-print-stickers.instant-print-only {
    display: block !important;
  }

  #admin-instant-print-stickers.is-thermal-print .kh-product-sticker {
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    page-break-after: always !important;
    break-after: page !important;
  }

  #admin-instant-print-stickers.is-thermal-print .kh-product-sticker:last-child {
    page-break-after: auto !important;
    break-after: auto !important;
  }

  #admin-instant-print-stickers.is-sheet-print {
    display: grid !important;
    grid-template-columns: repeat(var(--sheet-cols, 4), var(--sticker-w, 48mm));
    gap: 2mm;
    padding: 4mm;
    justify-content: center;
  }
}
</style>
