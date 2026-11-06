<template>
  <div class="page-root">
    <AppPageHeader
      title="Sales Report"
      description="Detailed sales revenue, transactions, and discount breakdown by period."
      :breadcrumbs="[{ label: 'Reports', to: '/reports' }, { label: 'Sales Report' }]"
      back-to="/reports"
    >
      <template #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-down-tray" :disabled="!rows.length" @click="exportCsv">
          Export CSV
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Date Range Filter -->
    <AppCard>
      <div class="report-filter-row">
        <div class="form-field">
          <label class="field-label">From Date</label>
          <input v-model="fromDate" type="date" class="field-input" />
        </div>
        <div class="form-field">
          <label class="field-label">To Date</label>
          <input v-model="toDate" type="date" class="field-input" />
        </div>
        <div class="form-field" style="min-width: 150px;">
          <label class="field-label">Group By</label>
          <AppSelect v-model="groupBy" :options="groupByOptions" />
        </div>
        <AppButton variant="primary" icon="i-heroicons-play" :loading="loading" @click="fetchReport">
          Run Report
        </AppButton>
      </div>
    </AppCard>

    <!-- Summary KPIs -->
    <div class="kpi-grid">
      <AppStatCard
        label="Total Revenue"
        :value="`$${summary.revenue}`"
        sublabel="Gross period revenue"
        icon="i-heroicons-banknotes"
        tone="success"
        :loading="loading"
      />
      <AppStatCard
        label="Total Transactions"
        :value="summary.transactions"
        sublabel="Completed orders"
        icon="i-heroicons-receipt-percent"
        tone="primary"
        :loading="loading"
      />
      <AppStatCard
        label="Items Sold"
        :value="summary.itemsSold"
        sublabel="Total units sold"
        icon="i-heroicons-shopping-bag"
        tone="info"
        :loading="loading"
      />
      <AppStatCard
        label="Avg. Order Value"
        :value="`$${summary.avgOrder}`"
        sublabel="Revenue per transaction"
        icon="i-heroicons-calculator"
        tone="neutral"
        :loading="loading"
      />
    </div>

    <!-- Data Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="rows"
        :loading="loading"
        empty-text="No sales records found for the selected period."
        empty-icon="i-heroicons-chart-pie"
      >
        <template #cell-revenue="{ row }">
          <span class="val-positive">${{ Number(row.revenue || 0).toFixed(2) }}</span>
        </template>
        <template #cell-discount_total="{ row }">
          <span class="val-negative">-${{ Number(row.discount_total || 0).toFixed(2) }}</span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Sales Report — Clothing Store' })

const reportApi = useReportApi()
const { addToast } = useAppToast()

const loading = ref(false)
const rows = ref<any[]>([])
const fromDate = ref(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
const toDate = ref(new Date().toISOString().slice(0, 10))
const groupBy = ref('day')

const groupByOptions = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
]

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
  { key: 'period', label: 'Period', sortable: true },
  { key: 'transaction_count', label: 'Transactions', sortable: true },
  { key: 'items_sold', label: 'Items Sold', sortable: true },
  { key: 'revenue', label: 'Revenue', sortable: true },
  { key: 'discount_total', label: 'Discounts', sortable: true },
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
    addToast({ type: 'error', title: 'Report Error', message: err?.data?.detail || err.message })
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

<style scoped>
.report-filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.val-positive {
  font-weight: 600;
  color: var(--status-success-text);
  font-variant-numeric: tabular-nums;
}

.val-negative {
  font-weight: 500;
  color: var(--status-danger-text);
  font-variant-numeric: tabular-nums;
}
</style>
