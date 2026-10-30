<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Report</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Detailed sales breakdown by period</p>
      </div>
      <AppButton variant="default" label="Export CSV" @click="exportCsv" />
    </div>

    <!-- Date Range Filter -->
    <AppCard>
      <div class="flex gap-3 flex-wrap items-end">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
          <input v-model="fromDate" type="date" class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
          <input v-model="toDate" type="date" class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
          <select v-model="groupBy" class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        <AppButton variant="primary" label="Run Report" :loading="loading" @click="fetchReport" />
      </div>
    </AppCard>

    <!-- Summary KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total Revenue</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">${{ summary.revenue }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total Transactions</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.transactions }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Items Sold</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ summary.itemsSold }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Avg. Order Value</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">${{ summary.avgOrder }}</p>
      </AppCard>
    </div>

    <!-- Data Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-chart-pie', label: 'Run a report to see data' }"
      >
        <template #cell-revenue="{ row }">
          <span class="font-semibold text-emerald-600 dark:text-emerald-400">${{ Number(row.revenue).toFixed(2) }}</span>
        </template>
        <template #cell-discount_total="{ row }">
          <span class="text-red-500">-${{ Number(row.discount_total || 0).toFixed(2) }}</span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const reportApi = useReportApi()
const toast = useAppToast()

const loading = ref(false)
const rows = ref<any[]>([])
const fromDate = ref(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
const toDate = ref(new Date().toISOString().slice(0, 10))
const groupBy = ref('day')

const summary = computed(() => {
  if (!rows.value.length) return { revenue: '0.00', transactions: 0, itemsSold: 0, avgOrder: '0.00' }
  const total = rows.value.reduce((a, r) => a + Number(r.revenue || 0), 0)
  const txns = rows.value.reduce((a, r) => a + Number(r.transaction_count || 0), 0)
  const items = rows.value.reduce((a, r) => a + Number(r.items_sold || 0), 0)
  return {
    revenue: total.toFixed(2),
    transactions: txns,
    itemsSold: items,
    avgOrder: txns > 0 ? (total / txns).toFixed(2) : '0.00',
  }
})

const columns = [
  { key: 'period', label: 'Period' },
  { key: 'transaction_count', label: 'Transactions' },
  { key: 'items_sold', label: 'Items Sold' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'discount_total', label: 'Discounts' },
]

async function fetchReport() {
  loading.value = true
  try {
    const data = await reportApi.getSalesReport({
      from_date: fromDate.value,
      to_date: toDate.value,
      group_by: groupBy.value,
    }) as any
    rows.value = Array.isArray(data) ? data : (data?.rows || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  if (!rows.value.length) return
  const headers = columns.map(c => c.label)
  const lines = rows.value.map(r => columns.map(c => r[c.key] ?? '').join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `sales-report-${fromDate.value}-to-${toDate.value}.csv`
  link.click()
}

onMounted(fetchReport)
</script>
