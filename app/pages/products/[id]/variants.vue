<template>
  <div class="page-root">
    <AppPageHeader
      :title="product ? `${product.name} — Variants` : 'Product Variants'"
      description="Manage sizes, colors, SKUs, barcodes, and garment stickers"
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: product?.name || 'Product', to: `/products/${id}` },
        { label: 'Variants' },
      ]"
      primary-label="Add Variant"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreate"
    >
      <template #secondary>
        <AppButton
          variant="default"
          size="sm"
          icon="i-heroicons-tag"
          label="Print Product Labels"
          :to="`/labels/generate?product_id=${id}`"
        />
        <AppButton
          variant="default"
          size="sm"
          icon="i-heroicons-sparkles"
          label="Generate Grid"
          aria-label="Bulk generate variants grid"
          @click="showBulkForm = true"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Filter variants by SKU, color, size, or barcode..."
      :shown-count="filteredVariants.length"
      :total-count="variants.length"
      count-label="variants"
      @clear-all="searchQuery = ''"
      @scan="onFilterScan"
    />

    <!-- Stock Matrix (collapsed by default on variants page) -->
    <details class="group" open>
      <summary class="flex items-center gap-2 cursor-pointer select-none mb-2 text-sm font-medium text-ink-secondary hover:text-ink transition-colors list-none">
        <UIcon name="i-heroicons-table-cells" class="w-4 h-4 shrink-0" />
        Stock Matrix
        <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 ml-auto group-open:rotate-180 transition-transform" />
      </summary>
      <StockMatrix ref="matrixRef" :product-id="id" />
    </details>

    <!-- Variants Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredVariants"
        :loading="loading"
        :error="loadError"
        :on-retry="loadVariants"
        empty-text="No variants yet. Add your first variant."
      >
        <template #cell-sku="{ value }">
          <code class="mono font-semibold">{{ value }}</code>
        </template>
        <template #cell-color="{ row }">
          <div class="flex items-center gap-1.5">
            <span v-if="row.color?.hex_code" class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0" :style="{ background: row.color.hex_code }" />
            {{ row.color?.name ?? (row as any).color_name ?? '—' }}
          </div>
        </template>
        <template #cell-size="{ row }">{{ row.size?.name ?? (row as any).size_name ?? '—' }}</template>
        <template #cell-cost_price="{ value }">
          <span class="mono text-ink-secondary">${{ Number(value || 0).toFixed(2) }}</span>
        </template>
        <template #cell-selling_price="{ value }">
          <span class="mono font-semibold">${{ Number(value || 0).toFixed(2) }}</span>
        </template>
        <template #cell-qr_reference="{ row }">
          <code class="mono text-xs">{{ row.barcode || row.qr_reference || '—' }}</code>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-1 justify-end">
            <AppButton variant="default" size="xs" icon="i-heroicons-tag" label="Barcode" :aria-label="`Print barcode sticker for ${row.sku}`" @click="openQr(row)" />
            <AppButton variant="ghost" size="xs" icon="i-heroicons-pencil-square" label="Edit" :aria-label="`Edit ${row.sku}`" @click="openEdit(row)" />
            <AppButton variant="danger" size="xs" icon="i-heroicons-trash" label="Delete" :aria-label="`Delete ${row.sku}`" @click="promptDelete(row)" />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showForm" :title="editTarget ? 'Edit Variant' : 'Add Variant'" size="lg">
      <form class="flex flex-col gap-4" novalidate @submit.prevent="saveVariant(false)">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppSelect id="vf-color" v-model="form.color_id" label="Color" :options="colorOptions" placeholder="None / Default" />
          <AppSelect id="vf-size" v-model="form.size_id" label="Size" :options="sizeOptions" placeholder="None / Free Size" />
        </div>

        <!-- Duplicate Color + Size warning -->
        <div
          v-if="comboConflict"
          class="flex items-start justify-between gap-3 rounded-lg border border-border-subtle bg-surface-inset p-3 text-xs text-ink"
        >
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
            <div>
              <p class="font-medium">This Color &amp; Size combination already exists</p>
              <p class="text-ink-secondary mt-0.5">
                Assigned to SKU <code class="mono font-semibold">{{ comboConflict.sku }}</code> (${{ Number(comboConflict.selling_price || 0).toFixed(2) }})
              </p>
            </div>
          </div>
          <AppButton
            type="button"
            variant="secondary"
            size="xs"
            icon="i-heroicons-pencil-square"
            :label="`Switch to Edit ${comboConflict.sku}`"
            @click="openEdit(comboConflict)"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            id="vf-cost"
            v-model="form.cost_price"
            type="number"
            label="Cost Price ($)"
            step="0.01"
            min="0"
            mono
            :error="errors.cost_price"
          />
          <AppInput
            id="vf-price"
            v-model="form.selling_price"
            type="number"
            label="Selling Price ($)"
            step="0.01"
            min="0.01"
            mono
            required
            :error="errors.selling_price"
            :hint="belowCost ? 'Selling price is below cost price.' : undefined"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            id="vf-wholesale"
            v-model="form.wholesale_price"
            type="number"
            label="Wholesale Price ($)"
            step="0.01"
            min="0"
            mono
            :error="errors.wholesale_price"
          />
          <div class="flex flex-col gap-1.5">
            <label for="vf-barcode" class="text-sm text-ink-secondary leading-tight">Barcode (Auto-generated if blank)</label>
            <div class="flex gap-2">
              <AppInput
                id="vf-barcode"
                v-model="form.barcode"
                data-barcode-scanner-target="true"
                class="flex-1"
                placeholder="Auto 10-digit Code-128"
                mono
                clearable
                :error="errors.barcode || barcodeError"
                @blur="onBarcodeBlur"
              />
              <AppButton
                type="button"
                variant="default"
                icon="i-heroicons-qr-code"
                label="Scan"
                aria-label="Scan barcode"
                @click="showScanner = true"
              />
            </div>

            <!-- Existing Barcode / QR Conflict Alert -->
            <div
              v-if="barcodeConflict"
              class="mt-1 flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-inset p-2.5 text-xs text-ink"
            >
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
                <div>
                  <p class="font-medium">Code already registered</p>
                  <p class="text-ink-secondary">
                    Used by <span class="font-semibold text-ink">{{ barcodeConflict.product_name || product?.name || 'Product' }}</span>
                    (<code class="mono">{{ barcodeConflict.sku }}</code>)
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2 pl-6">
                <AppButton
                  v-if="barcodeConflict.product_id === id"
                  type="button"
                  variant="secondary"
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  :label="`Switch to Edit ${barcodeConflict.sku}`"
                  @click="switchToConflictVariant"
                />
                <AppButton
                  v-else-if="barcodeConflict.product_id"
                  type="button"
                  variant="secondary"
                  size="xs"
                  icon="i-heroicons-arrow-top-right-on-square"
                  label="View Existing Product"
                  :to="`/products/${barcodeConflict.product_id}/variants?edit=${barcodeConflict.id}`"
                />
                <AppButton
                  type="button"
                  variant="ghost"
                  size="xs"
                  label="Clear & Auto-Generate"
                  @click="clearBarcodeConflict"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- QR Reference display + Regenerate (Edit Mode) -->
        <div
          v-if="editTarget"
          class="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-inset px-3 py-2.5 text-xs"
        >
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-qr-code" class="w-4 h-4 text-ink-secondary shrink-0" />
            <div>
              <span class="text-ink-secondary">QR Reference: </span>
              <code class="mono font-semibold text-ink">{{ editTarget.qr_reference || '—' }}</code>
            </div>
          </div>
          <AppButton
            type="button"
            variant="default"
            size="xs"
            icon="i-heroicons-arrow-path"
            label="Regenerate QR"
            :loading="regeneratingQr"
            @click="handleRegenerateQr"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-if="!editTarget"
            id="vf-stock"
            v-model="form.initial_stock"
            type="number"
            label="Opening Stock Quantity (Units)"
            step="1"
            min="0"
            mono
          />
          <AppSelect id="vf-status" v-model="form.status" label="Status" :options="statusOptions" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="showForm = false">Cancel</AppButton>
          <AppButton
            v-if="!editTarget"
            type="button"
            variant="secondary"
            icon="i-heroicons-printer"
            :loading="saving || checkingBarcode"
            @click="saveVariant(true)"
          >
            Create &amp; Print Sticker
          </AppButton>
          <AppButton type="submit" variant="primary" :loading="saving || checkingBarcode">
            {{ editTarget ? 'Save Changes' : 'Create Variant' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Instant Thermal Sticker Print Modal -->
    <ProductStickerPrintModal
      v-model="showQr"
      :variant="qrVariant"
      :product-name="product?.name"
      :initial-copies="stickerInitialCopies"
    />

    <BarcodeScannerModal v-model="showScanner" :auto-close-on-scan="true" @scanned="onBarcodeScanned" />

    <!-- Bulk Variant Generator -->
    <BulkVariantForm
      v-model="showBulkForm"
      :product-id="id"
      @created="loadVariants"
    />

    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Product Variant"
      variant="danger"
      confirm-label="Delete Variant"
      :loading="deleting"
      :message="`Are you sure you want to delete variant ${deleteTarget?.sku}?`"
      consequence="If the variant has existing stock or movement history it will be set to Inactive instead of permanently deleted."
      @confirm="executeDeleteVariant"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant, Color, Size, VariantScanResponse } from '~/types'
import { normalizeScannedCode } from '~/utils/scanCode'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Variants — Clothing Store Admin' })

const { getProduct } = useProductApi()
const { listVariants, createVariant, updateVariant, deleteVariant, scanVariant, regenerateCodes } = useVariantApi()
const { listColors, listSizes } = useCatalogApi()
const { addToast } = useAppToast()

const matrixRef = ref<{ refresh?: () => Promise<void> } | null>(null)
const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const colors = ref<Color[]>([])
const sizes = ref<Size[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const regeneratingQr = ref(false)
const searchQuery = ref('')

const showForm = ref(false)
const showQr = ref(false)
const stickerInitialCopies = ref(1)
const showScanner = ref(false)
const showBulkForm = ref(false)
const editTarget = ref<ProductVariant | null>(null)
const qrVariant = ref<ProductVariant | null>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<ProductVariant | null>(null)

interface BarcodeConflictInfo {
  id: string
  sku: string
  product_id: string
  product_name?: string
}

const loadError = ref<string | null>(null)
const submitted = ref(false)
const checkingBarcode = ref(false)
const barcodeError = ref<string | undefined>(undefined)
const barcodeConflict = ref<BarcodeConflictInfo | null>(null)

const form = reactive({
  color_id: '',
  size_id: '',
  cost_price: '' as number | string,
  selling_price: '' as number | string,
  wholesale_price: '' as number | string,
  barcode: '',
  initial_stock: 0 as number | string,
  status: 'ACTIVE',
})

const num = (v: number | string) => (v === '' || v == null ? 0 : Number(v))

const comboConflict = computed(() => {
  const cId = form.color_id || null
  const sId = form.size_id || null
  return variants.value.find(
    v =>
      (v.color_id || null) === cId
      && (v.size_id || null) === sId
      && v.id !== editTarget.value?.id,
  ) || null
})

const errors = computed(() => {
  const e: Record<string, string | undefined> = {}
  if (!submitted.value) return e
  if (num(form.selling_price) <= 0) e.selling_price = 'Selling price must be greater than $0.00'
  if (num(form.cost_price) < 0) e.cost_price = 'Cost price cannot be negative'
  if (form.wholesale_price !== '' && num(form.wholesale_price) < 0) e.wholesale_price = 'Wholesale price cannot be negative'
  if (barcodeError.value) e.barcode = barcodeError.value
  return e
})

const belowCost = computed(() =>
  num(form.selling_price) > 0 && num(form.cost_price) > 0 && num(form.selling_price) < num(form.cost_price),
)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const colorOptions = computed(() => [
  { label: 'None / Default', value: '' },
  ...colors.value.map(c => ({ label: c.name, value: c.id })),
])
const sizeOptions = computed(() => [
  { label: 'None / Free Size', value: '' },
  ...sizes.value.map(s => ({ label: s.name, value: s.id })),
])

const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'cost_price', label: 'Cost', sortable: true },
  { key: 'selling_price', label: 'Price', sortable: true },
  { key: 'qr_reference', label: 'Barcode / Ref' },
  { key: 'status', label: 'Status' },
]

const filteredVariants = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return variants.value
  return variants.value.filter(v =>
    [v.sku, v.barcode, v.qr_reference, v.color?.name, v.size?.name].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

function resetBarcodeValidation() {
  barcodeError.value = undefined
  barcodeConflict.value = null
}

async function verifyBarcodeUniqueness(rawCode: string): Promise<boolean> {
  const clean = normalizeScannedCode(rawCode)
  form.barcode = clean
  resetBarcodeValidation()
  if (!clean) return true

  // 1. Check local variants of this product first
  const lower = clean.toLowerCase()
  const localMatch = variants.value.find(
    v =>
      v.id !== editTarget.value?.id
      && (
        v.barcode?.toLowerCase() === lower
        || v.qr_reference?.toLowerCase() === lower
        || v.sku?.toLowerCase() === lower
      ),
  )
  if (localMatch) {
    barcodeConflict.value = {
      id: localMatch.id,
      sku: localMatch.sku,
      product_id: localMatch.product_id || id,
      product_name: product.value?.name,
    }
    barcodeError.value = `Code "${clean}" is already assigned to variant ${localMatch.sku}.`
    return false
  }

  // 2. Check across all products in backend
  checkingBarcode.value = true
  try {
    const res = await scanVariant(clean)
    const matched = res?.variant || res?.variants?.[0] || null
    if (matched && matched.id && matched.id !== editTarget.value?.id) {
      const prodName = res?.product?.name || matched.product?.name || 'another product'
      barcodeConflict.value = {
        id: matched.id,
        sku: matched.sku,
        product_id: matched.product_id || res?.product?.id || '',
        product_name: prodName,
      }
      barcodeError.value = `Code "${clean}" is already assigned to ${prodName} (${matched.sku}).`
      return false
    }
    return true
  } catch (err: any) {
    const status = err?.status || err?.statusCode || err?.response?.status
    if (status === 404) {
      return true
    }
    return true
  } finally {
    checkingBarcode.value = false
  }
}

async function onBarcodeScanned(code: string) {
  const clean = normalizeScannedCode(code)
  form.barcode = clean
  const isUnique = await verifyBarcodeUniqueness(clean)
  if (!isUnique && barcodeConflict.value) {
    addToast({
      type: 'warn',
      title: 'Existing Barcode / QR Detected',
      message: `Code "${clean}" belongs to ${barcodeConflict.value.product_name || product.value?.name || 'a product'} (${barcodeConflict.value.sku}).`,
    })
  } else if (clean) {
    addToast({
      type: 'success',
      title: 'Barcode Ready',
      message: `Code "${clean}" is available and assigned to this variant.`,
    })
  }
}

async function onBarcodeBlur() {
  if (form.barcode.trim()) {
    await verifyBarcodeUniqueness(form.barcode)
  } else {
    resetBarcodeValidation()
  }
}

function clearBarcodeConflict() {
  form.barcode = ''
  resetBarcodeValidation()
}

function switchToConflictVariant() {
  if (!barcodeConflict.value) return
  const target = variants.value.find(v => v.id === barcodeConflict.value?.id)
  if (target) {
    openEdit(target)
  }
}

async function onFilterScan(rawCode: string) {
  const clean = normalizeScannedCode(rawCode)
  if (!clean) return
  const lower = clean.toLowerCase()
  const localMatch = variants.value.find(
    v =>
      v.barcode?.toLowerCase() === lower
      || v.qr_reference?.toLowerCase() === lower
      || v.sku?.toLowerCase() === lower,
  )
  if (localMatch) {
    searchQuery.value = clean
    addToast({
      type: 'info',
      title: `Found Variant ${localMatch.sku}`,
      message: `Filtered table to matching variant (${localMatch.sku}).`,
    })
    return
  }

  // Check if it belongs to another product or is completely new
  try {
    const remote = await scanVariant(clean)
    const matched = remote?.variant || remote?.variants?.[0] || null
    if (matched && matched.id) {
      const prodName = remote?.product?.name || matched.product?.name || 'another product'
      addToast({
        type: 'warn',
        title: 'Code Belongs to Another Product',
        message: `"${clean}" is registered to ${prodName} (${matched.sku}).`,
      })
      return
    }
  } catch {
    // 404 means unused barcode — offer to create variant with this barcode
  }

  openCreate()
  form.barcode = clean
  addToast({
    type: 'success',
    title: 'New Barcode Scanned',
    message: `Opened Add Variant with barcode "${clean}".`,
  })
}

useHardwareScanner({
  onScan: (code: string) => {
    if (showScanner.value) return
    if (showForm.value) {
      onBarcodeScanned(code)
    } else {
      onFilterScan(code)
    }
  },
})

function openCreate() {
  editTarget.value = null
  submitted.value = false
  resetBarcodeValidation()
  Object.assign(form, {
    color_id: '',
    size_id: '',
    cost_price: '',
    selling_price: product.value?.retail_price ? Number(product.value.retail_price) : '',
    wholesale_price: '',
    barcode: '',
    initial_stock: 0,
    status: 'ACTIVE',
  })
  showForm.value = true
}

function openEdit(v: ProductVariant) {
  editTarget.value = v
  submitted.value = false
  resetBarcodeValidation()
  Object.assign(form, {
    color_id: v.color_id ?? '',
    size_id: v.size_id ?? '',
    cost_price: Number(v.cost_price || 0),
    selling_price: Number(v.selling_price || 0),
    wholesale_price: v.wholesale_price != null ? Number(v.wholesale_price) : '',
    barcode: v.barcode ?? '',
    initial_stock: 0,
    status: v.status_code || v.status || 'ACTIVE',
  })
  showForm.value = true
}

function openQr(v: ProductVariant, copies = 1) {
  qrVariant.value = v
  stickerInitialCopies.value = copies
  showQr.value = true
}

async function handleRegenerateQr() {
  if (!editTarget.value) return
  regeneratingQr.value = true
  try {
    const updated = await regenerateCodes(editTarget.value.id)
    editTarget.value = updated
    if (updated.barcode) {
      form.barcode = updated.barcode
    }
    await loadVariants()
    addToast({
      type: 'success',
      title: 'QR Reference Regenerated',
      message: `New QR reference: ${updated.qr_reference}`,
    })
  } catch (e: any) {
    addToast({
      type: 'error',
      title: 'Failed to Regenerate QR',
      message: e?.data?.detail ?? String(e),
    })
  } finally {
    regeneratingQr.value = false
  }
}

async function saveVariant(shouldPrintAfterSave = false) {
  submitted.value = true
  if (comboConflict.value) {
    addToast({
      type: 'warn',
      title: 'Duplicate Color & Size',
      message: `This color and size combination already exists (${comboConflict.value.sku}).`,
    })
    return
  }
  if (form.barcode.trim()) {
    const isUnique = await verifyBarcodeUniqueness(form.barcode)
    if (!isUnique) return
  }
  if (Object.values(errors.value).some(Boolean)) return
  saving.value = true
  try {
    const payload: Record<string, any> = {
      product_id: id,
      color_id: form.color_id || null,
      size_id: form.size_id || null,
      cost_price: num(form.cost_price),
      selling_price: num(form.selling_price),
      wholesale_price: form.wholesale_price === '' ? null : num(form.wholesale_price),
      barcode: normalizeScannedCode(form.barcode) || null,
      status_code: form.status,
    }
    let createdOrUpdated: ProductVariant | null = null
    if (editTarget.value) {
      createdOrUpdated = (await updateVariant(editTarget.value.id, payload)) as ProductVariant
      addToast({ type: 'success', title: 'Variant updated' })
    } else {
      payload.initial_stock = Math.max(0, Math.floor(num(form.initial_stock)))
      createdOrUpdated = (await createVariant(payload)) as ProductVariant
      addToast({ type: 'success', title: 'Variant created' })
    }
    showForm.value = false
    await loadVariants()
    if (shouldPrintAfterSave && createdOrUpdated) {
      const target = variants.value.find(v => v.id === createdOrUpdated?.id) || createdOrUpdated
      openQr(target, Math.max(1, Number(form.initial_stock) || 1))
    }
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

function promptDelete(v: ProductVariant) {
  deleteTarget.value = v
  showDeleteConfirm.value = true
}

async function executeDeleteVariant() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    const res = await deleteVariant(deleteTarget.value.id) as { deactivated?: boolean; message?: string } | null
    if (res && (res as any).deactivated) {
      addToast({
        type: 'warn',
        title: 'Variant Deactivated',
        message: `${deleteTarget.value.sku} has existing stock or movement history and was set to Inactive instead of deleted.`,
      })
    } else {
      addToast({ type: 'success', title: 'Variant Deleted' })
    }
    showDeleteConfirm.value = false
    await loadVariants()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    deleting.value = false
  }
}

async function loadVariants() {
  loadError.value = null
  try {
    const res = await listVariants({ product_id: id, limit: 200 }) as ProductVariant[]
    variants.value = Array.isArray(res) ? res : ((res as any)?.items ?? [])
    await matrixRef.value?.refresh?.()
  } catch (e: any) {
    loadError.value = e?.data?.detail ?? e?.message ?? 'Failed to load variants'
  }
}

onMounted(async () => {
  try {
    const [p, c, s] = await Promise.all([
      getProduct(id),
      listColors().catch(() => []),
      listSizes().catch(() => []),
    ])
    product.value = p as Product
    colors.value = Array.isArray(c) ? (c as Color[]) : ((c as any)?.items ?? [])
    sizes.value = Array.isArray(s) ? (s as Size[]) : ((s as any)?.items ?? [])
    await loadVariants()

    const editVariantId = typeof route.query.edit === 'string' ? route.query.edit : ''
    if (editVariantId) {
      const target = variants.value.find(v => v.id === editVariantId)
      if (target) openEdit(target)
    }

    const printVariantId = typeof route.query.print_variant === 'string' ? route.query.print_variant : ''
    const qCopies = Number(route.query.copies) || 1
    if (printVariantId) {
      const target = variants.value.find(v => v.id === printVariantId) || variants.value[0]
      if (target) {
        openQr(target, Math.max(1, qCopies))
      }
    }
  } finally {
    loading.value = false
  }
})
</script>

