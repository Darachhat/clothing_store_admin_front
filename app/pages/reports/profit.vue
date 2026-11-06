<template>
  <div class="page-root">
    <AppPageHeader
      title="Profit &amp; Loss"
      description="Gross revenue, operating expenses, discounts, refunds, and net profit margin."
      :breadcrumbs="[{ label: 'Reports', to: '/reports' }, { label: 'Profit & Loss' }]"
      back-to="/reports"
    >
      <template #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-down-tray" @click="exportCsv">
          Export CSV
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Date Picker -->
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
        <AppButton variant="primary" icon="i-heroicons-play" :loading="loading" @click="fetchReport">
          Run Report
        </AppButton>
      </div>
    </AppCard>

    <!-- P&L KPIs -->
    <div class="pnl-kpi-grid">
      <AppStatCard
        label="Gross Revenue"
        :value="`$${fmt(report.revenue)}`"
        sublabel="Total sales revenue"
        icon="i-heroicons-banknotes"
        tone="success"
        :loading="loading"
      />
      <AppStatCard
        label="Total Expenses"
        :value="`$${fmt(report.expenses)}`"
        sublabel="Approved operating expenses"
        icon="i-heroicons-receipt-refund"
        tone="danger"
        :loading="loading"
      />
      <AppStatCard
        label="Gross Profit"
        :value="`$${fmt(report.gross_profit)}`"
        sublabel="Revenue minus COGS"
        icon="i-heroicons-chart-bar"
        :tone="Number(report.gross_profit) >= 0 ? 'success' : 'danger'"
        :loading="loading"
      />
      <AppStatCard
        label="Total Discounts"
        :value="`$${fmt(report.discounts)}`"
        sublabel="Promotional & manual discounts"
        icon="i-heroicons-tag"
        tone="warning"
        :loading="loading"
      />
      <AppStatCard
        label="Returns / Refunds"
        :value="`$${fmt(report.refunds)}`"
        sublabel="Refunded sales value"
        icon="i-heroicons-arrow-uturn-left"
        tone="warning"
        :loading="loading"
      />
      <AppStatCard
        label="Net Profit"
        :value="`$${fmt(report.net_profit)}`"
        :sublabel="`Net Margin: ${report.margin}%`"
        icon="i-heroicons-scale"
        :tone="Number(report.net_profit) >= 0 ? 'primary' : 'danger'"
        :loading="loading"
      />
    </div>

    <!-- Breakdown table by period -->
    <AppCard v-if="rows.length > 0" title="Period Breakdown" :no-pad="true">
      <AppTable
        :columns="tableColumns"
        :rows="rows"
        :loading="loading"
        empty-text="No period breakdown rows."
      >
        <template #cell-revenue="{ row }">
          <span class="val-positive">${{ fmt(row.revenue) }}</span>
        </template>
        <template #cell-expenses="{ row }">
          <span class="val-negative">${{ fmt(row.expenses) }}</span>
        </template>
        <template #cell-net_profit="{ row }">
          <span :class="Number(row.net_profit) >= 0 ? 'val-positive' : 'val-negative'">
            ${{ fmt(row.net_profit) }}
          </span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Profit & Loss — Clothing Store' })

const reportApi = useReportApi()
const { addToast } = useAppToast()

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
  { key: 'period', label: 'Period', sortable: true },
  { key: 'revenue', label: 'Revenue', sortable: true },
  { key: 'expenses', label: 'Expenses', sortable: true },
  { key: 'net_profit', label: 'Net Profit', sortable: true },
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
    addToast({ type: 'error', title: 'Error', message: err?.data?.detail || err.message })
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

<style scoped>
.report-filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.pnl-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1024px) {
  .pnl-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .pnl-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.val-positive {
  font-weight: 600;
  color: var(--status-success-text);
  font-variant-numeric: tabular-nums;
}

.val-negative {
  font-weight: 600;
  color: var(--status-danger-text);
  font-variant-numeric: tabular-nums;
}
</style>
