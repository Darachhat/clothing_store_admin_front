<template>
  <div class="page-root">
    <AppPageHeader
      title="Create New Product"
      description="Create a KVC product with basic information, gallery images, dynamic attributes, pricing, and an automated Color × Size variant matrix."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: 'Create New Product' },
      ]"
    >
      <template #actions>
        <AppButton to="/products" variant="default" size="sm" icon="i-heroicons-arrow-left" label="Back to Products" />
      </template>
    </AppPageHeader>

    <ProductForm
      ref="formRef"
      v-model="form"
      cancel-to="/products"
      submit-label="Create Product"
      :primary-submit="!includeInitialVariant"
      :submitting="isSubmitting && !printAfterCreate"
      @submit="submitProduct(false)"
    >
      <!-- SECTION 5: PRICING -->
      <AppCard
        title="Section 5 — Pricing"
        subtitle="Set default cost and selling prices (USD). Individual variants can override these prices in the matrix below."
      >
        <template #actions>
          <span class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink-secondary">
            <UIcon name="i-heroicons-currency-dollar" class="w-3.5 h-3.5" />
            <span>Base Currency: USD</span>
          </span>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <AppInput
            id="default-cost-price"
            v-model="initialVariant.cost_price"
            type="number"
            label="Default Cost Price (USD)"
            step="0.01"
            min="0"
            placeholder="5.00"
            mono
            :error="costError"
          />
          <AppInput
            id="default-selling-price"
            v-model="initialVariant.selling_price"
            type="number"
            label="Default Selling Price (USD)"
            step="0.01"
            min="0.01"
            placeholder="12.00"
            mono
            required
            :error="priceError"
          />
          <div class="flex items-center gap-2">
            <AppButton
              v-if="variantMode === 'multi' && multiGridRows.length > 0"
              type="button"
              size="sm"
              variant="default"
              icon="i-heroicons-arrow-Path"
              label="Apply Default Prices to Matrix"
              @click="applyDefaultPricesToMatrix"
            />
          </div>
        </div>
      </AppCard>

      <!-- SECTION 4: VARIANT GENERATOR -->
      <AppCard
        title="Section 4 — Variant Generator"
        subtitle="Select available Colors and Sizes to automatically generate combinations, preview SKUs, and customize per-variant prices or barcodes."
      >
        <template #actions>
          <div class="flex items-center gap-3">
            <div v-if="includeInitialVariant" class="inline-flex rounded-lg border border-border-subtle bg-surface-inset p-0.5 text-xs">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition-colors"
                :class="variantMode === 'multi' ? 'bg-surface-card text-ink shadow-xs' : 'text-ink-secondary hover:text-ink'"
                @click="variantMode = 'multi'"
              >
                Variant Matrix Generator
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md font-medium transition-colors"
                :class="variantMode === 'single' ? 'bg-surface-card text-ink shadow-xs' : 'text-ink-secondary hover:text-ink'"
                @click="variantMode = 'single'"
              >
                Single / Standard Item
              </button>
            </div>
            <AppCheckbox
              id="include-initial-variant"
              v-model="includeInitialVariant"
              label="Generate variants now"
            />
          </div>
        </template>

        <div v-if="includeInitialVariant" class="flex flex-col gap-4">
          <!-- SINGLE / NO-MATRIX MODE -->
          <template v-if="variantMode === 'single'">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AppSelect
                id="variant-color"
                v-model="initialVariant.color_id"
                label="Color (Optional)"
                :options="colorOptions"
                placeholder="No Color / Standard"
              />
              <AppSelect
                id="variant-size"
                v-model="initialVariant.size_id"
                label="Size (Optional)"
                :options="sizeOptions"
                placeholder="Free Size / Standard"
              />
              <AppInput
                id="single-variant-sku"
                v-model="initialVariant.sku"
                label="SKU (Auto if blank)"
                :placeholder="singlePreviewSku"
                mono
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label for="variant-barcode" class="text-sm text-ink-secondary leading-tight">Barcode (Code 128 — Auto-generated if blank)</label>
                <div class="flex gap-2">
                  <AppInput
                    id="variant-barcode"
                    v-model="initialVariant.barcode"
                    class="flex-1"
                    placeholder="Auto 10-digit Code-128 (or scan tag)"
                    mono
                    clearable
                    data-barcode-scanner-target="true"
                    :error="barcodeError"
                    @blur="onBarcodeBlur"
                  />
                  <AppButton
                    type="button"
                    variant="default"
                    icon="i-heroicons-qr-code"
                    label="Scan"
                    @click="openScannerForSingle"
                  />
                </div>

                <div
                  v-if="barcodeConflict"
                  class="mt-1 p-3 rounded-lg bg-surface-inset border border-border-subtle text-xs flex flex-col gap-2"
                  role="alert"
                >
                  <div class="flex items-start gap-2">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
                    <div class="flex-1 min-w-0">
                      <div class="font-semibold text-ink">
                        Code <code class="mono">{{ initialVariant.barcode }}</code> is already in use
                      </div>
                      <p class="text-ink-secondary m-0 mt-0.5">
                        Assigned to <strong>{{ conflictProductName }}</strong>
                        (<code class="mono">{{ barcodeConflict.sku }}</code>).
                      </p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 justify-end">
                    <AppButton
                      type="button"
                      size="xs"
                      variant="default"
                      icon="i-heroicons-sparkles"
                      label="Clear & Auto-Generate"
                      @click="clearBarcodeConflict"
                    />
                    <AppButton
                      v-if="conflictProductId"
                      size="xs"
                      variant="secondary"
                      icon="i-heroicons-arrow-top-right-on-square"
                      label="Open Existing Variant"
                      :to="`/products/${conflictProductId}?tab=variants`"
                    />
                  </div>
                </div>
              </div>

              <AppSelect
                id="single-variant-image"
                v-model="initialVariant.image_url"
                label="Variant Image (Optional)"
                :options="galleryImageOptions"
                placeholder="Use primary product image"
              />
            </div>
          </template>

          <!-- MATRIX GENERATOR MODE -->
          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Colors Selector -->
              <div class="rounded-lg border border-border-subtle bg-surface-card p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider">Available Colors ({{ selectedColors.length }})</span>
                  <div class="text-xs text-ink-secondary space-x-2">
                    <button type="button" class="underline hover:text-ink" @click="selectedColors = rawColors.map(c => c.id)">Select All</button>
                    <button type="button" class="underline hover:text-ink" @click="selectedColors = []">Clear</button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  <button
                    v-for="c in rawColors"
                    :key="c.id"
                    type="button"
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                    :class="selectedColors.includes(c.id)
                      ? 'bg-ink text-white border-border-default'
                      : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                    @click="toggleMultiColor(c.id)"
                  >
                    <span
                      v-if="c.hex_code"
                      class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                      :style="{ background: c.hex_code }"
                    />
                    <span>{{ c.name }}</span>
                  </button>
                  <p v-if="rawColors.length === 0" class="text-xs text-ink-tertiary italic m-0">No colors configured.</p>
                </div>
              </div>

              <!-- Sizes Selector -->
              <div class="rounded-lg border border-border-subtle bg-surface-card p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-ink uppercase tracking-wider">Available Sizes ({{ selectedSizes.length }})</span>
                  <div class="text-xs text-ink-secondary space-x-2">
                    <button type="button" class="underline hover:text-ink" @click="selectedSizes = rawSizes.map(s => s.id)">Select All</button>
                    <button type="button" class="underline hover:text-ink" @click="selectedSizes = []">Clear</button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  <button
                    v-for="s in rawSizes"
                    :key="s.id"
                    type="button"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                    :class="selectedSizes.includes(s.id)
                      ? 'bg-ink text-white border-border-default'
                      : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                    @click="toggleMultiSize(s.id)"
                  >
                    <span>{{ s.name }}</span>
                  </button>
                  <p v-if="rawSizes.length === 0" class="text-xs text-ink-tertiary italic m-0">No sizes configured.</p>
                </div>
              </div>
            </div>

            <!-- Matrix Summary & Bulk Controls -->
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2 text-xs">
              <div class="flex items-center gap-2 text-ink-secondary">
                <span>
                  Combinations: <strong class="text-ink">{{ includedMatrixRows.length }}</strong> active of {{ multiGridRows.length }} total
                </span>
                <span>·</span>
                <span>SKU Pattern: <code class="mono text-ink">{PRODUCT_CODE}-{COLOR}-{SIZE}</code></span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-check-circle"
                  label="Include All"
                  @click="setAllMatrixIncluded(true)"
                />
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-bolt"
                  label="Set All Active"
                  @click="setAllMatrixStatus('ACTIVE')"
                />
                <AppButton
                  type="button"
                  size="xs"
                  variant="default"
                  icon="i-heroicons-pause-circle"
                  label="Set All Inactive"
                  @click="setAllMatrixStatus('INACTIVE')"
                />
              </div>
            </div>

            <!-- Variant Matrix Table -->
            <div v-if="multiGridRows.length > 0" class="rounded-lg border border-border-subtle overflow-hidden">
              <div class="max-h-96 overflow-x-auto overflow-y-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead class="bg-surface-inset border-b border-border-subtle text-ink-secondary sticky top-0 z-10">
                    <tr>
                      <th class="py-2 px-2.5 font-medium w-10 text-center">Inc.</th>
                      <th class="py-2 px-2.5 font-medium">Color</th>
                      <th class="py-2 px-2.5 font-medium">Size</th>
                      <th class="py-2 px-2.5 font-medium min-w-[165px]">SKU</th>
                      <th class="py-2 px-2.5 font-medium w-28">Cost Price</th>
                      <th class="py-2 px-2.5 font-medium w-28">Selling Price</th>
                      <th class="py-2 px-2.5 font-medium min-w-[190px]">Barcode (Code 128)</th>
                      <th class="py-2 px-2.5 font-medium w-36">Variant Image</th>
                      <th class="py-2 px-2.5 font-medium w-28">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border-subtle">
                    <tr
                      v-for="row in multiGridRows"
                      :key="row.key"
                      class="bg-surface-card transition-opacity"
                      :class="!row.override.included ? 'opacity-45' : ''"
                    >
                      <td class="py-1.5 px-2.5 text-center">
                        <input
                          type="checkbox"
                          v-model="row.override.included"
                          class="h-4 w-4 rounded border-border-default text-ink cursor-pointer"
                          :aria-label="`Include ${row.colorName} ${row.sizeName}`"
                        />
                      </td>
                      <td class="py-1.5 px-2.5 font-medium text-ink whitespace-nowrap">
                        <div class="flex items-center gap-1.5">
                          <span
                            v-if="row.colorHex"
                            class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                            :style="{ background: row.colorHex }"
                          />
                          <span>{{ row.colorName }}</span>
                        </div>
                      </td>
                      <td class="py-1.5 px-2.5 font-medium text-ink whitespace-nowrap">
                        {{ row.sizeName }}
                      </td>
                      <td class="py-1.5 px-2.5">
                        <AppInput
                          :id="`sku-${row.key}`"
                          v-model="row.override.sku"
                          :placeholder="row.previewSku"
                          mono
                        />
                      </td>
                      <td class="py-1.5 px-2.5">
                        <AppInput
                          :id="`cost-${row.key}`"
                          v-model="row.override.cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          :placeholder="String(initialVariant.cost_price || '0.00')"
                          mono
                        />
                      </td>
                      <td class="py-1.5 px-2.5">
                        <AppInput
                          :id="`sell-${row.key}`"
                          v-model="row.override.selling_price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          :placeholder="String(initialVariant.selling_price || '0.00')"
                          mono
                        />
                      </td>
                      <td class="py-1.5 px-2.5">
                        <div class="flex items-center gap-1">
                          <AppInput
                            :id="`bc-${row.key}`"
                            v-model="row.override.barcode"
                            class="flex-1"
                            placeholder="Auto Code-128"
                            mono
                            clearable
                            data-barcode-scanner-target="true"
                            :error="row.override.error"
                            @blur="verifyRowBarcode(row.key)"
                          />
                          <AppButton
                            type="button"
                            size="xs"
                            variant="default"
                            icon="i-heroicons-qr-code"
                            aria-label="Scan barcode"
                            @click="openScannerForRow(row.key)"
                          />
                        </div>
                      </td>
                      <td class="py-1.5 px-2.5">
                        <AppSelect
                          :id="`img-${row.key}`"
                          v-model="row.override.image_url"
                          :options="galleryImageOptions"
                          placeholder="Default"
                        />
                      </td>
                      <td class="py-1.5 px-2.5">
                        <AppSelect
                          :id="`st-${row.key}`"
                          v-model="row.override.status_code"
                          :options="variantStatusOptions"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>

        <p v-else class="text-xs text-ink-secondary m-0 py-2">
          You can generate or add variants anytime from the Product Detail page after saving.
        </p>
      </AppCard>

      <template #actions>
        <AppButton
          v-if="includeInitialVariant"
          type="button"
          variant="primary"
          icon="i-heroicons-printer"
          :loading="isSubmitting && printAfterCreate"
          :disabled="isSubmitting || !!barcodeConflict"
          label="Create & Print Labels"
          class="w-full justify-center"
          @click="submitProduct(true)"
        />
      </template>
    </ProductForm>

    <BarcodeScannerModal
      v-model="showScannerModal"
      :auto-close-on-scan="true"
      @scanned="onBarcodeScanned"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectOption, ProductVariant, Color, Size } from '~/types'
import type { ProductFormState } from '~/components/modules/catalog/ProductForm.vue'
import { normalizeScannedCode } from '~/utils/scanCode'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'New Product — KVC Clothing Store Admin' })

const { createProduct, createVariantsBulk, scanCode } = useProductApi()
const { listColors, listSizes } = useCatalogApi()
const { addToast } = useAppToast()
const router = useRouter()

const formRef = ref<{ validate: () => boolean } | null>(null)
const isSubmitting = ref(false)
const printAfterCreate = ref(false)
const includeInitialVariant = ref(true)
const variantMode = ref<'single' | 'multi'>('multi')
const showScannerModal = ref(false)
const scannerTargetRowKey = ref<string | null>(null)
const attempted = ref(false)

const rawColors = ref<Color[]>([])
const rawSizes = ref<Size[]>([])
const colorOptions = ref<SelectOption[]>([])
const sizeOptions = ref<SelectOption[]>([])

const selectedColors = ref<string[]>([])
const selectedSizes = ref<string[]>([])

const variantStatusOptions: SelectOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const form = ref<ProductFormState>({
  name: '',
  code: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '',
  tags: [],
  images: [],
  attribute_value_ids: [],
})

const initialVariant = reactive({
  selling_price: '' as string | number,
  cost_price: '' as string | number,
  color_id: '',
  size_id: '',
  sku: '',
  barcode: '',
  image_url: '',
})

const galleryImageOptions = computed<SelectOption[]>(() => {
  const opts: SelectOption[] = [{ label: 'Primary Image', value: '' }]
  const imgs = form.value.images || []
  imgs.forEach((img, idx) => {
    opts.push({
      label: `Image #${idx + 1}${img.is_primary ? ' (Primary)' : ''}`,
      value: img.image_url,
    })
  })
  return opts
})

// SKU Preview Helpers matching backend format_color_code & format_size_code
const COLOR_ABBR: Record<string, string> = {
  BLACK: 'BLK',
  WHITE: 'WHT',
  GRAY: 'GRY',
  GREY: 'GRY',
  RED: 'RED',
  BLUE: 'BLU',
  NAVY: 'NVY',
  GREEN: 'GRN',
  YELLOW: 'YLW',
  PINK: 'PNK',
  PURPLE: 'PRP',
  BROWN: 'BRN',
  BEIGE: 'BGE',
  KHAKI: 'KHK',
  ORANGE: 'ORG',
  CREAM: 'CRM',
  OLIVE: 'OLV',
  MAROON: 'MRN',
  CHARCOAL: 'CHC',
  SILVER: 'SLV',
  GOLD: 'GLD',
}

function formatColorCode(name?: string | null): string {
  if (!name) return ''
  const upper = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (COLOR_ABBR[upper]) return COLOR_ABBR[upper]!
  return upper.slice(0, 3)
}

function formatSizeCode(name?: string | null): string {
  if (!name) return ''
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
}

function computePreviewSku(colorName?: string | null, sizeName?: string | null): string {
  const baseCode = (form.value.code || '').trim().toUpperCase() || 'PRD-XXX'
  const cCode = formatColorCode(colorName)
  const sCode = formatSizeCode(sizeName)
  const parts = [baseCode]
  if (cCode) parts.push(cCode)
  if (sCode) parts.push(sCode)
  if (parts.length === 1) parts.push('STD')
  return parts.join('-')
}

const singlePreviewSku = computed(() => {
  const cObj = rawColors.value.find(c => c.id === initialVariant.color_id)
  const sObj = rawSizes.value.find(s => s.id === initialVariant.size_id)
  return computePreviewSku(cObj?.name, sObj?.name)
})

interface RowOverride {
  included: boolean
  sku: string
  cost_price: string | number
  selling_price: string | number
  barcode: string
  image_url: string
  status_code: string
  error?: string
}
const rowOverrides = reactive<Record<string, RowOverride>>({})

function getRowOverride(key: string): RowOverride {
  if (!rowOverrides[key]) {
    rowOverrides[key] = {
      included: true,
      sku: '',
      cost_price: '',
      selling_price: '',
      barcode: '',
      image_url: '',
      status_code: 'ACTIVE',
      error: undefined,
    }
  }
  return rowOverrides[key]!
}

const multiGridRows = computed(() => {
  const cIds = selectedColors.value.length > 0 ? selectedColors.value : [null]
  const sIds = selectedSizes.value.length > 0 ? selectedSizes.value : [null]
  const rows: {
    key: string
    colorId: string | null
    sizeId: string | null
    colorName: string
    colorHex?: string | null
    sizeName: string
    previewSku: string
    override: RowOverride
  }[] = []

  for (const cId of cIds) {
    const colorObj = cId ? rawColors.value.find(c => c.id === cId) : null
    for (const sId of sIds) {
      const sizeObj = sId ? rawSizes.value.find(s => s.id === sId) : null
      const key = `${cId ?? 'null'}::${sId ?? 'null'}`
      rows.push({
        key,
        colorId: cId,
        sizeId: sId,
        colorName: colorObj?.name || 'Standard',
        colorHex: colorObj?.hex_code,
        sizeName: sizeObj?.name || 'Free Size',
        previewSku: computePreviewSku(colorObj?.name, sizeObj?.name),
        override: getRowOverride(key),
      })
    }
  }
  return rows
})

const includedMatrixRows = computed(() => multiGridRows.value.filter(r => r.override.included))

function applyDefaultPricesToMatrix() {
  for (const row of multiGridRows.value) {
    row.override.cost_price = initialVariant.cost_price
    row.override.selling_price = initialVariant.selling_price
  }
  addToast({ type: 'info', title: 'Prices updated', message: 'Default cost and selling prices applied to all matrix rows.' })
}

function setAllMatrixIncluded(included: boolean) {
  for (const row of multiGridRows.value) {
    row.override.included = included
  }
}

function setAllMatrixStatus(status: string) {
  for (const row of multiGridRows.value) {
    row.override.status_code = status
  }
}

function toggleMultiColor(id: string) {
  const idx = selectedColors.value.indexOf(id)
  if (idx === -1) selectedColors.value.push(id)
  else selectedColors.value.splice(idx, 1)
}

function toggleMultiSize(id: string) {
  const idx = selectedSizes.value.indexOf(id)
  if (idx === -1) selectedSizes.value.push(id)
  else selectedSizes.value.splice(idx, 1)
}

const sellingPrice = computed(() => Number(initialVariant.selling_price) || 0)
const costPrice = computed(() => Number(initialVariant.cost_price) || 0)

const priceError = computed(() =>
  attempted.value && includeInitialVariant.value && sellingPrice.value <= 0
    ? 'Enter a default selling price greater than $0.00'
    : undefined,
)
const costError = computed(() =>
  attempted.value && includeInitialVariant.value && costPrice.value < 0
    ? 'Cost price cannot be negative'
    : undefined,
)

const barcodeConflict = ref<ProductVariant | null>(null)
const conflictProductName = computed(() =>
  barcodeConflict.value?.product?.name || (barcodeConflict.value as any)?.product_name || 'Existing Product',
)
const conflictProductId = computed(() =>
  barcodeConflict.value?.product_id || barcodeConflict.value?.product?.id || '',
)
const barcodeError = computed(() =>
  barcodeConflict.value
    ? `Already assigned to ${conflictProductName.value} (${barcodeConflict.value.sku})`
    : undefined,
)

let barcodeCheckSeq = 0
async function verifyBarcodeUniqueness(rawCode: string) {
  const clean = normalizeScannedCode(rawCode) || rawCode.trim()
  if (!clean) {
    barcodeConflict.value = null
    return
  }
  const seq = ++barcodeCheckSeq
  try {
    const res = await scanCode(clean)
    if (seq !== barcodeCheckSeq) return
    const matched = res?.variant || res?.variants?.[0] || null
    barcodeConflict.value = matched
    if (matched) {
      addToast({
        type: 'warn',
        title: 'Barcode / QR Already Exists',
        message: `"${clean}" is already assigned to ${matched.product?.name || matched.sku} (${matched.sku}).`,
      })
    }
  } catch {
    if (seq === barcodeCheckSeq) {
      barcodeConflict.value = null
    }
  }
}

async function verifyRowBarcode(rowKey: string): Promise<boolean> {
  const ov = getRowOverride(rowKey)
  if (!ov.included) return true
  const clean = normalizeScannedCode(ov.barcode) || ov.barcode.trim()
  ov.barcode = clean
  ov.error = undefined
  if (!clean) return true

  const duplicateRow = includedMatrixRows.value.find(
    r => r.key !== rowKey && (normalizeScannedCode(r.override.barcode) || r.override.barcode.trim()).toLowerCase() === clean.toLowerCase(),
  )
  if (duplicateRow) {
    ov.error = `Duplicate barcode with ${duplicateRow.colorName} / ${duplicateRow.sizeName}`
    return false
  }

  try {
    const res = await scanCode(clean)
    const matched = res?.variant || res?.variants?.[0] || null
    if (matched) {
      ov.error = `Used by ${matched.sku}`
      return false
    }
  } catch {
    // 404 = available
  }
  return true
}

function openScannerForSingle() {
  scannerTargetRowKey.value = null
  showScannerModal.value = true
}

function openScannerForRow(rowKey: string) {
  scannerTargetRowKey.value = rowKey
  showScannerModal.value = true
}

function onBarcodeScanned(code: string) {
  const clean = normalizeScannedCode(code) || code.trim()
  if (variantMode.value === 'multi' && scannerTargetRowKey.value) {
    const ov = getRowOverride(scannerTargetRowKey.value)
    ov.barcode = clean
    verifyRowBarcode(scannerTargetRowKey.value)
    return
  }
  initialVariant.barcode = clean
  verifyBarcodeUniqueness(clean)
}

function onBarcodeBlur() {
  const clean = normalizeScannedCode(initialVariant.barcode) || initialVariant.barcode.trim()
  initialVariant.barcode = clean
  verifyBarcodeUniqueness(clean)
}

function clearBarcodeConflict() {
  barcodeConflict.value = null
  initialVariant.barcode = ''
}

watch(() => initialVariant.barcode, (val) => {
  if (!val?.trim()) {
    barcodeConflict.value = null
  }
})

useHardwareScanner({
  onScan(code) {
    if (!includeInitialVariant.value || showScannerModal.value) return
    if (variantMode.value === 'single') {
      onBarcodeScanned(code)
    }
  },
})

function toItems(res: any): any[] {
  return Array.isArray(res) ? res : (res?.items ?? [])
}

async function submitProduct(shouldPrintSticker = false) {
  attempted.value = true
  const nameOk = formRef.value?.validate() ?? !!form.value.name.trim()
  if (!nameOk) return

  if (includeInitialVariant.value && variantMode.value === 'single' && initialVariant.barcode.trim()) {
    await verifyBarcodeUniqueness(initialVariant.barcode)
  }

  if (includeInitialVariant.value && variantMode.value === 'multi') {
    if (includedMatrixRows.value.length === 0) {
      addToast({
        type: 'warn',
        title: 'No Variants Included',
        message: 'Include at least one variant combination or uncheck "Generate variants now".',
      })
      return
    }
    const checks = await Promise.all(includedMatrixRows.value.map(r => verifyRowBarcode(r.key)))
    if (checks.some(ok => !ok)) {
      addToast({
        type: 'warn',
        title: 'Duplicate Barcode Detected',
        message: 'Each variant combination must have a unique barcode.',
      })
      return
    }
  }

  if (includeInitialVariant.value && (priceError.value || costError.value || (variantMode.value === 'single' && barcodeError.value))) {
    addToast({
      type: 'warn',
      title: 'Check the pricing & variant fields',
      message: barcodeError.value || priceError.value || costError.value,
    })
    return
  }

  isSubmitting.value = true
  printAfterCreate.value = shouldPrintSticker
  try {
    const f = form.value
    const payload: Record<string, any> = {
      name: f.name.trim(),
      code: f.code?.trim() || null,
      description: f.description?.trim() || null,
      category_id: f.category_id || null,
      brand_id: f.brand_id || null,
      supplier_id: f.supplier_id || null,
      status_code: f.status_code,
      image_url: f.image_url?.trim() || null,
      tags: f.tags || [],
      images: (f.images || []).map((img, idx) => ({
        image_url: img.image_url,
        variant_id: img.variant_id || null,
        is_primary: img.is_primary,
        sort_order: idx,
      })),
      attribute_value_ids: f.attribute_value_ids || [],
    }

    if (includeInitialVariant.value && variantMode.value === 'single') {
      payload.initial_variant = {
        sku: initialVariant.sku?.trim() || null,
        selling_price: sellingPrice.value,
        cost_price: costPrice.value,
        color_id: initialVariant.color_id || null,
        size_id: initialVariant.size_id || null,
        barcode: initialVariant.barcode?.trim() || null,
        image_url: initialVariant.image_url || null,
        initial_stock: 0,
      }
    }

    const res: any = await createProduct(payload)
    let createdVariant = res?.variants?.[0]

    if (includeInitialVariant.value && variantMode.value === 'multi' && res?.id) {
      const bulkItems = includedMatrixRows.value.map((r) => {
        const rowSell = r.override.selling_price !== '' && r.override.selling_price != null
          ? Number(r.override.selling_price)
          : sellingPrice.value
        const rowCost = r.override.cost_price !== '' && r.override.cost_price != null
          ? Number(r.override.cost_price)
          : costPrice.value
        return {
          color_id: r.colorId,
          size_id: r.sizeId,
          sku: r.override.sku.trim() || null,
          selling_price: rowSell,
          cost_price: rowCost,
          barcode: r.override.barcode.trim() || null,
          image_url: r.override.image_url || null,
          status_code: r.override.status_code || 'ACTIVE',
          initial_stock: 0,
        }
      })
      const bulkRes = await createVariantsBulk(res.id, {
        items: bulkItems,
        default_selling_price: sellingPrice.value,
        default_cost_price: costPrice.value,
      })
      createdVariant = bulkRes.created?.[0] || createdVariant
      addToast({
        type: 'success',
        title: `Product & ${bulkRes.created.length} Variant${bulkRes.created.length === 1 ? '' : 's'} Created`,
        message: `${res.name} (${res.code}) and its SKUs were generated.`,
      })
    } else {
      addToast({
        type: 'success',
        title: 'Product created',
        message: createdVariant
          ? `${res?.name || f.name} (${createdVariant.sku}) is ready.`
          : `${res?.name || f.name} was added to the catalog.`,
      })
    }

    if (!res?.id) {
      await router.push('/products')
    } else if (shouldPrintSticker && createdVariant?.id) {
      await router.push(`/products/${res.id}?tab=barcodes&print_variant=${createdVariant.id}`)
    } else {
      await router.push(`/products/${res.id}`)
    }
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to create product',
      message: err?.data?.detail || err?.message || 'Server error creating product',
    })
  } finally {
    isSubmitting.value = false
    printAfterCreate.value = false
  }
}

onMounted(async () => {
  const [colors, sizes] = await Promise.all([
    listColors().catch(() => []),
    listSizes().catch(() => []),
  ])
  rawColors.value = toItems(colors) as Color[]
  rawSizes.value = toItems(sizes) as Size[]
  colorOptions.value = rawColors.value.map((c: any) => ({ label: c.name, value: c.id }))
  sizeOptions.value = rawSizes.value.map((s: any) => ({ label: s.name, value: s.id }))
})
</script>
