<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Adjustments"
      description="Correct inventory counts, add/remove stock, or set exact stock levels with audit notes."
      :breadcrumbs="[
        { label: 'Inventory', to: '/inventory' },
        { label: 'Adjustments' },
      ]"
      primary-label="New Adjustment"
      primary-icon="i-heroicons-plus"
      @primary-click="openModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchAdjustments" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search adjustments by SKU, warehouse, reason, or reference..."
      :shown-count="filteredAdjustments.length"
      :total-count="adjustments.length"
      count-label="adjustments"
      @clear-all="searchQuery = ''"
    />

    <!-- Recent Adjustments table (movements filtered by ADJUSTMENT type) -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredAdjustments"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-adjustments-horizontal',
          label: 'No adjustments recorded',
          description: 'Use New Adjustment to log manual inventory corrections or exact stock counts.',
        }"
      >
        <template #cell-sku_display="{ row }">
          <code class="mono font-semibold text-gray-900">{{ row.sku_display }}</code>
        </template>

        <template #cell-warehouse_display="{ row }">
          <span class="text-xs text-gray-700">{{ row.warehouse_display }}</span>
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-medium mono"
            :class="Number(row.quantity ?? row.quantity_change ?? 0) > 0 ? 'text-emerald-700' : 'text-red-700'"
          >
            {{ Number(row.quantity ?? row.quantity_change ?? 0) > 0 ? '+' : '' }}{{ row.quantity ?? row.quantity_change ?? 0 }}
          </span>
        </template>

        <template #cell-stock_change="{ row }">
          <span class="font-mono text-xs text-gray-600">
            {{ row.before_quantity ?? row.quantity_before ?? 0 }} → {{ row.after_quantity ?? row.quantity_after ?? 0 }}
          </span>
        </template>

        <template #cell-note="{ row }">
          <span>{{ row.note || row.notes || '—' }}</span>
        </template>

        <template #cell-reference_type="{ row }">
          <AppBadge color="default" size="sm">{{ row.reference_type || row.movement_type || 'ADJUSTMENT' }}</AppBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ row.created_at ? new Date(row.created_at).toLocaleString() : '—' }}</span>
        </template>
      </AppTable>
    </AppCard>

    <!-- Adjustment Modal -->
    <AppModal
      v-model="showModal"
      title="Record Stock Adjustment"
      description="Select the product variant, warehouse, and adjustment mode (+ Add, - Remove, or = Set to Value)."
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="field-label">Product Variant (SKU) <span class="required">*</span></label>
          <select v-model="form.variant_id" required class="field-input">
            <option value="" disabled>Select variant</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.sku }}</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">Warehouse <span class="required">*</span></label>
          <select v-model="form.warehouse_id" required class="field-input">
            <option value="" disabled>Select warehouse</option>
            <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">Adjustment Type <span class="required">*</span></label>
          <div class="flex flex-wrap gap-3 pt-1">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.type" type="radio" value="add" />
              <span class="text-sm font-medium text-emerald-700">+ Add Stock</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.type" type="radio" value="remove" />
              <span class="text-sm font-medium text-red-700">- Remove Stock</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.type" type="radio" value="set" />
              <span class="text-sm font-medium text-blue-700">= Set to Value</span>
            </label>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">
            {{ form.type === 'set' ? 'New Stock Count' : 'Quantity' }} <span class="required">*</span>
          </label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="0"
            required
            class="field-input mono"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Reason / Notes <span class="required">*</span></label>
          <textarea
            v-model="form.note"
            rows="2"
            required
            placeholder="e.g. Physical count discrepancy, damaged goods, theft..."
            class="field-input field-textarea"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" label="Submit Adjustment" :loading="saving" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Adjustments — Clothing Store Admin' })

const invApi = useInventoryApi()
const variantApi = useVariantApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const adjustments = ref<any[]>([])
const variants = ref<any[]>([])
const warehouses = ref<any[]>([])
const showModal = ref(false)
const searchQuery = ref('')

const form = ref({
  variant_id: '',
  warehouse_id: '',
  type: 'add',
  quantity: 1,
  note: '',
})

const columns = [
  { key: 'sku_display', label: 'SKU', sortable: true },
  { key: 'warehouse_display', label: 'Warehouse', sortable: true },
  { key: 'quantity', label: 'Change', sortable: true },
  { key: 'stock_change', label: 'Before → After' },
  { key: 'note', label: 'Reason' },
  { key: 'reference_type', label: 'Reference' },
  { key: 'created_at', label: 'Date/Time', sortable: true },
]

const variantMap = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const v of variants.value) {
    if (v?.id) m[v.id] = v
  }
  return m
})

const warehouseMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const w of warehouses.value) {
    if (w?.id) m[w.id] = w.name
  }
  return m
})

const enrichedAdjustments = computed(() =>
  adjustments.value.map((a) => {
    const v = variantMap.value[a.variant_id]
    return {
      ...a,
      sku_display: a.sku || v?.sku || (a.variant_id ? String(a.variant_id).slice(0, 8) : '—'),
      warehouse_display: a.warehouse_name || warehouseMap.value[a.warehouse_id] || (a.warehouse_id ? String(a.warehouse_id).slice(0, 8) : '—'),
    }
  }),
)

const filteredAdjustments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return enrichedAdjustments.value
  return enrichedAdjustments.value.filter(a =>
    [a.sku_display, a.warehouse_display, a.note, a.reference_type].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

function openModal() {
  form.value = {
    variant_id: variants.value[0]?.id || '',
    warehouse_id: warehouses.value[0]?.id || '',
    type: 'add',
    quantity: 1,
    note: '',
  }
  showModal.value = true
}

async function fetchAdjustments() {
  loading.value = true
  try {
    const data = await invApi.listMovements({ movement_type: 'ADJUSTMENT', limit: 50 }) as any
    adjustments.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchMeta() {
  try {
    const [stocks, vars, branches] = await Promise.all([
      invApi.listStocks({}).catch(() => []) as any,
      variantApi.listVariants({ limit: 500 }).catch(() => []) as any,
      branchApi.listBranches().catch(() => []),
    ])
    const wMap = new Map()
    ;(branches || []).forEach((b: any) => {
      ;(b.warehouses || []).forEach((w: any) => {
        wMap.set(w.id, { id: w.id, name: `${b.name} — ${w.name}` })
      })
    })
    const stockArr = Array.isArray(stocks) ? stocks : (stocks?.items || [])
    stockArr.forEach((s: any) => {
      if (s.warehouse_id && !wMap.has(s.warehouse_id)) {
        wMap.set(s.warehouse_id, { id: s.warehouse_id, name: `Warehouse ${s.warehouse_id.slice(0, 8)}` })
      }
    })
    warehouses.value = Array.from(wMap.values())
    variants.value = Array.isArray(vars) ? vars : (vars?.items || [])
  } catch (e) {
    console.error(e)
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    let delta = form.value.quantity
    const movement_type = 'ADJUSTMENT'

    if (form.value.type === 'remove') delta = -Math.abs(form.value.quantity)
    else if (form.value.type === 'add') delta = Math.abs(form.value.quantity)

    await invApi.createAdjustment({
      variant_id: form.value.variant_id,
      warehouse_id: form.value.warehouse_id,
      quantity_delta: form.value.type === 'set' ? null : delta,
      new_quantity: form.value.type === 'set' ? form.value.quantity : null,
      movement_type,
      note: form.value.note,
    })
    toast.add({ title: 'Success', description: 'Stock adjustment recorded', color: 'green' })
    showModal.value = false
    await fetchAdjustments()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchMeta()
  await fetchAdjustments()
})
</script>
