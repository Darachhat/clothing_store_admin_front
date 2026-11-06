<template>
  <div class="page-root">
    <AppPageHeader
      title="Sales Orders"
      description="View, filter, and print invoices or receipts for POS and store sales transactions."
      :breadcrumbs="[
        { label: 'Store', to: '/sales' },
        { label: 'Sales Orders' },
      ]"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-uturn-left" label="Sales Returns" to="/sales/returns" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-down-tray" label="Export CSV" @click="exportCsv" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchSales" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search by invoice #, customer name, cashier, or branch..."
      :chips="activeChips"
      :shown-count="paginatedSales.length"
      :total-count="filteredSales.length"
      count-label="sales"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Refunded', value: 'REFUNDED' },
        ]"
        style="min-width: 145px;"
        @change="fetchSales"
      />
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">From:</span>
        <input v-model="fromDate" type="date" class="field-input" style="width: 140px;" @change="fetchSales" />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">To:</span>
        <input v-model="toDate" type="date" class="field-input" style="width: 140px;" @change="fetchSales" />
      </div>
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedSales"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-shopping-bag',
          label: 'No sales transactions found',
          description: 'Completed POS sales and invoices will appear here.',
        }"
        row-clickable
        @row-click="(row) => navigateTo(`/sales/${row.id}`)"
      >
        <template #cell-invoice_display="{ row }">
          <NuxtLink :to="`/sales/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
            {{ row.invoice_display }}
          </NuxtLink>
        </template>

        <template #cell-customer_display="{ row }">
          <span class="font-medium text-gray-800">{{ row.customer_display }}</span>
        </template>

        <template #cell-total_display="{ row }">
          <span class="mono font-bold">${{ Number(row.total_display).toFixed(2) }}</span>
        </template>

        <template #cell-payment_status="{ row }">
          <AppBadge
            :color="row.payment_status === 'PAID' ? 'green' : row.payment_status === 'REFUNDED' ? 'red' : 'yellow'"
            size="sm"
          >
            {{ row.payment_status || 'PAID' }}
          </AppBadge>
        </template>

        <template #cell-status_display="{ row }">
          <AppBadge :color="statusColor(row.status_display)" size="sm">
            {{ row.status_display }}
          </AppBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ new Date(row.created_at).toLocaleString() }}</span>
        </template>

        <template #cell-actions="{ row }">
          <AppButton size="xs" variant="ghost" icon="i-heroicons-eye" label="Invoice" :to="`/sales/${row.id}`" />
        </template>

        <template v-if="filteredSales.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredSales.length"
          />
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Sales Orders — Clothing Store Admin' })

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const sales = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const currentPage = ref(1)
const pageSize = 20

const columns = [
  { key: 'invoice_display', label: 'Invoice #', sortable: true },
  { key: 'customer_display', label: 'Customer', sortable: true },
  { key: 'total_display', label: 'Total', sortable: true },
  { key: 'payment_status', label: 'Payment', sortable: true },
  { key: 'status_display', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const enrichedSales = computed(() =>
  sales.value.map(s => ({
    ...s,
    invoice_display: s.invoice_number || s.sale_number || '—',
    customer_display: s.customer_name || 'Walk-in Customer',
    total_display: Number(s.total ?? s.total_amount ?? 0),
    status_display: s.sale_status || s.status || 'COMPLETED',
  })),
)

const filteredSales = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return enrichedSales.value
  return enrichedSales.value.filter(s =>
    [s.invoice_display, s.customer_display, s.cashier_name, s.branch_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSales.value.slice(start, start + pageSize)
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  if (fromDate.value) chips.push({ key: 'from', label: 'From', value: fromDate.value })
  if (toDate.value) chips.push({ key: 'to', label: 'To', value: toDate.value })
  return chips
})

function removeChip(key: string) {
  if (key === 'status') statusFilter.value = ''
  if (key === 'from') fromDate.value = ''
  if (key === 'to') toDate.value = ''
  currentPage.value = 1
  fetchSales()
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  fromDate.value = ''
  toDate.value = ''
  currentPage.value = 1
  fetchSales()
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    COMPLETED: 'green',
    PENDING: 'yellow',
    CANCELLED: 'red',
    REFUNDED: 'blue',
  }
  return map[status] || 'default'
}

async function fetchSales() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (statusFilter.value) params.status = statusFilter.value
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value
    const data = await saleApi.listSales(params) as any[]
    sales.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!filteredSales.value.length) return
  const headers = ['Invoice #', 'Customer', 'Total USD', 'Payment Status', 'Status', 'Date']
  const lines = filteredSales.value.map(r => [
    r.invoice_display,
    `"${(r.customer_display || '').replace(/"/g, '""')}"`,
    Number(r.total_display).toFixed(2),
    r.payment_status || 'PAID',
    r.status_display,
    new Date(r.created_at).toISOString(),
  ].join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `sales-orders-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(fetchSales)
</script>
