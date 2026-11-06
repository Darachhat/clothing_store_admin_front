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
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-tag"
          label="Print Barcodes"
          to="/labels/generate"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrows-right-left"
          label="Movements"
          to="/inventory/movements"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-truck"
          label="Transfers"
          to="/inventory/transfers"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchInventory"
        />
      </template>
    </AppPageHeader>

    <div class="kpi-grid-3">
      <AppStatCard
        label="Tracked Stock Lines"
        :value="stocks.length"
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

    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search by SKU, product name, or warehouse..."
      :chips="activeChips"
      :shown-count="filteredStocks.length"
      :total-count="stocks.length"
      count-label="stock records"
      @remove-chip="lowStockOnly = 'ALL'"
      @clear-all="search = ''; lowStockOnly = 'ALL'"
    >
      <AppSelect
        v-model="lowStockOnly"
        :options="[
          { label: 'All Stock Levels', value: 'ALL' },
          { label: 'Low Stock Alerts Only', value: 'LOW' },
        ]"
        style="min-width: 185px;"
      />
    </AppFilterBar>

    <!-- Stock Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredStocks"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-archive-box',
          label: 'No inventory records found',
          description: 'Try clearing your filters or record an initial stock adjustment.',
        }"
      >
        <template #cell-sku="{ row }">
          <span class="font-mono text-xs font-semibold text-gray-800">
            {{ row.sku || row.variant?.sku || '-' }}
          </span>
        </template>

        <template #cell-warehouse_id="{ row }">
          <span class="text-xs font-mono text-gray-600">
            {{ row.warehouse?.name || row.warehouse_name || row.warehouse_id }}
          </span>
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-bold text-sm mono"
            :class="Number(row.quantity ?? row.quantity_on_hand ?? 0) <= (row.reorder_level || 5) ? 'text-red-600' : 'text-gray-900'"
          >
            {{ row.quantity ?? row.quantity_on_hand ?? 0 }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            v-if="Number(row.quantity ?? row.quantity_on_hand ?? 0) <= 0"
            color="red"
            label="Out of Stock"
            size="sm"
          />
          <AppBadge
            v-else-if="Number(row.quantity ?? row.quantity_on_hand ?? 0) <= (row.reorder_level || 5)"
            color="yellow"
            label="Low Stock"
            size="sm"
          />
          <AppBadge
            v-else
            color="green"
            label="In Stock"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              size="xs"
              variant="primary"
              label="Adjust"
              @click="openQuickAdjust(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Adjustment Modal -->
    <AppModal
      v-model="isAdjustOpen"
      title="Stock Adjustment"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="submitAdjustment">
        <div class="form-field">
          <label class="field-label">Variant ID <span class="required">*</span></label>
          <AppInput v-model="adjustForm.variantId" placeholder="Variant UUID" required />
        </div>

        <div class="form-field">
          <label class="field-label">Warehouse ID <span class="required">*</span></label>
          <AppInput v-model="adjustForm.warehouseId" placeholder="Warehouse UUID" required />
        </div>

        <div class="form-field">
          <label class="field-label">Quantity Delta (+ to add, - to subtract) <span class="required">*</span></label>
          <AppInput v-model.number="adjustForm.quantityDelta" type="number" placeholder="e.g. +10 or -2" required />
        </div>

        <div class="form-field">
          <label class="field-label">Reason</label>
          <AppSelect
            v-model="adjustForm.reason"
            :options="[
              { label: 'Physical Count', value: 'PHYSICAL_COUNT' },
              { label: 'Damaged', value: 'DAMAGED' },
              { label: 'Lost', value: 'LOST' },
              { label: 'Return Restock', value: 'RETURN_RESTOCK' },
              { label: 'Initial Count', value: 'INITIAL_COUNT' },
            ]"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <AppInput v-model="adjustForm.notes" placeholder="Optional notes" />
        </div>

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

definePageMeta({
  middleware: ['auth'],
})
useHead({ title: 'Inventory Management — Clothing Store Admin' })

const route = useRoute()
const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const isSubmitting = ref(false)
const search = ref('')
const lowStockOnly = ref<'ALL' | 'LOW'>(route.query.low_stock_only === 'true' ? 'LOW' : 'ALL')
const stocks = ref<any[]>([])

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
  { key: 'warehouse_id', label: 'Warehouse' },
  { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'reorder_level', label: 'Reorder Level', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const lowStockCount = computed(() =>
  stocks.value.filter(s => {
    const qty = Number(s.quantity ?? s.quantity_on_hand ?? 0)
    return qty > 0 && qty <= (s.reorder_level || 5)
  }).length,
)

const outOfStockCount = computed(() =>
  stocks.value.filter(s => Number(s.quantity ?? s.quantity_on_hand ?? 0) <= 0).length,
)

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (lowStockOnly.value === 'LOW') {
    chips.push({ key: 'low', label: 'Filter', value: 'Low Stock Only' })
  }
  return chips
})

const filteredStocks = computed(() => {
  return stocks.value.filter((s) => {
    const qty = Number(s.quantity ?? s.quantity_on_hand ?? 0)
    if (lowStockOnly.value === 'LOW' && qty > (s.reorder_level || 5)) return false
    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase()
      const sku = (s.sku || s.variant?.sku || '').toLowerCase()
      const wh = (s.warehouse?.name || s.warehouse_id || '').toLowerCase()
      return sku.includes(q) || wh.includes(q)
    }
    return true
  })
})

async function fetchInventory() {
  loading.value = true
  try {
    const res: any = await invApi.listStocks({ limit: 100 })
    stocks.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (err: any) {
    toast.add({
      title: 'Failed to load inventory',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
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
  adjustForm.variantId = row.variant_id
  adjustForm.warehouseId = row.warehouse_id
  adjustForm.quantityDelta = 0
  adjustForm.reason = 'PHYSICAL_COUNT'
  adjustForm.notes = ''
  isAdjustOpen.value = true
}

async function submitAdjustment() {
  if (!adjustForm.variantId || !adjustForm.warehouseId || adjustForm.quantityDelta === 0) {
    toast.add({ title: 'Please fill all required fields', color: 'amber' })
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
    toast.add({ title: 'Stock adjusted successfully', color: 'green' })
    isAdjustOpen.value = false
    await fetchInventory()
  } catch (err: any) {
    toast.add({
      title: 'Adjustment failed',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchInventory()
})
</script>
