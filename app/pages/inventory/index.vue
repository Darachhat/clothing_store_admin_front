<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Levels"
      description="Real-time warehouse stock quantities, reserved allocations, and low-stock reorder thresholds."
      :breadcrumbs="[
        { label: 'Inventory', to: '/inventory' },
        { label: 'Stock Levels' },
      ]"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrows-right-left" label="Movements" to="/inventory/movements" />
        <AppButton size="sm" variant="default" icon="i-heroicons-truck" label="Transfers" to="/inventory/transfers" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchStock" />
      </template>
      <template #actions>
        <AppButton size="sm" variant="primary" icon="i-heroicons-adjustments-horizontal" label="New Adjustment" to="/inventory/adjustments" />
      </template>
    </AppPageHeader>

    <div class="kpi-grid-3">
      <AppStatCard
        label="Tracked Stock Lines"
        :value="stockList.length"
        icon="i-heroicons-archive-box"
        tone="neutral"
        :loading="loading"
        :sublabel="`Across ${warehouses.length || 1} active warehouse(s)`"
      />
      <AppStatCard
        label="Low Stock SKUs"
        :value="lowStockCount"
        icon="i-heroicons-exclamation-triangle"
        :tone="lowStockCount > 0 ? 'amber' : 'green'"
        :loading="loading"
        sublabel="Available quantity at or below reorder point"
      />
      <AppStatCard
        label="Out of Stock"
        :value="outOfStockCount"
        icon="i-heroicons-x-circle"
        :tone="outOfStockCount > 0 ? 'red' : 'green'"
        :loading="loading"
        sublabel="Zero available units on hand"
      />
    </div>

    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search by SKU, product name, color, size, or warehouse..."
      :chips="activeChips"
      :shown-count="paginatedStock.length"
      :total-count="filteredStock.length"
      count-label="stock records"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="warehouseFilter"
        :options="warehouseOptions"
        style="min-width: 170px;"
      />
      <AppSelect
        v-model="stockStateFilter"
        :options="[
          { label: 'All Stock States', value: '' },
          { label: 'Low or Out of Stock', value: 'LOW' },
          { label: 'Out of Stock (0)', value: 'OUT' },
          { label: 'Healthy Stock', value: 'HEALTHY' },
        ]"
        style="min-width: 165px;"
      />
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedStock"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-archive-box',
          label: 'No inventory stock records found',
          description: 'Try clearing your filters or record an initial stock adjustment.',
        }"
      >
        <template #cell-sku_display="{ row }">
          <div>
            <code class="mono font-semibold text-gray-900">{{ row.sku_display }}</code>
            <div v-if="row.variant_attr_display" class="text-xs text-gray-500">{{ row.variant_attr_display }}</div>
          </div>
        </template>

        <template #cell-product_display="{ row }">
          <span class="font-medium text-gray-900">{{ row.product_display }}</span>
        </template>

        <template #cell-warehouse_display="{ row }">
          <span class="text-xs font-medium text-gray-700">{{ row.warehouse_display }}</span>
        </template>

        <template #cell-quantity_on_hand="{ row }">
          <span class="mono font-semibold">{{ row.quantity_on_hand }}</span>
        </template>

        <template #cell-quantity_reserved="{ row }">
          <span class="mono text-gray-500">{{ row.quantity_reserved }}</span>
        </template>

        <template #cell-quantity_available="{ row }">
          <AppBadge
            :color="row.quantity_available <= 0 ? 'red' : row.quantity_available <= (row.reorder_point || 5) ? 'yellow' : 'green'"
            size="sm"
          >
            {{ row.quantity_available }} available
          </AppBadge>
        </template>

        <template #cell-actions="{ row }">
          <AppButton size="xs" variant="default" icon="i-heroicons-adjustments-horizontal" label="Adjust" @click="openAdjustModal(row)" />
        </template>

        <template v-if="filteredStock.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredStock.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Quick Adjust Modal -->
    <AppModal
      v-model="showAdjustModal"
      title="Quick Stock Adjustment"
      :description="selectedItem ? `${selectedItem.product_display} (${selectedItem.sku_display}) · ${selectedItem.warehouse_display}` : ''"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="submitAdjustment">
        <div class="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
          <span class="text-gray-600">Current On-Hand Quantity:</span>
          <strong class="mono text-sm text-gray-900">{{ selectedItem?.quantity_on_hand ?? 0 }} units</strong>
        </div>

        <div class="form-field">
          <label class="field-label">Quantity Change (+/-) <span class="required">*</span></label>
          <input
            v-model.number="adjustForm.quantity_change"
            type="number"
            required
            placeholder="e.g. +10 or -3"
            class="field-input mono"
          />
          <span class="field-hint">Use positive numbers to add stock or negative numbers to deduct.</span>
        </div>

        <div class="form-field">
          <label class="field-label">Reason / Audit Note <span class="required">*</span></label>
          <input
            v-model="adjustForm.notes"
            type="text"
            required
            placeholder="e.g. Cycle count correction, damaged item..."
            class="field-input"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showAdjustModal = false" />
          <AppButton type="submit" variant="primary" label="Apply Adjustment" :loading="adjusting" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Levels — Clothing Store Admin' })

const route = useRoute()
const inventoryApi = useInventoryApi()
const branchApi = useBranchApi()
const variantApi = useVariantApi()
const toast = useAppToast()

const loading = ref(false)
const adjusting = ref(false)
const stockList = ref<any[]>([])
const warehouses = ref<any[]>([])
const variants = ref<any[]>([])

const search = ref('')
const warehouseFilter = ref('')
const stockStateFilter = ref(route.query.low_stock_only === 'true' ? 'LOW' : '')
const currentPage = ref(1)
const pageSize = 25

const showAdjustModal = ref(false)
const selectedItem = ref<any>(null)
const adjustForm = ref({ quantity_change: 0, notes: '' })

const columns = [
  { key: 'sku_display', label: 'SKU / Variant', sortable: true },
  { key: 'product_display', label: 'Product Name', sortable: true },
  { key: 'warehouse_display', label: 'Warehouse', sortable: true },
  { key: 'quantity_on_hand', label: 'On Hand', sortable: true },
  { key: 'quantity_reserved', label: 'Reserved', sortable: true },
  { key: 'quantity_available', label: 'Available', sortable: true },
  { key: 'reorder_point', label: 'Reorder Pt', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const warehouseMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const w of warehouses.value) {
    if (w?.id) m[w.id] = w.name
  }
  return m
})

const variantMap = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const v of variants.value) {
    if (v?.id) m[v.id] = v
  }
  return m
})

const warehouseOptions = computed(() => [
  { label: 'All Warehouses', value: '' },
  ...warehouses.value.map(w => ({ label: w.name, value: w.id })),
])

const enrichedStock = computed(() => {
  return stockList.value.map((row) => {
    const v = variantMap.value[row.variant_id]
    const skuDisplay = row.sku || v?.sku || String(row.variant_id || '').slice(0, 8)
    const productDisplay = row.product_name || v?.product_name || skuDisplay
    const variantAttr = [row.color || v?.color, row.size || v?.size].filter(Boolean).join(' / ')
    const whDisplay = row.warehouse_name || warehouseMap.value[row.warehouse_id] || 'Main Warehouse'
    return {
      ...row,
      sku_display: skuDisplay,
      product_display: productDisplay,
      variant_attr_display: variantAttr,
      warehouse_display: whDisplay,
    }
  })
})

const lowStockCount = computed(() =>
  enrichedStock.value.filter(r => Number(r.quantity_available) > 0 && Number(r.quantity_available) <= Number(r.reorder_point || 5)).length,
)

const outOfStockCount = computed(() =>
  enrichedStock.value.filter(r => Number(r.quantity_available) <= 0).length,
)

const filteredStock = computed(() => {
  const q = search.value.trim().toLowerCase()
  return enrichedStock.value.filter((r) => {
    if (q) {
      const hay = [r.sku_display, r.product_display, r.variant_attr_display, r.warehouse_display]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (warehouseFilter.value && r.warehouse_id !== warehouseFilter.value) return false
    if (stockStateFilter.value === 'OUT' && Number(r.quantity_available) > 0) return false
    if (stockStateFilter.value === 'LOW' && Number(r.quantity_available) > Number(r.reorder_point || 5)) return false
    if (stockStateFilter.value === 'HEALTHY' && Number(r.quantity_available) <= Number(r.reorder_point || 5)) return false
    return true
  })
})

const paginatedStock = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStock.value.slice(start, start + pageSize)
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (warehouseFilter.value) {
    chips.push({ key: 'warehouse', label: 'Warehouse', value: warehouseMap.value[warehouseFilter.value] || warehouseFilter.value })
  }
  if (stockStateFilter.value) {
    chips.push({ key: 'state', label: 'Stock State', value: stockStateFilter.value })
  }
  return chips
})

function removeChip(key: string) {
  if (key === 'warehouse') warehouseFilter.value = ''
  if (key === 'state') stockStateFilter.value = ''
  currentPage.value = 1
}

function resetFilters() {
  search.value = ''
  warehouseFilter.value = ''
  stockStateFilter.value = ''
  currentPage.value = 1
}

watch([search, warehouseFilter, stockStateFilter], () => {
  currentPage.value = 1
})

function openAdjustModal(item: any) {
  selectedItem.value = item
  adjustForm.value = { quantity_change: 0, notes: '' }
  showAdjustModal.value = true
}

async function fetchLookups() {
  try {
    const [bList, vList] = await Promise.all([
      branchApi.listBranches().catch(() => []),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    variants.value = (vList as any[]) || []
    const whs: any[] = []
    for (const b of (bList as any[]) || []) {
      if (Array.isArray(b.warehouses) && b.warehouses.length > 0) {
        whs.push(...b.warehouses)
      } else {
        try {
          const bw = await branchApi.listWarehouses(b.id)
          whs.push(...((bw as any[]) || []))
        } catch {}
      }
    }
    warehouses.value = whs
  } catch {}
}

async function fetchStock() {
  loading.value = true
  try {
    const data = await inventoryApi.listStock({ limit: 200 }) as any[]
    stockList.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error loading stock', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function submitAdjustment() {
  if (!selectedItem.value) return
  if (adjustForm.value.quantity_change === 0) {
    toast.add({ title: 'Validation Error', description: 'Quantity change cannot be 0.', color: 'amber' })
    return
  }
  adjusting.value = true
  try {
    await inventoryApi.createAdjustment({
      warehouse_id: selectedItem.value.warehouse_id,
      variant_id: selectedItem.value.variant_id,
      quantity_change: adjustForm.value.quantity_change,
      notes: adjustForm.value.notes,
    })
    toast.add({ title: 'Stock Adjusted', description: 'Inventory level updated successfully', color: 'green' })
    showAdjustModal.value = false
    await fetchStock()
  } catch (err: any) {
    toast.add({ title: 'Adjustment Failed', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    adjusting.value = false
  }
}

onMounted(async () => {
  await fetchLookups()
  await fetchStock()
})
</script>
