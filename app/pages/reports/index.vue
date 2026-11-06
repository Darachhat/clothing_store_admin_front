<template>
  <div class="page-root">
    <AppPageHeader
      title="Business Analytics & Reports"
      description="Monitor revenue, gross profit, payment method breakdowns, top products, and detailed financial reports."
      :breadcrumbs="[{ label: 'Finance' }, { label: 'Reports' }]"
    >
      <template #secondary>
        <div class="period-tabs">
          <button
            v-for="p in periods"
            :key="p.value"
            type="button"
            class="period-tab"
            :class="{ 'is-active': period === p.value }"
            @click="selectPeriod(p.value)"
          >
            {{ p.label }}
          </button>
        </div>
      </template>
      <template #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-arrow-path" :loading="loading" @click="fetchDashboard">
          Refresh
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Report Sub-Navigation Cards -->
    <div class="report-nav-grid">
      <NuxtLink to="/reports/sales" class="report-nav-card">
        <div class="report-nav-icon report-nav-icon--primary">
          <UIcon name="i-heroicons-chart-bar-square" style="width:18px;height:18px;" />
        </div>
        <div class="report-nav-body">
          <span class="report-nav-title">Sales Report</span>
          <span class="report-nav-desc">Daily, weekly, and monthly revenue & transactions</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="report-nav-arrow" />
      </NuxtLink>

      <NuxtLink to="/reports/inventory" class="report-nav-card">
        <div class="report-nav-icon report-nav-icon--info">
          <UIcon name="i-heroicons-archive-box" style="width:18px;height:18px;" />
        </div>
        <div class="report-nav-body">
          <span class="report-nav-title">Inventory Report</span>
          <span class="report-nav-desc">Stock valuation, SKU coverage, and reorder alerts</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="report-nav-arrow" />
      </NuxtLink>

      <NuxtLink to="/reports/purchases" class="report-nav-card">
        <div class="report-nav-icon report-nav-icon--warning">
          <UIcon name="i-heroicons-ClipboardDocumentCheck" style="width:18px;height:18px;display:none;" />
          <UIcon name="i-heroicons-truck" style="width:18px;height:18px;" />
        </div>
        <div class="report-nav-body">
          <span class="report-nav-title">Purchases Report</span>
          <span class="report-nav-desc">Procurement spend and items received by period</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="report-nav-arrow" />
      </NuxtLink>

      <NuxtLink to="/reports/profit" class="report-nav-card">
        <div class="report-nav-icon report-nav-icon--success">
          <UIcon name="i-heroicons-PresentationChartLine" style="width:18px;height:18px;display:none;" />
          <UIcon name="i-heroicons-banknotes" style="width:18px;height:18px;" />
        </div>
        <div class="report-nav-body">
          <span class="report-nav-title">Profit &amp; Loss</span>
          <span class="report-nav-desc">Gross revenue, expenses, discounts, and net margin</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="report-nav-arrow" />
      </NuxtLink>
    </div>

    <!-- Top KPI Cards -->
    <div class="kpi-grid">
      <AppStatCard
        label="Revenue"
        :value="`$${Number(stats?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
        sublabel="Total revenue collected"
        icon="i-heroicons-banknotes"
        tone="primary"
        :loading="loading"
      />
      <AppStatCard
        label="Gross Profit"
        :value="`$${Number(stats?.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`"
        :sublabel="`Margin: ${Number(stats?.profit_margin || 0).toFixed(1)}%`"
        icon="i-heroicons-arrow-trending-up"
        tone="success"
        :loading="loading"
      />
      <AppStatCard
        label="Orders / Transactions"
        :value="stats?.order_count || 0"
        :sublabel="`Avg Ticket: $${Number(stats?.average_order_value || 0).toFixed(2)}`"
        icon="i-heroicons-shopping-bag"
        tone="info"
        :loading="loading"
      />
      <AppStatCard
        label="Low Stock Variants"
        :value="stats?.low_stock_count || 0"
        sublabel="SKUs at or below reorder threshold"
        icon="i-heroicons-exclamation-triangle"
        :tone="(stats?.low_stock_count || 0) > 0 ? 'warning' : 'neutral'"
        :loading="loading"
      />
    </div>

    <!-- Payment Methods & Top Products -->
    <div class="analytics-grid">
      <!-- Payment Methods Distribution -->
      <AppCard title="Payment Method Breakdown">
        <div v-if="stats?.payment_breakdown?.length" class="breakdown-list">
          <div
            v-for="pm in stats.payment_breakdown"
            :key="pm.method"
            class="breakdown-row"
          >
            <div class="breakdown-left">
              <span class="breakdown-dot"></span>
              <span class="breakdown-label">{{ pm.method }}</span>
            </div>
            <div class="breakdown-right">
              <span class="breakdown-amount">${{ Number(pm.total).toFixed(2) }}</span>
              <span class="breakdown-meta">({{ pm.count }} txns)</span>
            </div>
          </div>
        </div>
        <AppEmptyState
          v-else
          icon="i-heroicons-credit-card"
          title="No payment transactions"
          description="No payment records found for the selected time period."
        />
      </AppCard>

      <!-- Top Selling Products -->
      <AppCard title="Top Selling Products">
        <div v-if="stats?.top_products?.length" class="top-prod-list">
          <div
            v-for="(prod, idx) in stats.top_products"
            :key="prod.variant_id || idx"
            class="top-prod-row"
          >
            <div class="top-prod-left">
              <span class="top-prod-rank">#{{ Number(idx) + 1 }}</span>
              <div>
                <p class="top-prod-name">{{ prod.name }}</p>
                <p class="top-prod-meta">{{ prod.sku }} · {{ prod.color || '—' }} / {{ prod.size || '—' }}</p>
              </div>
            </div>
            <div class="top-prod-right">
              <p class="top-prod-rev">${{ Number(prod.revenue).toFixed(2) }}</p>
              <p class="top-prod-qty">{{ prod.quantity }} sold</p>
            </div>
          </div>
        </div>
        <AppEmptyState
          v-else
          icon="i-heroicons-Fire"
          title="No product sales recorded"
          description="Top selling SKUs will appear here once transactions occur in this period."
        />
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

useHead({ title: 'Reports — Clothing Store' })

const { getDashboard } = useReportApi()
const { addToast } = useAppToast()

const period = ref('today')
const loading = ref(false)
const stats = ref<any>(null)

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: '7 Days', value: '7days' },
  { label: '30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
]

function selectPeriod(val: string) {
  period.value = val
  fetchDashboard()
}

async function fetchDashboard() {
  loading.value = true
  try {
    const res: any = await getDashboard(period.value)
    stats.value = res || {}
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to load report data',
      message: err?.data?.detail || err.message,
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.period-tabs {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.period-tab {
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.period-tab:hover {
  color: var(--text-primary);
}

.period-tab.is-active {
  background: var(--surface-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: var(--shadow-xs);
}

.report-nav-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1024px) {
  .report-nav-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .report-nav-grid {
    grid-template-columns: 1fr;
  }
}

.report-nav-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  text-decoration: none;
  transition: background 0.15s ease, transform 0.15s ease;
}

.report-nav-card:hover {
  background: var(--surface-hover);
}

.report-nav-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.report-nav-icon--primary {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.report-nav-icon--info {
  background: var(--status-info-bg);
  color: var(--status-info-text);
}

.report-nav-icon--warning {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.report-nav-icon--success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.report-nav-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.report-nav-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.report-nav-desc {
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-nav-arrow {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--surface-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.breakdown-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.breakdown-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

.breakdown-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.breakdown-right {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.breakdown-amount {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.breakdown-meta {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.top-prod-list {
  display: flex;
  flex-direction: column;
}

.top-prod-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.top-prod-row:last-child {
  border-bottom: none;
}

.top-prod-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-prod-rank {
  width: 24px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.top-prod-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.top-prod-meta {
  font-size: 11.5px;
  color: var(--text-tertiary);
}

.top-prod-right {
  text-align: right;
}

.top-prod-rev {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.top-prod-qty {
  font-size: 11.5px;
  color: var(--text-tertiary);
}
</style>
