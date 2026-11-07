<template>
  <div class="page-root">
    <AppPageHeader
      :title="product ? `${product.name} — Variants` : 'Product Variants'"
      description="Manage sizes, colors, SKUs, barcodes, and Khmer garment stickers"
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
        <AppButton variant="default" size="sm" :to="`/labels/generate?product_id=${id}`">
          <template #icon-left>
            <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
          </template>
          <span class="kh-text">បោះពុម្ពស្លាកទំនិញ (Print Product Label)</span>
        </AppButton>
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Filter variants by SKU, color, size, or barcode..."
      :shown-count="filteredVariants.length"
      :total-count="variants.length"
      count-label="variants"
      @clear-all="searchQuery = ''"
    />

    <!-- Variants Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredVariants"
        :loading="loading"
        empty-text="No variants yet. Add your first variant."
      >
        <template #cell-sku="{ value }">
          <code class="mono font-semibold">{{ value }}</code>
        </template>
        <template #cell-color="{ row }">
          <div class="color-cell">
            <span v-if="row.color?.hex_code" class="color-dot" :style="{ background: row.color.hex_code }" />
            {{ row.color?.name ?? (row as any).color_name ?? '—' }}
          </div>
        </template>
        <template #cell-size="{ row }">{{ row.size?.name ?? (row as any).size_name ?? '—' }}</template>
        <template #cell-cost_price="{ value }">
          <span class="mono text-gray-500">${{ Number(value || 0).toFixed(2) }}</span>
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
          <div style="display:flex;gap:4px;justify-content:flex-end;">
            <AppButton variant="default" size="xs" @click="openQr(row)">
              <template #icon-left>
                <UIcon name="i-heroicons-tag" class="w-3.5 h-3.5" />
              </template>
              <span class="kh-text">ស្លាកទំនិញ / Barcode</span>
            </AppButton>
            <AppButton variant="ghost" size="xs" @click="openEdit(row)">Edit</AppButton>
            <AppButton variant="danger" size="xs" @click="promptDelete(row)">Delete</AppButton>
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showForm" :title="editTarget ? 'Edit Variant' : 'Add Variant'" size="lg">
      <form class="form-grid" @submit.prevent="saveVariant(false)">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Color</label>
            <AppSelect v-model="form.color_id" :options="colorOptions" placeholder="Select color" />
          </div>
          <div class="form-field">
            <label class="field-label">Size</label>
            <AppSelect v-model="form.size_id" :options="sizeOptions" placeholder="Select size" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Cost Price ($)</label>
            <input v-model.number="form.cost_price" type="number" step="0.01" min="0" class="field-input" required />
          </div>
          <div class="form-field">
            <label class="field-label">Selling Price ($) <span class="required">*</span></label>
            <input v-model.number="form.selling_price" type="number" step="0.01" min="0" class="field-input" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Wholesale Price ($)</label>
            <input v-model.number="form.wholesale_price" type="number" step="0.01" min="0" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Barcode (Auto-generated if blank)</label>
            <div class="flex gap-1.5">
              <input v-model="form.barcode" class="field-input flex-1 mono" placeholder="Auto 10-digit Code-128" />
              <AppButton
                type="button"
                variant="default"
                size="sm"
                icon="i-heroicons-qr-code"
                title="Scan Barcode"
                @click="showScanner = true"
              />
            </div>
          </div>
        </div>

        <div class="form-row">
          <div v-if="!editTarget" class="form-field">
            <label class="field-label">Opening Stock Quantity (Units)</label>
            <input v-model.number="form.initial_stock" type="number" step="1" min="0" class="field-input mono" />
          </div>
          <div class="form-field">
            <label class="field-label">Status</label>
            <AppSelect v-model="form.status" :options="statusOptions" />
          </div>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="showForm = false">Cancel</AppButton>
          <AppButton
            v-if="!editTarget"
            type="button"
            variant="secondary"
            icon="i-heroicons-printer"
            :loading="saving"
            @click="saveVariant(true)"
          >
            Create &amp; Print Sticker
          </AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">
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

    <BarcodeScannerModal v-model="showScanner" :auto-close-on-scan="true" @scanned="(code) => { form.barcode = code; showScanner = false }" />

    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Product Variant"
      variant="danger"
      confirm-label="Delete Variant"
      :loading="deleting"
      :message="`Are you sure you want to delete variant ${deleteTarget?.sku}?`"
      consequence="Deleting a variant removes it from catalog selection."
      @confirm="executeDeleteVariant"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant, Color, Size } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Variants — Clothing Store Admin' })

const { getProduct } = useProductApi()
const { listVariants, createVariant, updateVariant, deleteVariant, getBarcodeUrl } = useVariantApi()
const { listColors, listSizes } = useCatalogApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const colors = ref<Color[]>([])
const sizes = ref<Size[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const showForm = ref(false)
const showQr = ref(false)
const stickerInitialCopies = ref(1)
const showScanner = ref(false)
const editTarget = ref<ProductVariant | null>(null)
const qrVariant = ref<ProductVariant | null>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<ProductVariant | null>(null)

const form = reactive({
  color_id: '',
  size_id: '',
  cost_price: 0,
  selling_price: 0,
  wholesale_price: null as number | null,
  barcode: '',
  initial_stock: 10,
  status: 'ACTIVE',
})

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
  { key: 'color', label: 'Color (ពណ៌)' },
  { key: 'size', label: 'Size (ទំហំ)' },
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

const barcodeUrl = computed(() =>
  qrVariant.value ? getBarcodeUrl(qrVariant.value.id, 'svg', false) : '',
)

function openCreate() {
  editTarget.value = null
  Object.assign(form, {
    color_id: '',
    size_id: '',
    cost_price: 0,
    selling_price: 0,
    wholesale_price: null,
    barcode: '',
    initial_stock: 10,
    status: 'ACTIVE',
  })
  showForm.value = true
}

function openEdit(v: ProductVariant) {
  editTarget.value = v
  Object.assign(form, {
    color_id: v.color_id ?? '',
    size_id: v.size_id ?? '',
    cost_price: Number(v.cost_price || 0),
    selling_price: Number(v.selling_price || 0),
    wholesale_price: v.wholesale_price != null ? Number(v.wholesale_price) : null,
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

async function saveVariant(shouldPrintAfterSave = false) {
  saving.value = true
  try {
    const payload: Record<string, any> = {
      product_id: id,
      color_id: form.color_id || null,
      size_id: form.size_id || null,
      cost_price: form.cost_price,
      selling_price: form.selling_price,
      wholesale_price: form.wholesale_price,
      barcode: form.barcode || null,
      status_code: form.status,
      status: form.status,
    }
    let createdOrUpdated: ProductVariant | null = null
    if (editTarget.value) {
      createdOrUpdated = (await updateVariant(editTarget.value.id, payload)) as ProductVariant
      addToast({ type: 'success', title: 'Variant updated' })
    } else {
      payload.initial_stock = Math.max(0, Number(form.initial_stock) || 0)
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
    await deleteVariant(deleteTarget.value.id)
    addToast({ type: 'success', title: 'Variant deleted' })
    showDeleteConfirm.value = false
    await loadVariants()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    deleting.value = false
  }
}

async function loadVariants() {
  const res = await listVariants({ product_id: id, limit: 200 }) as ProductVariant[]
  variants.value = Array.isArray(res) ? res : ((res as any)?.items ?? [])
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

<style scoped>
.kh-text {
  font-family: 'Kantumruy Pro', 'Battambang', 'Battambang Local', 'Noto Sans Khmer', sans-serif;
}

.color-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid var(--border-subtle, #e5e7eb);
  flex-shrink: 0;
}

.sticker-modal-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px;
}

.sticker-preview-stage {
  background: #f1f5f9;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  padding: 16px;
  width: 100%;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.qr-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
