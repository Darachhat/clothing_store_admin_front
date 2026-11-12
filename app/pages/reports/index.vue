<template>
  <div class="page-root">
    <AppPageHeader
      title="Business Analytics & Reports"
      description="Monitor revenue, gross profit, payment method breakdowns, top products, and detailed financial reports."
      :breadcrumbs="[{ label: 'Finance' }, { label: 'Reports' }]"
    >
      <template #secondary>
        <div class="inline-flex items-center gap-0.5 p-0.5 bg-surface-inset border border-border-subtle rounded-md">
          <button
            v-for="p in periods"
            :key="p.value"
            type="button"
            class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
            :class="period === p.value ? 'bg-surface-card text-ink font-semibold shadow-xs' : 'text-ink-secondary bg-transparent hover:text-ink'"
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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <NuxtLink to="/reports/sales" class="flex items-center gap-3 p-3.5 bg-surface-card border border-border-subtle rounded-lg no-underline hover:bg-surface-hover transition-colors">
        <div class="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-status-blue-bg text-white">
          <UIcon name="i-heroicons-chart-bar-square" class="w-4.5 h-4.5" />
        </div>
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <span class="text-sm font-medium text-ink">Sales Report</span>
          <span class="text-xs text-ink-tertiary truncate">Daily, weekly, and monthly revenue & transactions</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
      </NuxtLink>

      <NuxtLink to="/reports/inventory" class="flex items-center gap-3 p-3.5 bg-surface-card border border-border-subtle rounded-lg no-underline hover:bg-surface-hover transition-colors">
        <div class="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-navy text-white">
          <UIcon name="i-heroicons-archive-box" class="w-4.5 h-4.5" />
        </div>
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <span class="text-sm font-medium text-ink">Inventory Report</span>
          <span class="text-xs text-ink-tertiary truncate">Stock valuation, SKU coverage, and reorder alerts</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
      </NuxtLink>

      <NuxtLink to="/reports/purchases" class="flex items-center gap-3 p-3.5 bg-surface-card border border-border-subtle rounded-lg no-underline hover:bg-surface-hover transition-colors">
        <div class="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-status-amber-bg text-white">
          <UIcon name="i-heroicons-truck" class="w-4.5 h-4.5" />
        </div>
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <span class="text-sm font-medium text-ink">Purchases Report</span>
          <span class="text-xs text-ink-tertiary truncate">Procurement spend and items received by period</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
      </NuxtLink>

      <NuxtLink to="/reports/profit" class="flex items-center gap-3 p-3.5 bg-surface-card border border-border-subtle rounded-lg no-underline hover:bg-surface-hover transition-colors">
        <div class="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-status-green-bg text-white">
          <UIcon name="i-heroicons-banknotes" class="w-4.5 h-4.5" />
        </div>
        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
          <span class="text-sm font-medium text-ink">Profit &amp; Loss</span>
          <span class="text-xs text-ink-tertiary truncate">Gross revenue, expenses, discounts, and net margin</span>
        </div>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
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
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Payment Methods Distribution -->
      <AppCard title="Payment Method Breakdown">
        <div v-if="stats?.payment_breakdown?.length" class="flex flex-col gap-2">
          <div
            v-for="pm in stats.payment_breakdown"
            :key="pm.method"
            class="flex items-center justify-between p-2.5 bg-surface-inset border border-border-subtle rounded-md"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-brand-900"></span>
              <span class="text-[13px] font-medium text-ink">{{ pm.method }}</span>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-[13.5px] font-semibold text-ink tabular-nums">${{ Number(pm.total).toFixed(2) }}</span>
              <span class="text-[11.5px] text-ink-tertiary">({{ pm.count }} txns)</span>
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
        <div v-if="stats?.top_products?.length" class="flex flex-col divide-y divide-border-subtle">
          <div
            v-for="(prod, idx) in stats.top_products"
            :key="prod.variant_id || idx"
            class="flex items-center justify-between py-2.5"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-6 text-xs font-medium text-ink-tertiary tabular-nums">#{{ Number(idx) + 1 }}</span>
              <div>
                <p class="text-[13px] font-medium text-ink">{{ prod.name }}</p>
                <p class="text-[11.5px] text-ink-tertiary">{{ prod.sku }} · {{ prod.color || '—' }} / {{ prod.size || '—' }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[13px] font-semibold text-ink tabular-nums">${{ Number(prod.revenue).toFixed(2) }}</p>
              <p class="text-[11.5px] text-ink-tertiary">{{ prod.quantity }} sold</p>
            </div>
          </div>
        </div>
        <AppEmptyState
          v-else
          icon="i-heroicons-fire"
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

