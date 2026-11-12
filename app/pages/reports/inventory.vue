<template>
  <div class="page-root">
    <AppPageHeader
      title="Inventory Report"
      description="Stock valuation, SKU coverage, and reorder threshold alerts across warehouses."
      :breadcrumbs="[{ label: 'Reports', to: '/reports' }, { label: 'Inventory Report' }]"
      back-to="/reports"
    >
      <template #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-path" :loading="loading" @click="fetchStocks">
          Refresh
        </AppButton>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-down-tray" :disabled="!filteredRows.length" @click="exportCsv">
          Export CSV
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Summary KPIs -->
    <div class="kpi-grid">
      <AppStatCard
        label="Total SKUs"
        :value="summary.totalSkus"
        sublabel="Tracked product variants"
        icon="i-heroicons-tag"
        tone="primary"
        :loading="loading"
      />
      <AppStatCard
        label="Total Stock Units"
        :value="summary.totalUnits"
        sublabel="Combined units on hand"
        icon="i-heroicons-archive-box"
        tone="info"
        :loading="loading"
      />
      <AppStatCard
        label="Out of Stock"
        :value="summary.outOfStock"
        sublabel="SKUs with 0 units"
        icon="i-heroicons-x-circle"
        :tone="summary.outOfStock > 0 ? 'danger' : 'neutral'"
        :loading="loading"
      />
      <AppStatCard
        label="Low Stock Alerts"
        :value="summary.lowStock"
        sublabel="SKUs below reorder level"
        icon="i-heroicons-exclamation-triangle"
        :tone="summary.lowStock > 0 ? 'warning' : 'neutral'"
        :loading="loading"
      />
    </div>

    <!-- Filters -->
    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search SKU or product name..."
      :total-count="filteredRows.length"
      result-label="SKUs"
      :active-chips="activeChips"
      @remove-chip="statusFilter = ''"
      @clear-all="clearFilters"
    >
      <template #filters>
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          style="min-width: 170px;"
        />
      </template>
    </AppFilterBar>

    <!-- Inventory Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredRows"
        :loading="loading"
        empty-text="No inventory records match the current filters."
        empty-icon="i-heroicons-clipboard-document-list"
      >
        <template #cell-sku="{ row }">
          <span class="font-mono text-xs font-semibold text-ink">{{ row.sku || '—' }}</span>
        </template>

        <template #cell-quantity="{ row }">
          <span
            class="font-medium tabular-nums"
            :class="row.quantity <= 0 ? 'text-status-red' : row.quantity <= (row.reorder_level || 5) ? 'text-status-amber' : 'text-status-green'"
          >
            {{ row.quantity }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.quantity <= 0 ? 'red' : row.quantity <= (row.reorder_level || 5) ? 'amber' : 'green'"
            dot
            size="sm"
          >
            {{ row.quantity <= 0 ? 'Out of Stock' : row.quantity <= (row.reorder_level || 5) ? 'Low Stock' : 'In Stock' }}
          </AppBadge>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Inventory Report — Clothing Store' })

const invApi = useInventoryApi()
const { addToast } = useAppToast()

const loading = ref(false)
const stocks = ref<any[]>([])
const search = ref('')
const statusFilter = ref('')

const statusOptions = [
  { label: 'All Stock States', value: '' },
  { label: 'In Stock', value: 'in' },
  { label: 'Low Stock', value: 'low' },
  { label: 'Out of Stock', value: 'out' },
]

const activeChips = computed(() => {
  const chips: { key: string; label: string; value: string }[] = []
  if (statusFilter.value) {
    const found = statusOptions.find(o => o.value === statusFilter.value)
    if (found) chips.push({ key: 'status', label: 'Status', value: found.label })
  }
  return chips
})

function clearFilters() {
  search.value = ''
  statusFilter.value = ''
}

const columns = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'product_name', label: 'Product', sortable: true },
  { key: 'color', label: 'Color', sortable: true },
  { key: 'size', label: 'Size', sortable: true },
  { key: 'quantity', label: 'On Hand Qty', sortable: true },
  { key: 'reorder_level', label: 'Reorder At', sortable: true },
  { key: 'status', label: 'Status' },
]

const filteredRows = computed(() => {
  return stocks.value.filter(s => {
    const matchSearch = !search.value || (s.sku || '').toLowerCase().includes(search.value.toLowerCase()) ||
      (s.product_name || '').toLowerCase().includes(search.value.toLowerCase())
    let matchStatus = true
    if (statusFilter.value === 'out') matchStatus = s.quantity <= 0
    else if (statusFilter.value === 'low') matchStatus = s.quantity > 0 && s.quantity <= (s.reorder_level || 5)
    else if (statusFilter.value === 'in') matchStatus = s.quantity > (s.reorder_level || 5)
    return matchSearch && matchStatus
  })
})

const summary = computed(() => ({
  totalSkus: stocks.value.length,
  totalUnits: stocks.value.reduce((a, s) => a + Number(s.quantity || 0), 0),
  outOfStock: stocks.value.filter(s => s.quantity <= 0).length,
  lowStock: stocks.value.filter(s => s.quantity > 0 && s.quantity <= (s.reorder_level || 5)).length,
}))

async function fetchStocks() {
  loading.value = true
  try {
    const data = await invApi.listStocks({ limit: 500 }) as any[]
    stocks.value = Array.isArray(data) ? data : []
  } catch (err: any) {
    addToast({ type: 'error', title: 'Error loading inventory report', message: err?.data?.detail || err.message })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!filteredRows.value.length) return
  const headers = columns.map(c => c.label)
  const lines = filteredRows.value.map(r => columns.map(c => r[c.key] ?? '').join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(fetchStocks)
</script>

