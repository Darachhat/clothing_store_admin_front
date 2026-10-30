<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profit &amp; Loss</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Revenue, COGS, gross profit, and net income</p>
      </div>
      <AppButton variant="default" label="Export CSV" @click="exportCsv" />
    </div>

    <!-- Date Picker -->
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
        <AppButton variant="primary" label="Run Report" :loading="loading" @click="fetchReport" />
      </div>
    </AppCard>

    <!-- P&L KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Gross Revenue</p>
        <p class="text-2xl font-bold text-emerald-600">${{ fmt(report.revenue) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total Expenses</p>
        <p class="text-2xl font-bold text-red-600">${{ fmt(report.expenses) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Gross Profit</p>
        <p class="text-2xl font-bold" :class="Number(report.gross_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'">
          ${{ fmt(report.gross_profit) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Total Discounts</p>
        <p class="text-2xl font-bold text-amber-500">${{ fmt(report.discounts) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Returns / Refunds</p>
        <p class="text-2xl font-bold text-orange-500">${{ fmt(report.refunds) }}</p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Net Profit</p>
        <p class="text-3xl font-extrabold" :class="Number(report.net_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'">
          ${{ fmt(report.net_profit) }}
        </p>
        <p class="text-xs text-gray-500 mt-1">Margin: {{ report.margin }}%</p>
      </AppCard>
    </div>

    <!-- Breakdown table by period -->
    <AppCard v-if="rows.length > 0">
      <template #header>
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">Period Breakdown</p>
      </template>
      <AppTable
        :columns="tableColumns"
        :rows="rows"
        :empty-state="{ icon: 'i-heroicons-currency-dollar', label: 'No data' }"
      >
        <template #cell-revenue="{ row }">
          <span class="text-emerald-600 font-semibold">${{ fmt(row.revenue) }}</span>
        </template>
        <template #cell-expenses="{ row }">
          <span class="text-red-500">${{ fmt(row.expenses) }}</span>
        </template>
        <template #cell-net_profit="{ row }">
          <span :class="Number(row.net_profit) >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'">
            ${{ fmt(row.net_profit) }}
          </span>
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
const fromDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const toDate = ref(new Date().toISOString().slice(0, 10))

const report = ref({
  revenue: '0',
  expenses: '0',
  gross_profit: '0',
  discounts: '0',
  refunds: '0',
  net_profit: '0',
  margin: '0',
})
const rows = ref<any[]>([])

const tableColumns = [
  { key: 'period', label: 'Period' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'expenses', label: 'Expenses' },
  { key: 'net_profit', label: 'Net Profit' },
]

function fmt(val: any) {
  return Number(val || 0).toFixed(2)
}

async function fetchReport() {
  loading.value = true
  try {
    const data = await reportApi.getProfitReport({
      from_date: fromDate.value,
      to_date: toDate.value,
    }) as any
    // Handle both flat response and nested
    report.value = {
      revenue: data.revenue || data.total_revenue || 0,
      expenses: data.expenses || data.total_expenses || 0,
      gross_profit: data.gross_profit || 0,
      discounts: data.discounts || data.total_discounts || 0,
      refunds: data.refunds || data.total_refunds || 0,
      net_profit: data.net_profit || 0,
      margin: data.margin || data.profit_margin || '0',
    }
    rows.value = data.rows || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

function exportCsv() {
  const lines = [
    ['Metric', 'Value'],
    ['From', fromDate.value],
    ['To', toDate.value],
    ['Gross Revenue', `$${fmt(report.value.revenue)}`],
    ['Total Expenses', `$${fmt(report.value.expenses)}`],
    ['Discounts', `$${fmt(report.value.discounts)}`],
    ['Refunds', `$${fmt(report.value.refunds)}`],
    ['Gross Profit', `$${fmt(report.value.gross_profit)}`],
    ['Net Profit', `$${fmt(report.value.net_profit)}`],
    ['Profit Margin', `${report.value.margin}%`],
  ]
  const csv = lines.map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `profit-loss-${fromDate.value}-to-${toDate.value}.csv`
  link.click()
}

onMounted(fetchReport)
</script>
