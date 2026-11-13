<template>
  <div class="page-root">
    <AppPageHeader
      title="Inventory Management"
      description="Track stock levels across warehouses and branches, print barcode stickers, and apply stock adjustments."
      :breadcrumbs="[
        { label: 'Inventory', to: '/inventory' },
        { label: 'Stock Levels' },
      ]"
      primary-label="Stock Adjustment"
      primary-icon="i-heroicons-adjustments-horizontal"
      @primary-click="openAdjustModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-tag" label="Print Barcodes" to="/labels/generate" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrows-right-left" label="Movements" to="/inventory/movements" />
        <AppButton size="sm" variant="default" icon="i-heroicons-truck" label="Transfers" to="/inventory/transfers" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" :loading="loading" aria-label="Refresh" @click="fetchInventory" />
      </template>
    </AppPageHeader>

    <!-- KPI Summary (from API X-Total-Count family or computed) -->
    <div class="kpi-grid-3">
      <AppStatCard
        label="Tracked Stock Lines"
        :value="totalCount"
        icon="i-heroicons-archive-box"
        tone="neutral"
        :loading="loading"
        sublabel="Active SKU warehouse allocations"
      />
      <AppStatCard
        label="Low Stock SKUs"
        :value="lowStockCount"
        icon="i-heroicons-exclamation-triangle"
        :tone="lowStockCount > 0 ? 'amber' : 'green'"
        :loading="loading"
        sublabel="Quantity at or below reorder threshold"
      />
      <AppStatCard
        label="Out of Stock"
        :value="outOfStockCount"
        icon="i-heroicons-x-circle"
        :tone="outOfStockCount > 0 ? 'red' : 'green'"
        :loading="loading"
        sublabel="Zero units on hand"
      />
    </div>

    <!-- Filter Bar -->
    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search by SKU, product name, or barcode..."
      :chips="activeChips"
      :shown-count="stocks.length"
      :total-count="totalCount"
      count-label="stock records"
      @remove-chip="onRemoveChip"
      @clear-all="clearFilters"
    >
      <AppSelect
        v-model="stockStatus"
        :options="[
          { label: 'All Stock Levels', value: 'ALL' },
          { label: 'Low Stock', value: 'LOW' },
          { label: 'Out of Stock', value: 'OUT' },
          { label: 'In Stock', value: 'IN' },
        ]"
        style="min-width: 185px;"
      />
    </AppFilterBar>

    <!-- Stock Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="stocks"
        :loading="loading"
        :error="loadError"
        :on-retry="fetchInventory"
        empty-text="No inventory records found. Try clearing your filters or record an initial stock adjustment."
      >
        <template #cell-sku="{ row }">
          <code class="mono text-xs font-semibold text-ink">{{ row.sku || row.variant?.sku || '—' }}</code>
        </template>

        <template #cell-product="{ row }">
          <span class="text-sm text-ink">{{ row.product_name || row.variant?.product?.name || '—' }}</span>
        </template>

        <template #cell-warehouse_id="{ row }">
          <span class="text-xs text-ink-secondary mono">{{ row.warehouse?.name || row.warehouse_name || row.warehouse_id }}</span>
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-semibold text-sm mono"
            :class="stockQtyClass(row)"
          >
            {{ row.quantity ?? row.quantity_on_hand ?? 0 }}
          </span>
        </template>

        <template #cell-reorder_level="{ row }">
          <span class="text-xs text-ink-secondary mono">{{ row.reorder_level ?? '—' }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="stockBadgeColor(row)" size="sm">
            {{ stockLabel(row) }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              size="xs"
              variant="primary"
              icon="i-heroicons-adjustments-horizontal"
              label="Adjust"
              :aria-label="`Adjust stock for ${row.sku || row.variant?.sku}`"
              @click="openQuickAdjust(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Pagination -->
    <AppPagination
      v-if="totalCount > pageSize"
      :page="page"
      :page-size="pageSize"
      :total="totalCount"
      @update:page="goPage"
    />

    <!-- Adjustment Modal -->
    <AppModal v-model="isAdjustOpen" title="Stock Adjustment" size="sm">
      <form class="flex flex-col gap-4" @submit.prevent="submitAdjustment">
        <AppInput
          id="adj-variant"
          v-model="adjustForm.variantId"
          label="Variant ID"
          placeholder="Variant UUID"
          mono
          required
        />
        <AppInput
          id="adj-warehouse"
          v-model="adjustForm.warehouseId"
          label="Warehouse ID"
          placeholder="Warehouse UUID"
          mono
          required
        />
        <AppInput
          id="adj-delta"
          v-model.number="adjustForm.quantityDelta"
          type="number"
          label="Quantity Delta (+ add, − remove)"
          placeholder="e.g. +10 or -2"
          mono
          required
        />
        <AppSelect
          id="adj-reason"
          v-model="adjustForm.reason"
          label="Reason"
          :options="[
            { label: 'Physical Count', value: 'PHYSICAL_COUNT' },
            { label: 'Damaged', value: 'DAMAGED' },
            { label: 'Lost', value: 'LOST' },
            { label: 'Return Restock', value: 'RETURN_RESTOCK' },
            { label: 'Initial Count', value: 'INITIAL_COUNT' },
          ]"
        />
        <AppInput id="adj-notes" v-model="adjustForm.notes" label="Notes" placeholder="Optional notes" />

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isAdjustOpen = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">Apply Adjustment</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Inventory Management — Clothing Store Admin' })

const route = useRoute()
const invApi = useInventoryApi()
const { addToast } = useAppToast()

const loading = ref(false)
const loadError = ref<string | null>(null)
const isSubmitting = ref(false)
const stocks = ref<any[]>([])
const totalCount = ref(0)
const lowStockCount = ref(0)
const outOfStockCount = ref(0)

const page = ref(1)
const pageSize = 50
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

const search = ref('')
const stockStatus = ref<'ALL' | 'LOW' | 'OUT' | 'IN'>(
  (route.query.stock_status as 'LOW' | 'OUT' | 'IN') || 'ALL',
)

const isAdjustOpen = ref(false)
const adjustForm = reactive({
  variantId: '',
  warehouseId: '',
  quantityDelta: 0,
  reason: 'PHYSICAL_COUNT',
  notes: '',
})

const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'product', label: 'Product' },
  { key: 'warehouse_id', label: 'Warehouse' },
  { key: 'quantity', label: 'Qty', sortable: true },
  { key: 'reorder_level', label: 'Reorder', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (stockStatus.value !== 'ALL') chips.push({ key: 'stock_status', label: 'Level', value: stockStatus.value })
  return chips
})

function onRemoveChip(key: string) {
  if (key === 'stock_status') stockStatus.value = 'ALL'
}
function clearFilters() {
  search.value = ''
  stockStatus.value = 'ALL'
}

function stockQty(row: any) { return Number(row.quantity ?? row.quantity_on_hand ?? 0) }
function stockQtyClass(row: any) {
  const q = stockQty(row)
  if (q <= 0) return 'text-red-600'
  if (q <= (row.reorder_level ?? 5)) return 'text-amber-600'
  return 'text-ink'
}
function stockBadgeColor(row: any) {
  const q = stockQty(row)
  if (q <= 0) return 'red'
  if (q <= (row.reorder_level ?? 5)) return 'yellow'
  return 'green'
}
function stockLabel(row: any) {
  const q = stockQty(row)
  if (q <= 0) return 'Out of Stock'
  if (q <= (row.reorder_level ?? 5)) return 'Low Stock'
  return 'In Stock'
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchInventory() }, 350)
})
watch(stockStatus, () => { page.value = 1; fetchInventory() })

function goPage(p: number) { page.value = p; fetchInventory() }

async function fetchInventory() {
  loading.value = true
  loadError.value = null
  try {
    const params: Record<string, unknown> = {
      skip: (page.value - 1) * pageSize,
      limit: pageSize,
    }
    if (search.value.trim()) params.q = search.value.trim()
    if (stockStatus.value !== 'ALL') params.stock_status = stockStatus.value

    // listStocks now returns paginated data with X-Total-Count header
    const res: any = await invApi.listStocks(params)

    if (Array.isArray(res)) {
      stocks.value = res
      totalCount.value = res.length
    } else if (res?.items) {
      stocks.value = res.items
      totalCount.value = res.total ?? res.items.length
    } else {
      stocks.value = []
      totalCount.value = 0
    }

    // compute KPIs from current page data (best effort)
    lowStockCount.value = stocks.value.filter(s => {
      const q = stockQty(s)
      return q > 0 && q <= (s.reorder_level ?? 5)
    }).length
    outOfStockCount.value = stocks.value.filter(s => stockQty(s) <= 0).length
  } catch (err: any) {
    loadError.value = err?.data?.detail ?? err?.message ?? 'Failed to load inventory'
  } finally {
    loading.value = false
  }
}

function openAdjustModal() {
  adjustForm.variantId = ''
  adjustForm.warehouseId = ''
  adjustForm.quantityDelta = 0
  adjustForm.reason = 'PHYSICAL_COUNT'
  adjustForm.notes = ''
  isAdjustOpen.value = true
}

function openQuickAdjust(row: any) {
  adjustForm.variantId = row.variant_id ?? row.variant?.id ?? ''
  adjustForm.warehouseId = row.warehouse_id ?? row.warehouse?.id ?? ''
  adjustForm.quantityDelta = 0
  adjustForm.reason = 'PHYSICAL_COUNT'
  adjustForm.notes = ''
  isAdjustOpen.value = true
}

async function submitAdjustment() {
  if (!adjustForm.variantId || !adjustForm.warehouseId || adjustForm.quantityDelta === 0) {
    addToast({ type: 'warn', title: 'Please fill all required fields' })
    return
  }
  isSubmitting.value = true
  try {
    await invApi.createAdjustment({
      variant_id: adjustForm.variantId,
      warehouse_id: adjustForm.warehouseId,
      quantity_delta: adjustForm.quantityDelta,
      movement_type: adjustForm.reason || 'ADJUSTMENT',
      note: adjustForm.notes || undefined,
    })
    addToast({ type: 'success', title: 'Stock adjusted successfully' })
    isAdjustOpen.value = false
    await fetchInventory()
  } catch (err: any) {
    addToast({ type: 'error', title: 'Adjustment failed', message: err?.data?.detail ?? err?.message })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(fetchInventory)
</script>
