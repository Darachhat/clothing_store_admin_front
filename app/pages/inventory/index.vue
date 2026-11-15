<template>
  <div class="page-root">
    <AppPageHeader
      :title="t('inventory.title', 'Inventory Management')"
      :description="t('inventory.description', 'Track stock levels across warehouses and branches, print barcode stickers, and apply stock adjustments.')"
      :breadcrumbs="[
        { label: t('nav_section.inventory', 'Inventory'), to: '/inventory' },
        { label: t('nav.stock_levels', 'Stock Levels') },
      ]"
      :primary-label="t('inventory.stock_adjustment', 'Stock Adjustment')"
      primary-icon="i-heroicons-adjustments-horizontal"
      @primary-click="openAdjustModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-tag" :label="t('nav.print_labels', 'Print Barcodes')" to="/labels/generate" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrows-right-left" :label="t('nav.movements', 'Movements')" to="/inventory/movements" />
        <AppButton size="sm" variant="default" icon="i-heroicons-truck" :label="t('nav.transfers', 'Transfers')" to="/inventory/transfers" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" :loading="loading" :aria-label="t('common.refresh', 'Refresh')" @click="fetchInventory" />
      </template>
    </AppPageHeader>

    <!-- KPI Summary -->
    <div class="kpi-grid-3">
      <AppStatCard
        :label="t('inventory.tracked_lines', 'Tracked Stock Lines')"
        :value="totalCount"
        icon="i-heroicons-archive-box"
        tone="neutral"
        :loading="loading"
        :sublabel="t('inventory.tracked_sub', 'Active SKU warehouse allocations')"
      />
      <AppStatCard
        :label="t('inventory.low_stock_skus', 'Low Stock SKUs')"
        :value="lowStockCount"
        icon="i-heroicons-exclamation-triangle"
        :tone="lowStockCount > 0 ? 'amber' : 'green'"
        :loading="loading"
        :sublabel="t('inventory.low_stock_sub', 'Quantity at or below reorder threshold')"
      />
      <AppStatCard
        :label="t('inventory.out_of_stock', 'Out of Stock')"
        :value="outOfStockCount"
        icon="i-heroicons-x-circle"
        :tone="outOfStockCount > 0 ? 'red' : 'green'"
        :loading="loading"
        :sublabel="t('inventory.out_of_stock_sub', 'Zero units on hand')"
      />
    </div>

    <!-- Filter Bar -->
    <AppFilterBar
      v-model:search="search"
      :search-placeholder="t('inventory.search_placeholder', 'Search by SKU, product name, or barcode...')"
      :chips="activeChips"
      :shown-count="stocks.length"
      :total-count="totalCount"
      :count-label="t('nav.stock_levels', 'stock records')"
      @remove-chip="onRemoveChip"
      @clear-all="clearFilters"
    >
      <AppSelect
        v-model="stockStatus"
        :options="[
          { label: t('inventory.all_levels', 'All Stock Levels'), value: 'ALL' },
          { label: t('inventory.low_stock', 'Low Stock'), value: 'LOW' },
          { label: t('inventory.out_of_stock', 'Out of Stock'), value: 'OUT' },
          { label: t('inventory.in_stock', 'In Stock'), value: 'IN' },
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
        :empty-text="t('inventory.empty_text', 'No inventory records found. Try clearing your filters or record an initial stock adjustment.')"
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
              :label="t('inventory.adjust', 'Adjust')"
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
    <AppModal v-model="isAdjustOpen" :title="t('inventory.stock_adjustment', 'Stock Adjustment')" size="sm">
      <form class="flex flex-col gap-4" @submit.prevent="submitAdjustment">
        <AppInput
          id="adj-variant"
          v-model="adjustForm.variantId"
          :label="t('inventory.variant_id', 'Variant ID')"
          placeholder="Variant UUID"
          mono
          required
        />
        <AppInput
          id="adj-warehouse"
          v-model="adjustForm.warehouseId"
          :label="t('fields.warehouse', 'Warehouse ID')"
          placeholder="Warehouse UUID"
          mono
          required
        />
        <AppInput
          id="adj-delta"
          v-model.number="adjustForm.quantityDelta"
          type="number"
          :label="t('inventory.qty_delta', 'Quantity Delta (+ add, − remove)')"
          placeholder="e.g. +10 or -2"
          mono
          required
        />
        <AppSelect
          id="adj-reason"
          v-model="adjustForm.reason"
          :label="t('inventory.reason', 'Reason')"
          :options="[
            { label: t('inventory.reason_physical', 'Physical Count'), value: 'PHYSICAL_COUNT' },
            { label: t('inventory.reason_damaged', 'Damaged'), value: 'DAMAGED' },
            { label: t('inventory.reason_lost', 'Lost'), value: 'LOST' },
            { label: t('inventory.reason_return', 'Return Restock'), value: 'RETURN_RESTOCK' },
            { label: t('inventory.reason_initial', 'Initial Count'), value: 'INITIAL_COUNT' },
          ]"
        />
        <AppInput id="adj-notes" v-model="adjustForm.notes" :label="t('fields.notes', 'Notes')" placeholder="Optional notes" />

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isAdjustOpen = false">{{ t('common.cancel', 'Cancel') }}</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">{{ t('inventory.apply_adjustment', 'Apply Adjustment') }}</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })

const { t } = useAppTranslation()
useHead({ title: computed(() => `${t('inventory.title', 'Inventory Management')} — Clothing Store Admin`) })

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

const columns = computed(() => [
  { key: 'sku', label: t('fields.sku', 'SKU'), sortable: true },
  { key: 'product', label: t('nav.products', 'Product') },
  { key: 'warehouse_id', label: t('fields.warehouse', 'Warehouse') },
  { key: 'quantity', label: t('fields.quantity', 'Qty'), sortable: true },
  { key: 'reorder_level', label: t('inventory.col_reorder', 'Reorder'), sortable: true },
  { key: 'status', label: t('common.status', 'Status') },
  { key: 'actions', label: t('common.actions', 'Actions'), align: 'right' as const },
])

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (stockStatus.value !== 'ALL') chips.push({ key: 'stock_status', label: t('common.status', 'Status'), value: stockStatus.value })
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
  if (q <= 0) return t('inventory.out_of_stock', 'Out of Stock')
  if (q <= (row.reorder_level ?? 5)) return t('inventory.low_stock', 'Low Stock')
  return t('inventory.in_stock', 'In Stock')
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
