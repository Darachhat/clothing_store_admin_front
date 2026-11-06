<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Movements"
      description="Immutable audit ledger of all inventory additions, sales deductions, transfers, and adjustments."
      :breadcrumbs="[
        { label: 'Inventory', to: '/inventory' },
        { label: 'Movements' },
      ]"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchMovements" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search by SKU, product name, movement type, or notes..."
      :chips="activeChips"
      :shown-count="paginatedMovements.length"
      :total-count="filteredMovements.length"
      count-label="movements"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="movementType"
        :options="[
          { label: 'All Movement Types', value: '' },
          { label: 'Purchase', value: 'PURCHASE' },
          { label: 'Sale', value: 'SALE' },
          { label: 'Adjustment', value: 'ADJUSTMENT' },
          { label: 'Transfer In', value: 'TRANSFER_IN' },
          { label: 'Transfer Out', value: 'TRANSFER_OUT' },
          { label: 'Return', value: 'RETURN' },
          { label: 'Damage', value: 'DAMAGE' },
        ]"
        style="min-width: 165px;"
        @change="fetchMovements"
      />
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">From:</span>
        <input v-model="fromDate" type="date" class="field-input" style="width: 140px;" @change="fetchMovements" />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">To:</span>
        <input v-model="toDate" type="date" class="field-input" style="width: 140px;" @change="fetchMovements" />
      </div>
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedMovements"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-arrows-right-left',
          label: 'No stock movements recorded',
          description: 'Inventory changes from purchases, POS sales, and adjustments will appear here.',
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
          <AppBadge :color="typeColor(row.movement_type)" size="sm">
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

        <template v-if="filteredMovements.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredMovements.length"
          />
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Movements — Clothing Store Admin' })

const inventoryApi = useInventoryApi()
const variantApi = useVariantApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const movements = ref<any[]>([])
const variants = ref<any[]>([])
const warehouses = ref<any[]>([])

const searchQuery = ref('')
const movementType = ref('')
const fromDate = ref('')
const toDate = ref('')
const currentPage = ref(1)
const pageSize = 25

const columns = [
  { key: 'variant_display', label: 'SKU / Product', sortable: true },
  { key: 'warehouse_display', label: 'Warehouse', sortable: true },
  { key: 'movement_type', label: 'Type', sortable: true },
  { key: 'quantity_change', label: 'Qty Change', sortable: true },
  { key: 'quantity_before', label: 'Before', sortable: true },
  { key: 'quantity_after', label: 'After', sortable: true },
  { key: 'notes', label: 'Notes / Reference' },
  { key: 'created_at', label: 'Date', sortable: true },
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

const enrichedMovements = computed(() => {
  return movements.value.map((m) => {
    const v = variantMap.value[m.variant_id]
    const sku = m.sku || v?.sku || String(m.variant_id || '').slice(0, 8)
    const prod = m.product_name || v?.product_name || 'Variant'
    const attrs = [v?.color, v?.size].filter(Boolean).join(' / ')
    return {
      ...m,
      sku_display: sku,
      product_display: attrs ? `${prod} (${attrs})` : prod,
      variant_display: `${sku} ${prod}`,
      warehouse_display: m.warehouse_name || warehouseMap.value[m.warehouse_id] || 'Main Warehouse',
    }
  })
})

const filteredMovements = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return enrichedMovements.value
  return enrichedMovements.value.filter(m =>
    [m.sku_display, m.product_display, m.movement_type, m.notes, m.warehouse_display]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
})

const paginatedMovements = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMovements.value.slice(start, start + pageSize)
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (movementType.value) chips.push({ key: 'type', label: 'Type', value: movementType.value })
  if (fromDate.value) chips.push({ key: 'from', label: 'From', value: fromDate.value })
  if (toDate.value) chips.push({ key: 'to', label: 'To', value: toDate.value })
  return chips
})

function removeChip(key: string) {
  if (key === 'type') movementType.value = ''
  if (key === 'from') fromDate.value = ''
  if (key === 'to') toDate.value = ''
  currentPage.value = 1
  fetchMovements()
}

function resetFilters() {
  searchQuery.value = ''
  movementType.value = ''
  fromDate.value = ''
  toDate.value = ''
  currentPage.value = 1
  fetchMovements()
}

function typeColor(type: string) {
  const colors: Record<string, string> = {
    PURCHASE: 'green',
    SALE: 'blue',
    ADJUSTMENT: 'yellow',
    TRANSFER_IN: 'green',
    TRANSFER_OUT: 'yellow',
    RETURN: 'blue',
    DAMAGE: 'red',
  }
  return colors[type] || 'default'
}

async function fetchMovements() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (movementType.value) params.movement_type = movementType.value
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value
    const data = await inventoryApi.listMovements(params) as any[]
    movements.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const [vList, bList] = await Promise.all([
    variantApi.listVariants({ limit: 200 }).catch(() => []),
    branchApi.listBranches().catch(() => []),
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
  await fetchMovements()
})
</script>
