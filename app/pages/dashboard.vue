<template>
  <div class="page-root">
    <!-- Standardized Page Header -->
    <AppPageHeader
      title="Dashboard"
      description="Real-time store revenue, order velocity, inventory health, and recent transactions."
    >
      <template #secondary>
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-computer-desktop"
          label="POS Registers"
          to="/settings/terminals"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-chart-bar"
          label="Reports"
          to="/reports"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="loadDashboard"
        />
      </template>
      <template #actions>
        <AppButton
          size="sm"
          variant="primary"
          icon="i-heroicons-plus"
          label="New Product"
          to="/products/new"
        />
      </template>
    </AppPageHeader>

    <!-- Error State -->
    <AppErrorState
      v-if="loadError"
      title="Unable to load dashboard metrics"
      :message="loadError"
      @retry="loadDashboard"
    />

    <template v-else>
      <!-- KPI Row (Meaningful Backend-Derived Metrics with Distinct Semantic Icons) -->
      <div class="kpi-grid">
        <AppStatCard
          label="Today's Revenue"
          :value="`$${fmt(kpis.todayRevenue)}`"
          icon="i-heroicons-banknotes"
          tone="green"
          :loading="loading"
          :sublabel="`30-day total: $${fmt(kpis.monthRevenue)}`"
        />

        <AppStatCard
          label="Today's Orders"
          :value="kpis.todayOrders"
          icon="i-heroicons-shopping-bag"
          tone="blue"
          :loading="loading"
          :sublabel="`30-day orders: ${kpis.monthOrders}`"
        />

        <AppStatCard
          label="Avg. Order Value"
          :value="`$${fmt(kpis.avgOrderValue)}`"
          icon="i-heroicons-calculator"
          tone="neutral"
          :loading="loading"
          sublabel="30-day rolling average"
        />

        <AppStatCard
          label="Stock Alerts"
          :value="kpis.lowStockCount"
          icon="i-heroicons-exclamation-triangle"
          :tone="kpis.lowStockCount > 0 ? 'amber' : 'green'"
          :badge="kpis.outOfStockCount > 0 ? `${kpis.outOfStockCount} Out of Stock` : 'In Stock'"
          :badge-color="kpis.outOfStockCount > 0 ? 'red' : 'green'"
          :loading="loading"
          :sublabel="`${kpis.outOfStockCount} out of stock · ${Math.max(0, kpis.lowStockCount - kpis.outOfStockCount)} low stock`"
        />
      </div>

      <!-- Charts & Operational Panels -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr] gap-3.5">
        <!-- 14-Day Revenue Trend -->
        <AppCard title="Revenue — Last 14 Days">
          <template #header-right>
            <NuxtLink to="/reports/sales" class="text-xs font-semibold text-ink-secondary hover:text-ink no-underline hover:underline">Full Report</NuxtLink>
          </template>
          <div v-if="salesTrend.length > 0" class="flex items-end gap-1.5 h-[150px] pt-2 pb-1 overflow-x-auto pos-scroll">
            <div
              v-for="bar in salesTrend"
              :key="bar.period"
              class="flex-1 min-w-[22px] flex flex-col items-center gap-1.5 h-full group cursor-default"
              :title="`${bar.period}: $${fmt(bar.revenue)} (${bar.order_count || 0} orders)`"
            >
              <div class="flex-1 w-full flex items-end">
                <div
                  class="w-full bg-brand-900 rounded-t transition-all duration-200 group-hover:opacity-75 min-h-[4px]"
                  :style="{ height: maxRevenue > 0 ? `${Math.max(6, (Number(bar.revenue) / maxRevenue) * 100)}%` : '6%' }"
                />
              </div>
              <span class="text-[10px] text-ink-tertiary whitespace-nowrap">{{ bar.period.slice(5) }}</span>
            </div>
          </div>
          <AppEmptyState
            v-else
            icon="i-heroicons-chart-bar"
            title="No sales recorded in the last 14 days"
            description="Completed POS and admin sales will appear here."
          />
        </AppCard>

        <!-- Top Products -->
        <AppCard title="Top Products (30d)">
          <template #header-right>
            <NuxtLink to="/products" class="text-xs font-semibold text-ink-secondary hover:text-ink no-underline hover:underline">Catalog</NuxtLink>
          </template>
          <div v-if="topProducts.length > 0" class="flex flex-col gap-2.5">
            <div v-for="(p, i) in topProducts" :key="i" class="flex items-center gap-2 text-xs">
              <span class="w-4.5 text-[11px] font-bold text-ink-tertiary text-center shrink-0">{{ i + 1 }}</span>
              <span class="flex-1 text-ink font-medium truncate" :title="p.name">{{ p.name }}</span>
              <div class="w-16 h-1.5 bg-surface-hover rounded shrink-0 overflow-hidden">
                <div class="h-full bg-brand-900 rounded" :style="{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }" />
              </div>
              <span class="w-[52px] text-right font-semibold text-ink-secondary shrink-0 text-[11px]">{{ p.qty }} sold</span>
            </div>
          </div>
          <AppEmptyState
            v-else
            icon="i-heroicons-tag"
            title="No product velocity data yet"
          />
        </AppCard>

        <!-- Inventory Health -->
        <AppCard title="Inventory Health">
          <template #header-right>
            <NuxtLink to="/inventory" class="text-xs font-semibold text-ink-secondary hover:text-ink no-underline hover:underline">Manage Stock</NuxtLink>
          </template>
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center gap-2 text-[12.5px]">
              <span class="w-2 h-2 rounded-full shrink-0 bg-status-green" />
              <span class="flex-1 text-ink-secondary">Healthy Stock</span>
              <span class="font-semibold text-ink">{{ invSummary.inStock }}</span>
            </div>
            <div class="flex items-center gap-2 text-[12.5px]">
              <span class="w-2 h-2 rounded-full shrink-0 bg-status-amber" />
              <span class="flex-1 text-ink-secondary">Low Stock Warning</span>
              <span class="font-semibold text-status-amber">{{ invSummary.lowStock }}</span>
            </div>
            <div class="flex items-center gap-2 text-[12.5px]">
              <span class="w-2 h-2 rounded-full shrink-0 bg-status-red" />
              <span class="flex-1 text-ink-secondary">Out of Stock</span>
              <span class="font-semibold text-status-red">{{ invSummary.outOfStock }}</span>
            </div>
            <div class="h-px bg-border-subtle my-0.5" />
            <div class="flex items-center gap-2 text-[12.5px]">
              <span class="flex-1 text-ink-secondary">Total Active SKUs</span>
              <span class="font-semibold text-ink">{{ invSummary.totalSkus }}</span>
            </div>
            <div class="flex items-center gap-2 text-[12.5px]">
              <span class="flex-1 text-ink-secondary">Stock Cost Valuation</span>
              <span class="font-semibold text-ink mono">${{ fmt(invSummary.stockValue) }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Bottom Row: Recent Sales + Low Stock Alerts -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3.5">
        <AppCard title="Recent Sales Transactions" :no-pad="true">
          <template #header-right>
            <NuxtLink to="/sales" class="text-xs font-semibold text-ink-secondary hover:text-ink no-underline hover:underline">View All</NuxtLink>
          </template>
          <AppTable
            :columns="saleColumns"
            :rows="recentSales"
            :loading="loading"
            empty-text="No recent sales recorded."
            row-clickable
            @row-click="(row) => navigateTo(`/sales/${row.id}`)"
          >
            <template #cell-sale_number="{ row }">
              <NuxtLink :to="`/sales/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
                {{ row.invoice_number || row.sale_number || '—' }}
              </NuxtLink>
            </template>
            <template #cell-total_amount="{ row }">
              <span class="mono font-semibold">${{ fmt(row.total ?? row.total_amount) }}</span>
            </template>
            <template #cell-status="{ row }">
              <AppBadge
                :color="(row.sale_status || row.status) === 'COMPLETED' ? 'green' : (row.sale_status || row.status) === 'CANCELLED' ? 'red' : 'yellow'"
                size="sm"
              >
                {{ row.sale_status || row.status || 'COMPLETED' }}
              </AppBadge>
            </template>
            <template #cell-created_at="{ value }">
              <span class="text-xs text-gray-500">{{ value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>

        <AppCard title="Low Stock Operational Alerts" :no-pad="true">
          <template #header-right>
            <NuxtLink to="/inventory?low_stock_only=true" class="text-xs font-semibold text-ink-secondary hover:text-ink no-underline hover:underline">Restock</NuxtLink>
          </template>
          <AppTable :columns="alertColumns" :rows="lowStockItems" :loading="loading" empty-text="All SKUs are well stocked.">
            <template #cell-sku="{ value }">
              <code class="mono font-semibold">{{ value }}</code>
            </template>
            <template #cell-quantity_available="{ value }">
              <AppBadge :color="Number(value) <= 0 ? 'red' : 'yellow'" size="sm">
                {{ Number(value) <= 0 ? '0 (Out)' : `${value} left` }}
              </AppBadge>
            </template>
          </AppTable>
        </AppCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Dashboard — Clothing Store Admin' })

const reportApi = useReportApi()
const saleApi = useSaleApi()

const loading = ref(true)
const loadError = ref<string | null>(null)

const kpis = ref({
  todayRevenue: 0,
  monthRevenue: 0,
  todayOrders: 0,
  monthOrders: 0,
  avgOrderValue: 0,
  lowStockCount: 0,
  outOfStockCount: 0,
})

const salesTrend = ref<any[]>([])
const topProducts = ref<Array<{ name: string; qty: number }>>([])
const invSummary = ref({ inStock: 0, lowStock: 0, outOfStock: 0, totalSkus: 0, stockValue: 0 })
const recentSales = ref<any[]>([])
const lowStockItems = ref<any[]>([])

const maxRevenue = computed(() => Math.max(...salesTrend.value.map(r => Number(r.revenue || 0)), 1))

const saleColumns = [
  { key: 'sale_number', label: 'Invoice #' },
  { key: 'total_amount', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
]

const alertColumns = [
  { key: 'sku', label: 'SKU' },
  { key: 'product_name', label: 'Product' },
  { key: 'quantity_available', label: 'Available' },
]

function fmt(val: any) {
  return Number(val || 0).toFixed(2)
}

async function loadDashboard() {
  loading.value = true
  loadError.value = null
  const today = new Date().toISOString().slice(0, 10)
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  try {
    const [dashData, trendRes, monthRes, invRes, salesRes] = await Promise.all([
      reportApi.getDashboard().catch(() => null),
      reportApi.getSalesReport({ from_date: twoWeeksAgo, to_date: today, group_by: 'day' }).catch(() => []),
      reportApi.getSalesReport({ from_date: monthAgo, to_date: today, group_by: 'day' }).catch(() => []),
      reportApi.getInventoryReport().catch(() => []),
      saleApi.listSales({ limit: 8 }).catch(() => []),
    ])

    const trendRows = Array.isArray(trendRes) ? trendRes : ((trendRes as any)?.rows || [])
    salesTrend.value = trendRows.slice(-14)

    const monthRows = Array.isArray(monthRes) ? monthRes : ((monthRes as any)?.rows || [])
    const todayRow = monthRows.find((r: any) => r.period === today) || {}
    const monthRev = monthRows.reduce((s: number, r: any) => s + Number(r.revenue || 0), 0)
    const monthOrders = monthRows.reduce((s: number, r: any) => s + Number(r.order_count || 0), 0)

    kpis.value.todayRevenue = Number((dashData as any)?.today_revenue ?? todayRow.revenue ?? 0)
    kpis.value.todayOrders = Number((dashData as any)?.today_orders ?? todayRow.order_count ?? 0)
    kpis.value.monthRevenue = monthRev
    kpis.value.monthOrders = monthOrders
    kpis.value.avgOrderValue = monthOrders > 0 ? monthRev / monthOrders : 0

    if ((dashData as any)?.top_products) {
      topProducts.value = (dashData as any).top_products
        .slice(0, 5)
        .map((p: any) => ({ name: p.product_name || p.sku, qty: p.total_sold || p.qty || 0 }))
    }

    const invRows = Array.isArray(invRes) ? invRes : ((invRes as any)?.rows || [])
    const outOfStock = invRows.filter((r: any) => Number(r.quantity_available) <= 0).length
    const lowStock = invRows.filter((r: any) => Number(r.quantity_available) > 0 && Number(r.quantity_available) <= Number(r.reorder_point || 5)).length
    const inStock = invRows.length - outOfStock - lowStock
    const stockVal = invRows.reduce((s: number, r: any) => s + Number(r.stock_value || 0), 0)

    invSummary.value = { inStock, lowStock, outOfStock, totalSkus: invRows.length, stockValue: stockVal }
    kpis.value.lowStockCount = lowStock + outOfStock
    kpis.value.outOfStockCount = outOfStock

    lowStockItems.value = invRows
      .filter((r: any) => Number(r.quantity_available) <= Number(r.reorder_point || 5))
      .slice(0, 8)

    recentSales.value = ((salesRes as any[]) || []).slice(0, 8)
  } catch (err: any) {
    loadError.value = err?.data?.detail || err?.message || 'Could not load dashboard metrics.'
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>

