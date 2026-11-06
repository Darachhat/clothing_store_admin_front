<template>
  <div class="page-root">
    <AppPageHeader
      :title="product ? `${product.name} — Variants` : 'Product Variants'"
      description="Manage SKU size, color, barcode, and price overrides."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: product?.name || 'Product', to: `/products/${id}` },
        { label: 'Variants' },
      ]"
      primary-label="Add Variant"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreate"
    />

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Filter variants by SKU, size, color, or barcode..."
      :shown-count="filteredVariants.length"
      :total-count="variants.length"
      count-label="variants"
      @clear-all="searchQuery = ''"
    />

    <AppCard :no-pad="true">
      <AppTable :columns="columns" :rows="filteredVariants" :loading="loading" empty-text="No variants found.">
        <template #cell-sku="{ value }">
          <code class="mono font-semibold">{{ value }}</code>
        </template>
        <template #cell-barcode="{ value }">
          <code class="mono">{{ value ?? '—' }}</code>
        </template>
        <template #cell-cost_price_override="{ value }">
          <span class="mono">{{ value != null ? `$${Number(value).toFixed(2)}` : 'Default' }}</span>
        </template>
        <template #cell-retail_price_override="{ value }">
          <span class="mono font-semibold">{{ value != null ? `$${Number(value).toFixed(2)}` : 'Default' }}</span>
        </template>
        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>
        <template #actions="{ row }">
          <AppButton size="xs" variant="ghost" label="Edit" @click="openEdit(row)" />
          <AppButton size="xs" variant="danger" label="Delete" @click="promptDelete(row)" />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showModal" :title="editTarget ? 'Edit Variant' : 'Add Variant'">
      <form class="form-grid" @submit.prevent="saveVariant">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">SKU <span class="required">*</span></label>
            <input v-model="vForm.sku" class="field-input mono uppercase" required />
          </div>
          <div class="form-field">
            <label class="field-label">Barcode</label>
            <input v-model="vForm.barcode" class="field-input mono" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Size <span class="required">*</span></label>
            <input v-model="vForm.size" class="field-input" placeholder="S, M, L, XL, 32…" required />
          </div>
          <div class="form-field">
            <label class="field-label">Color <span class="required">*</span></label>
            <input v-model="vForm.color" class="field-input" placeholder="Black, White, Navy…" required />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Color Code (Hex)</label>
            <input v-model="vForm.color_code" class="field-input mono" placeholder="#000000" />
          </div>
          <div class="form-field">
            <label class="field-label">Weight (g)</label>
            <input v-model="vForm.weight_grams" type="number" class="field-input" placeholder="250" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Cost Override ($)</label>
            <input v-model="vForm.cost_price_override" type="number" step="0.01" class="field-input" placeholder="Leave blank for product default" />
          </div>
          <div class="form-field">
            <label class="field-label">Retail Price Override ($)</label>
            <input v-model="vForm.retail_price_override" type="number" step="0.01" class="field-input" placeholder="Leave blank for product default" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Status</label>
          <AppSelect v-model="vForm.status" :options="statusOptions" />
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" label="Save Variant" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Product Variant"
      variant="danger"
      confirm-label="Delete Variant"
      :loading="deleting"
      :message="`Are you sure you want to delete variant ${deleteTarget?.sku} (${deleteTarget?.color} / ${deleteTarget?.size})?`"
      consequence="Deleting a variant removes it from catalog selection."
      @confirm="executeDeleteVariant"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Variants — Clothing Store Admin' })

const { getProduct } = useProductApi()
const { listVariants, createVariant, updateVariant, deleteVariant } = useVariantApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const showModal = ref(false)
const editTarget = ref<ProductVariant | null>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<ProductVariant | null>(null)

const vForm = reactive({
  sku: '', barcode: '', size: '', color: '', color_code: '',
  weight_grams: '', cost_price_override: '', retail_price_override: '', status: 'ACTIVE',
})

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'barcode', label: 'Barcode', sortable: true },
  { key: 'size', label: 'Size', width: '80px', sortable: true },
  { key: 'color', label: 'Color', width: '110px', sortable: true },
  { key: 'cost_price_override', label: 'Cost Override', width: '130px' },
  { key: 'retail_price_override', label: 'Price Override', width: '130px' },
  { key: 'status', label: 'Status', width: '100px' },
]

const filteredVariants = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return variants.value
  return variants.value.filter(v =>
    [v.sku, v.barcode, v.size, v.color].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

function openCreate() {
  editTarget.value = null
  Object.assign(vForm, {
    sku: product.value ? `${product.value.sku_prefix}-` : '',
    barcode: '', size: '', color: '', color_code: '',
    weight_grams: '', cost_price_override: '', retail_price_override: '', status: 'ACTIVE',
  })
  showModal.value = true
}

function openEdit(v: ProductVariant) {
  editTarget.value = v
  Object.assign(vForm, {
    sku: v.sku,
    barcode: v.barcode ?? '',
    size: v.size,
    color: v.color,
    color_code: v.color_code ?? '',
    weight_grams: v.weight_grams != null ? String(v.weight_grams) : '',
    cost_price_override: v.cost_price_override != null ? String(v.cost_price_override) : '',
    retail_price_override: v.retail_price_override != null ? String(v.retail_price_override) : '',
    status: (v as any).status_code || v.status || 'ACTIVE',
  })
  showModal.value = true
}

async function saveVariant() {
  saving.value = true
  try {
    const body = {
      product_id: id,
      sku: vForm.sku.trim(),
      barcode: vForm.barcode.trim() || null,
      size: vForm.size.trim(),
      color: vForm.color.trim(),
      color_code: vForm.color_code.trim() || null,
      weight_grams: vForm.weight_grams ? Number(vForm.weight_grams) : null,
      cost_price_override: vForm.cost_price_override ? Number(vForm.cost_price_override) : null,
      retail_price_override: vForm.retail_price_override ? Number(vForm.retail_price_override) : null,
      status_code: vForm.status,
      status: vForm.status,
    }
    if (editTarget.value) {
      await updateVariant(editTarget.value.id, body)
      addToast({ type: 'success', title: 'Variant updated' })
    } else {
      await createVariant(body)
      addToast({ type: 'success', title: 'Variant created' })
    }
    showModal.value = false
    variants.value = (await listVariants({ product_id: id })) ?? []
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
    variants.value = (await listVariants({ product_id: id })) ?? []
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    const [p, v] = await Promise.all([getProduct(id), listVariants({ product_id: id })])
    product.value = p
    variants.value = v ?? []
  } finally {
    loading.value = false
  }
})
</script>
