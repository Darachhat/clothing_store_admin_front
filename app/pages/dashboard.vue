<template>
  <div style="display:flex; flex-direction:column; gap:24px;">
    <!-- Header row -->
    <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
      <div>
        <h2 style="font-size:18px; font-weight:600; color:var(--text-primary); letter-spacing:-0.01em;">Business Overview</h2>
        <p style="font-size:12px; color:var(--text-tertiary); margin-top:2px;">Revenue, profit, and stock health at a glance.</p>
      </div>
      <AppSelect
        v-model="period"
        :options="periodOptions"
        style="width:140px;"
        @change="loadDashboard"
      />
    </div>

    <!-- KPI Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px;">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px; display:flex; flex-direction:column; gap:12px;"
      >
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em;">{{ kpi.label }}</span>
          <div style="width:28px; height:28px; border:1px solid var(--border-subtle); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; color:var(--text-secondary);">
            <UIcon name="i-heroicons-information-circle" class="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div style="font-size:22px; font-weight:700; color:var(--text-primary); letter-spacing:-0.02em; font-family:var(--font-mono);">{{ kpi.value }}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">{{ kpi.sublabel }}</div>
        </div>
      </div>
    </div>

    <!-- Lower row: Profit Summary + Low Stock + Quick Actions -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
      <!-- Profit Summary -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:16px;">Profit Summary</p>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:13px;">
            <span style="color:var(--text-secondary);">Revenue</span>
            <span style="font-weight:600; color:var(--text-primary); font-family:var(--font-mono);">${{ fmt(dashboard?.revenue ?? 0) }}</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:13px;">
            <span style="color:var(--text-secondary);">Gross Profit</span>
            <span style="font-weight:600; color:var(--status-green); font-family:var(--font-mono);">${{ fmt(dashboard?.gross_profit ?? 0) }}</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:13px;">
            <span style="color:var(--text-secondary);">Expenses</span>
            <span style="font-weight:600; color:var(--status-red); font-family:var(--font-mono);">-${{ fmt(dashboard?.expenses ?? 0) }}</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; font-size:14px; font-weight:700; padding-top:10px; border-top:1px solid var(--border-subtle); margin-top:4px;">
            <span style="color:var(--text-primary);">Net Profit</span>
            <span :style="`font-family:var(--font-mono); color:${(dashboard?.net_profit ?? 0) >= 0 ? 'var(--status-green)' : 'var(--status-red)'};`">
              ${{ fmt(dashboard?.net_profit ?? 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Low Stock -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em;">Low Stock Alert</p>
          <span
            :style="`font-size:11px; font-weight:600; padding:2px 8px; border-radius:4px; ${
              (dashboard?.low_stock_count ?? 0) > 0
                ? 'background:var(--status-amber-bg); color:var(--status-amber);'
                : 'background:var(--status-green-bg); color:var(--status-green);'
            }`"
          >
            {{ (dashboard?.low_stock_count ?? 0) > 0 ? `${dashboard?.low_stock_count} items` : 'All good' }}
          </span>
        </div>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">
          {{ dashboard?.low_stock_count ?? 0 }} variant{{ (dashboard?.low_stock_count ?? 0) !== 1 ? 's are' : ' is' }} at or below reorder level.
        </p>
        <NuxtLink
          v-if="(dashboard?.low_stock_count ?? 0) > 0"
          to="/inventory"
          style="display:inline-flex; align-items:center; gap:6px; margin-top:12px; font-size:12px; font-weight:600; color:var(--status-amber); text-decoration:none;"
        >
          View low stock items
          <UIcon name="i-heroicons-arrow-right" class="w-3 h-3" />
        </NuxtLink>
      </div>

      <!-- Quick Actions -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:16px;">Quick Actions</p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <AppButton
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            variant="default"
            size="sm"
            :external="action.newTab"
            style="justify-content:flex-start; width:100%;"
          >
            {{ action.label }}
          </AppButton>
        </div>
      </div>
    </div>

    <!-- Bottom row: Sales Trend Chart + Top Selling Products -->
    <div style="display:grid; grid-template-columns:1.4fr 1fr; gap:16px;">
      <!-- Sales Trend Chart -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
          <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em;">Sales Revenue Trend</p>
          <span style="font-size:11px; color:var(--text-tertiary); font-family:var(--font-mono);">{{ (dashboard as any)?.sales_chart?.length || 0 }} data points</span>
        </div>
        <div v-if="(dashboard as any)?.sales_chart?.length" style="display:flex; align-items:flex-end; gap:8px; height:140px; padding-top:12px;">
          <div
            v-for="pt in (dashboard as any).sales_chart"
            :key="pt.label"
            style="flex:1; min-width:24px; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end;"
          >
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-secondary);">${{ Number(pt.revenue).toFixed(0) }}</span>
            <div
              :style="`width:100%; max-width:36px; border-radius:4px 4px 0 0; background:var(--text-primary); height:${Math.max(8, Math.round((Number(pt.revenue) / maxChartRevenue) * 90))}px;`"
            />
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:56px;">{{ pt.label.slice(-5) }}</span>
          </div>
        </div>
        <div v-else style="height:140px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:12px;">
          No completed sales in selected period.
        </div>
      </div>

      <!-- Top Selling Products -->
      <div style="background:var(--surface-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <p style="font-size:12px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:16px;">Top-Selling Products</p>
        <div v-if="(dashboard as any)?.top_products?.length" style="display:flex; flex-direction:column; gap:10px;">
          <div
            v-for="prod in (dashboard as any).top_products"
            :key="prod.sku"
            style="display:flex; align-items:center; justify-content:space-between; font-size:12px; padding-bottom:8px; border-bottom:1px solid var(--border-subtle);"
          >
            <div>
              <div style="font-weight:600; color:var(--text-primary);">{{ prod.product_name }}</div>
              <div style="font-size:11px; color:var(--text-tertiary); font-family:var(--font-mono);">{{ prod.sku }} · {{ prod.quantity_sold }} sold</div>
            </div>
            <div style="font-weight:600; font-family:var(--font-mono); color:var(--text-primary);">
              ${{ fmt(prod.revenue) }}
            </div>
          </div>
        </div>
        <div v-else style="height:120px; display:flex; align-items:center; justify-content:center; color:var(--text-tertiary); font-size:12px;">
          No product sales recorded in this period.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DashboardData } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Dashboard — Clothing Store' })

const { getDashboard } = useReportApi()

const period = ref('today')
const dashboard = ref<DashboardData | null>(null)

const periodOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: '7days' },
  { label: 'Last 30 Days', value: '30days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Year', value: 'this_year' },
]

const maxChartRevenue = computed(() => {
  const pts = (dashboard.value as any)?.sales_chart || []
  const m = Math.max(...pts.map((p: any) => Number(p.revenue) || 0), 1)
  return m
})

const kpiCards = computed(() => [
  {
    label: 'Total Sales',
    value: dashboard.value?.sales_count ?? 0,
    sublabel: 'transactions',
    icon: 'i-heroicons-receipt-percent',
  },
  {
    label: 'Revenue',
    value: `$${fmt(dashboard.value?.revenue ?? 0)}`,
    sublabel: 'gross revenue',
    icon: 'i-heroicons-banknotes',
  },
  {
    label: 'Net Profit',
    value: `$${fmt(dashboard.value?.net_profit ?? 0)}`,
    sublabel: 'after expenses',
    icon: 'i-heroicons-chart-bar-square',
  },
  {
    label: 'Low Stock',
    value: dashboard.value?.low_stock_count ?? 0,
    sublabel: 'variants below threshold',
    icon: 'i-heroicons-exclamation-triangle',
  },
])

const quickActions = [
  { label: 'Sales & Invoices', to: '/sales', icon: 'i-heroicons-receipt-percent', newTab: false },
  { label: 'Add Product', to: '/products/new', icon: 'i-heroicons-plus', newTab: false },
  { label: 'New Purchase Order', to: '/purchases', icon: 'i-heroicons-document-text', newTab: false },
  { label: 'Generate Labels', to: '/labels/generate', icon: 'i-heroicons-qr-code', newTab: false },
]

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

async function loadDashboard() {
  try {
    dashboard.value = await getDashboard(period.value) as DashboardData
  } catch (err) {
    console.error(err)
  }
}

onMounted(loadDashboard)
</script>
