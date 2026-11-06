<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Adjustments"
      description="Record manual cycle count corrections, damaged write-offs, and found stock."
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
      search-placeholder="Search adjustments by SKU, product name, warehouse, or notes..."
      :shown-count="filteredAdjustments.length"
      :total-count="adjustments.length"
      count-label="adjustments"
      @clear-all="searchQuery = ''"
    />

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredAdjustments"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-adjustments-horizontal',
          label: 'No stock adjustments recorded yet',
          description: 'Use New Adjustment to log manual inventory corrections or damaged stock write-offs.',
        }"
      >
        <template #cell-variant_display="{ row }">
          <div>
            <code class="mono font-semibold text-gray-900">{{ row.sku_display }}</code>
            <div class="text-xs text-gray-500">{{ row.product_display }}</div>
          </div>
        </template>

        <template #cell-warehouse_display="{ row }">
          <span class="text-xs text-gray-700">{{ row.warehouse_display }}</span>
        </template>

        <template #cell-movement_type="{ row }">
          <AppBadge :color="row.movement_type === 'DAMAGE' ? 'red' : 'yellow'" size="sm">
            {{ row.movement_type }}
          </AppBadge>
        </template>

        <template #cell-quantity_change="{ row }">
          <span class="mono font-bold" :class="row.quantity_change > 0 ? 'text-emerald-700' : 'text-red-700'">
            {{ row.quantity_change > 0 ? `+${row.quantity_change}` : row.quantity_change }}
          </span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ new Date(row.created_at).toLocaleString() }}</span>
        </template>
      </AppTable>
    </AppCard>

    <AppModal
      v-model="showModal"
      title="New Stock Adjustment"
      description="Select the warehouse and SKU variant to adjust on-hand inventory."
      size="md"
    >
      <form class="form-grid" @submit.prevent="submitAdjustment">
        <div class="form-field">
          <label class="field-label">Warehouse <span class="required">*</span></label>
          <select v-model="form.warehouse_id" required class="field-input">
            <option value="" disabled>Select warehouse...</option>
            <option v-for="w in warehousesList" :key="w.id" :value="w.id">
              {{ w.branchName ? `${w.branchName} — ${w.name}` : w.name }}
            </option>
          </select>
        </div>

        <div class="form-field">
          <label class="field-label">Product Variant (SKU) <span class="required">*</span></label>
          <select v-model="form.variant_id" required class="field-input">
            <option value="" disabled>Select SKU / Variant...</option>
            <option v-for="v in variantsList" :key="v.id" :value="v.id">
              {{ v.sku }} — {{ v.product_name || 'Product' }} ({{ [v.color, v.size].filter(Boolean).join(' / ') }})
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Quantity Change (+/-) <span class="required">*</span></label>
            <input
              v-model.number="form.quantity_change"
              type="number"
              required
              placeholder="e.g. -2 or +5"
              class="field-input mono"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Adjustment Type</label>
            <select v-model="form.reason" class="field-input">
              <option value="ADJUSTMENT">Manual Count Adjustment</option>
              <option value="DAMAGE">Damaged / Write-Off</option>
              <option value="FOUND">Found Inventory</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Audit Note <span class="required">*</span></label>
          <textarea
            v-model="form.notes"
            rows="2"
            required
            placeholder="Explain the reason for this stock change..."
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

const inventoryApi = useInventoryApi()
const branchApi = useBranchApi()
const variantApi = useVariantApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const adjustments = ref<any[]>([])
const warehousesList = ref<any[]>([])
const variantsList = ref<any[]>([])
const searchQuery = ref('')

const form = ref({
  warehouse_id: '',
  variant_id: '',
  quantity_change: 0,
  reason: 'ADJUSTMENT',
  notes: '',
})

const columns = [
  { key: 'variant_display', label: 'SKU / Product', sortable: true },
  { key: 'warehouse_display', label: 'Warehouse', sortable: true },
  { key: 'movement_type', label: 'Type', sortable: true },
  { key: 'quantity_change', label: 'Change', sortable: true },
  { key: 'quantity_before', label: 'Before', sortable: true },
  { key: 'quantity_after', label: 'After', sortable: true },
  { key: 'notes', label: 'Audit Note' },
  { key: 'created_at', label: 'Date', sortable: true },
]

const variantMap = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const v of variantsList.value) {
    if (v?.id) m[v.id] = v
  }
  return m
})

const warehouseMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const w of warehousesList.value) {
    if (w?.id) m[w.id] = w.branchName ? `${w.branchName} — ${w.name}` : w.name
  }
  return m
})

const enrichedAdjustments = computed(() =>
  adjustments.value.map((a) => {
    const v = variantMap.value[a.variant_id]
    const sku = a.sku || v?.sku || String(a.variant_id || '').slice(0, 8)
    const prod = a.product_name || v?.product_name || 'Variant'
    const attrs = [v?.color, v?.size].filter(Boolean).join(' / ')
    return {
      ...a,
      sku_display: sku,
      product_display: attrs ? `${prod} (${attrs})` : prod,
      variant_display: `${sku} ${prod}`,
      warehouse_display: a.warehouse_name || warehouseMap.value[a.warehouse_id] || 'Main Warehouse',
    }
  }),
)

const filteredAdjustments = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return enrichedAdjustments.value
  return enrichedAdjustments.value.filter(a =>
    [a.sku_display, a.product_display, a.warehouse_display, a.notes].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

function openModal() {
  form.value = {
    warehouse_id: warehousesList.value[0]?.id || '',
    variant_id: variantsList.value[0]?.id || '',
    quantity_change: 0,
    reason: 'ADJUSTMENT',
    notes: '',
  }
  showModal.value = true
}

async function fetchLookups() {
  try {
    const [bList, vList] = await Promise.all([
      branchApi.listBranches().catch(() => []),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    variantsList.value = (vList as any[]) || []
    const allWh: any[] = []
    for (const b of (bList as any[]) || []) {
      if (b.warehouses?.length) {
        for (const w of b.warehouses) allWh.push({ ...w, branchName: b.name })
      } else {
        try {
          const whs = await branchApi.listWarehouses(b.id) as any[]
          for (const w of whs || []) allWh.push({ ...w, branchName: b.name })
        } catch {}
      }
    }
    warehousesList.value = allWh
  } catch {}
}

async function fetchAdjustments() {
  loading.value = true
  try {
    const data = await inventoryApi.listMovements({ movement_type: 'ADJUSTMENT' }) as any[]
    adjustments.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function submitAdjustment() {
  if (form.value.quantity_change === 0) {
    toast.add({ title: 'Validation Error', description: 'Quantity change cannot be 0.', color: 'amber' })
    return
  }
  saving.value = true
  try {
    await inventoryApi.createAdjustment(form.value)
    toast.add({ title: 'Adjusted', description: 'Stock adjustment recorded', color: 'green' })
    showModal.value = false
    await fetchAdjustments()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchLookups()
  await fetchAdjustments()
})
</script>
