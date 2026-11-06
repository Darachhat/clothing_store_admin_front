<template>
  <div class="page-root">
    <AppPageHeader
      title="Purchases Report"
      description="Procurement spend, purchase orders, and items received by period."
      :breadcrumbs="[{ label: 'Reports', to: '/reports' }, { label: 'Purchases Report' }]"
      back-to="/reports"
    >
      <template #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-down-tray" :disabled="!rows.length" @click="exportCsv">
          Export CSV
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Filters -->
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

    <!-- KPIs -->
    <div class="kpi-grid">
      <AppStatCard
        label="Total Cost"
        :value="`$${summary.totalCost}`"
        sublabel="Procurement spend"
        icon="i-heroicons-banknotes"
        tone="primary"
        :loading="loading"
      />
      <AppStatCard
        label="Purchase Orders"
        :value="summary.orders"
        sublabel="Orders in period"
        icon="i-heroicons-clipboard-document-check"
        tone="info"
        :loading="loading"
      />
      <AppStatCard
        label="Items Purchased"
        :value="summary.items"
        sublabel="Total units received"
        icon="i-heroicons-cube"
        tone="success"
        :loading="loading"
      />
      <AppStatCard
        label="Avg. Order Cost"
        :value="`$${summary.avgCost}`"
        sublabel="Spend per purchase order"
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
        empty-text="No purchase records found for the selected period."
        empty-icon="i-heroicons-truck"
      >
        <template #cell-total_cost="{ value }">
          <span class="cost-value">${{ Number(value || 0).toFixed(2) }}</span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Purchases Report — Clothing Store' })

const { getPurchasesReport } = useReportApi()
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
  if (!rows.value.length) return { totalCost: '0.00', orders: 0, items: 0, avgCost: '0.00' }
  const cost = rows.value.reduce((a, r) => a + Number(r.total_cost ?? 0), 0)
  const orders = rows.value.reduce((a, r) => a + Number(r.order_count ?? 0), 0)
  const items = rows.value.reduce((a, r) => a + Number(r.items_received ?? 0), 0)
  return {
    totalCost: cost.toFixed(2),
    orders,
    items,
    avgCost: orders > 0 ? (cost / orders).toFixed(2) : '0.00',
  }
})

const columns = [
  { key: 'period', label: 'Period', sortable: true },
  { key: 'order_count', label: 'Orders', sortable: true },
  { key: 'items_received', label: 'Items Received', sortable: true },
  { key: 'total_cost', label: 'Total Cost', sortable: true },
]

async function fetchReport() {
  loading.value = true
  try {
    const data = await getPurchasesReport({ from_date: fromDate.value, to_date: toDate.value, group_by: groupBy.value }) as any
    rows.value = Array.isArray(data) ? data : (data?.rows ?? [])
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
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
  link.download = `purchases-report-${fromDate.value}-to-${toDate.value}.csv`
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

.cost-value {
  font-weight: 600;
  color: var(--color-primary, #6366f1);
  font-variant-numeric: tabular-nums;
}
</style>
