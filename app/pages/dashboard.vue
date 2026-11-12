<template>
  <div class="page-root">
    <!-- Top Dashboard Action & KPI Strip (Reference Screenshot 2 Layout) -->
    <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
      <!-- Left: Primary & Secondary Actions -->
      <div class="flex flex-wrap items-center gap-2.5">
        <AppButton
          size="md"
          variant="primary"
          icon="i-heroicons-plus"
          label="New Product"
          to="/products/new"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-arrow-down-tray"
          label="Reports"
          to="/reports"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-computer-desktop"
          label="POS Registers"
          to="/settings/terminals"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="loadDashboard"
        />
      </div>

      <!-- Right: Two Wide Summary KPI Cards with Progress Bars (Screenshot 2) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xl:min-w-[640px] flex-1 xl:max-w-[740px]">
        <!-- Card 1: Today's Revenue (#000000 Primary Accent) -->
        <div class="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-card flex flex-col justify-between gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-navy text-white inline-flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-check" class="w-3.5 h-3.5" />
              </span>
              <span class="text-sm font-medium text-ink">Today's Revenue</span>
            </div>
            <div class="text-2xl sm:text-[26px] font-medium text-ink mono tracking-tight leading-none pt-1">
              ${{ fmt(kpis.todayRevenue) }}
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-ink-secondary">
              <span>Orders: <strong class="font-medium text-ink mono">{{ kpis.todayOrders }}</strong></span>
              <span>Avg Order: <strong class="font-medium text-ink mono">${{ fmt(kpis.avgOrderValue) }}</strong></span>
            </div>
            <div class="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden">
              <div
                class="h-full bg-navy rounded-full transition-all duration-300"
                :style="{ width: kpis.monthRevenue > 0 ? `${Math.min(100, Math.max(12, (kpis.todayRevenue / kpis.monthRevenue) * 100))}%` : '25%' }"
              />
            </div>
          </div>
        </div>

        <!-- Card 2: 30-Day Gross Revenue (#2A7C13 Green Accent) -->
        <div class="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-card flex flex-col justify-between gap-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-md bg-status-green-bg text-white inline-flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5" />
              </span>
              <span class="text-sm font-medium text-ink">30-Day Gross Revenue</span>
            </div>
            <div class="text-2xl sm:text-[26px] font-medium text-ink mono tracking-tight leading-none pt-1">
              ${{ fmt(kpis.monthRevenue) }}
            </div>
          </div>
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-ink-secondary">
              <span>Orders: <strong class="font-medium text-ink mono">{{ kpis.monthOrders }}</strong></span>
              <span>Active SKUs: <strong class="font-medium text-ink mono">{{ invSummary.totalSkus }}</strong></span>
            </div>
            <div class="w-full h-1.5 bg-surface-inset rounded-full overflow-hidden">
              <div
                class="h-full bg-status-green-bg rounded-full transition-all duration-300"
                :style="{ width: kpis.monthRevenue > 0 ? '88%' : '35%' }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <AppErrorState
      v-if="loadError"
      title="Unable to load dashboard metrics"
      :message="loadError"
      @retry="loadDashboard"
    />

    <template v-else>
      <!-- Operational Units / Store Breakdown Card (Reference Screenshot 2 Middle Panel) -->
      <div class="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-card space-y-2.5">
        <!-- Header Row -->
        <div class="bg-surface-inset rounded-lg px-4 py-2.5 grid grid-cols-12 items-center text-sm font-medium text-ink">
          <div class="col-span-6 sm:col-span-7">Store Operational Unit</div>
          <div class="col-span-3 sm:col-span-2 text-right">Today / Active</div>
          <div class="col-span-3 text-right">30-Day / Valuation</div>
        </div>

        <!-- Row 1: POS & Storefront Revenue -->
        <NuxtLink
          to="/sales"
          class="rounded-lg border border-border-subtle px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors no-underline"
        >
          <div class="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0">
            <span class="px-2.5 py-0.5 rounded-md bg-navy text-white text-xs font-medium shrink-0">POS</span>
            <span class="text-sm font-normal text-ink truncate">In-Store POS &amp; Online Storefront Revenue</span>
          </div>
          <div class="col-span-3 sm:col-span-2 text-right text-sm font-normal text-ink mono">
            ${{ fmt(kpis.todayRevenue) }}
          </div>
          <div class="col-span-3 text-right text-sm font-normal text-ink mono">
            ${{ fmt(kpis.monthRevenue) }}
          </div>
        </NuxtLink>

        <!-- Row 2: Active Catalog & Warehouse Valuation -->
        <NuxtLink
          to="/inventory"
          class="rounded-lg border border-border-subtle px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors no-underline"
        >
          <div class="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0">
            <span class="px-2.5 py-0.5 rounded-md bg-status-green-bg text-white text-xs font-medium shrink-0">INV</span>
            <span class="text-sm font-normal text-ink truncate">Warehouse Inventory &amp; Active Catalog SKUs</span>
          </div>
          <div class="col-span-3 sm:col-span-2 text-right text-sm font-normal text-ink mono">
            {{ invSummary.inStock }} healthy
          </div>
          <div class="col-span-3 text-right text-sm font-normal text-ink mono">
            ${{ fmt(invSummary.stockValue) }}
          </div>
        </NuxtLink>

        <!-- Row 3: Stock Alerts & Replenishment -->
        <NuxtLink
          to="/inventory?low_stock_only=true"
          class="rounded-lg border border-border-subtle px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors no-underline"
        >
          <div class="col-span-6 sm:col-span-7 flex items-center gap-2.5 min-w-0">
            <span
              class="px-2.5 py-0.5 rounded-md text-white text-xs font-medium shrink-0"
              :class="kpis.outOfStockCount > 0 ? 'bg-status-red-bg' : 'bg-navy'"
            >
              ALT
            </span>
            <span class="text-sm font-normal text-ink truncate">Replenishment &amp; Low Stock Operational Alerts</span>
          </div>
          <div class="col-span-3 sm:col-span-2 text-right text-sm font-normal mono" :class="invSummary.outOfStock > 0 ? 'text-status-red font-medium' : 'text-ink'">
            {{ invSummary.outOfStock }} out of stock
          </div>
          <div class="col-span-3 text-right text-sm font-normal text-ink mono flex items-center justify-end gap-1.5">
            <span>{{ invSummary.lowStock }} low stock</span>
            <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5 text-ink-tertiary" />
          </div>
        </NuxtLink>
      </div>

      <!-- Full-Width Bar Chart Card (Reference Screenshot 2 Bottom Panel) -->
      <div class="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-medium text-ink">
              {{ chartMetric === 'revenue' ? 'Daily Revenue — Last 14 Days' : 'Daily Order Volume — Last 14 Days' }}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <div class="inline-flex items-center gap-1 bg-surface-inset p-1 rounded-lg border border-border-subtle">
              <button
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                :class="chartMetric === 'revenue' ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
                @click="chartMetric = 'revenue'"
              >
                Revenue ($)
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                :class="chartMetric === 'orders' ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
                @click="chartMetric = 'orders'"
              >
                Orders (#)
              </button>
            </div>
            <NuxtLink
              to="/reports/sales"
              class="w-8 h-8 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-hover inline-flex items-center justify-center text-ink-secondary hover:text-ink no-underline"
              title="Open Sales Report"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>

        <div v-if="salesTrend.length > 0" class="relative pt-4 pb-1">
          <!-- Horizontal Reference Grid Lines -->
          <div class="flex gap-3 items-stretch">
            <div class="flex flex-col justify-between h-[180px] text-right pr-2 text-xs text-ink-tertiary mono select-none shrink-0">
              <span>{{ chartMetric === 'revenue' ? `$${Math.round(maxRevenue)}` : maxOrders }}</span>
              <span>{{ chartMetric === 'revenue' ? `$${Math.round(maxRevenue * 0.75)}` : Math.round(maxOrders * 0.75) }}</span>
              <span>{{ chartMetric === 'revenue' ? `$${Math.round(maxRevenue * 0.5)}` : Math.round(maxOrders * 0.5) }}</span>
              <span>{{ chartMetric === 'revenue' ? `$${Math.round(maxRevenue * 0.25)}` : Math.round(maxOrders * 0.25) }}</span>
              <span>0</span>
            </div>

            <div class="flex-1 flex items-end gap-2 sm:gap-3 overflow-x-auto pos-scroll">
              <div
                v-for="bar in salesTrend"
                :key="bar.period"
                class="flex-1 min-w-[42px] flex flex-col items-center group cursor-default"
                :title="`${bar.period}: $${fmt(bar.revenue)} (${bar.order_count || 0} orders)`"
              >
                <div class="h-[180px] w-full flex flex-col items-center justify-end border-b border-border-subtle">
                  <span class="text-xs font-medium text-ink mono mb-1">
                    {{ chartMetric === 'revenue' ? (Number(bar.revenue) > 0 ? `$${Math.round(Number(bar.revenue))}` : '0') : (bar.order_count || 0) }}
                  </span>
                  <div
                    class="w-full max-w-[38px] bg-navy rounded-t transition-all duration-200 group-hover:opacity-80 min-h-[4px]"
                    :style="{
                      height: chartMetric === 'revenue'
                        ? (maxRevenue > 0 ? `${Math.max(4, (Number(bar.revenue) / maxRevenue) * 145)}px` : '4px')
                        : (maxOrders > 0 ? `${Math.max(4, (Number(bar.order_count || 0) / maxOrders) * 145)}px` : '4px')
                    }"
                  />
                </div>
                <span class="mt-2 text-xs text-ink-secondary mono whitespace-nowrap">{{ bar.period.slice(5) }}</span>
              </div>
            </div>
          </div>
        </div>
        <AppEmptyState
          v-else
          icon="i-heroicons-chart-bar"
          title="No sales recorded in the last 14 days"
          description="Completed POS and admin sales will appear here."
        />
      </div>

      <!-- Bottom Row: Recent Sales + Low Stock Alerts & Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3.5">
        <AppCard title="Recent Sales Transactions" :no-pad="true">
          <template #header-right>
            <NuxtLink to="/sales" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">View All</NuxtLink>
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
              <NuxtLink :to="`/sales/${row.id}`" class="mono font-medium text-ink hover:underline">
                {{ row.invoice_number || row.sale_number || '—' }}
              </NuxtLink>
            </template>
            <template #cell-total_amount="{ row }">
              <span class="mono font-medium text-ink">${{ fmt(row.total ?? row.total_amount) }}</span>
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
              <span class="text-xs text-ink-secondary">{{ value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>

        <div class="flex flex-col gap-3.5">
          <AppCard title="Low Stock Operational Alerts" :no-pad="true">
            <template #header-right>
              <NuxtLink to="/inventory?low_stock_only=true" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">Restock</NuxtLink>
            </template>
            <AppTable :columns="alertColumns" :rows="lowStockItems" :loading="loading" empty-text="All SKUs are well stocked.">
              <template #cell-sku="{ value }">
                <code class="mono font-medium text-ink">{{ value }}</code>
              </template>
              <template #cell-quantity_available="{ value }">
                <AppBadge :color="Number(value) <= 0 ? 'red' : 'yellow'" size="sm">
                  {{ Number(value) <= 0 ? '0 (Out)' : `${value} left` }}
                </AppBadge>
              </template>
            </AppTable>
          </AppCard>

          <!-- Top Products -->
          <AppCard v-if="topProducts.length > 0" title="Top Products (30d)">
            <template #header-right>
              <NuxtLink to="/products" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">Catalog</NuxtLink>
            </template>
            <div class="flex flex-col gap-2.5">
              <div v-for="(p, i) in topProducts" :key="i" class="flex items-center gap-2 text-xs">
                <span class="w-5 text-xs font-medium text-ink-tertiary text-center shrink-0">{{ i + 1 }}</span>
                <span class="flex-1 text-ink font-normal truncate" :title="p.name">{{ p.name }}</span>
                <div class="w-20 h-1.5 bg-surface-inset rounded-full shrink-0 overflow-hidden">
                  <div class="h-full bg-navy rounded-full" :style="{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }" />
                </div>
                <span class="w-[56px] text-right font-medium text-ink-secondary shrink-0 text-xs mono">{{ p.qty }} sold</span>
              </div>
            </div>
          </AppCard>
        </div>
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
const chartMetric = ref<'revenue' | 'orders'>('revenue')

const maxRevenue = computed(() => Math.max(...salesTrend.value.map(r => Number(r.revenue || 0)), 1))
const maxOrders = computed(() => Math.max(...salesTrend.value.map(r => Number(r.order_count || 0)), 1))

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

