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
      <div class="dashboard-charts-grid">
        <!-- 14-Day Revenue Trend -->
        <AppCard title="Revenue — Last 14 Days">
          <template #header-right>
            <NuxtLink to="/reports/sales" class="card-link">Full Report</NuxtLink>
          </template>
          <div v-if="salesTrend.length > 0" class="bar-chart">
            <div
              v-for="bar in salesTrend"
              :key="bar.period"
              class="bar-col"
              :title="`${bar.period}: $${fmt(bar.revenue)} (${bar.order_count || 0} orders)`"
            >
              <div class="bar-fill-wrap">
                <div
                  class="bar-fill"
                  :style="{ height: maxRevenue > 0 ? `${Math.max(6, (Number(bar.revenue) / maxRevenue) * 100)}%` : '6%' }"
                />
              </div>
              <span class="bar-label">{{ bar.period.slice(5) }}</span>
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
            <NuxtLink to="/products" class="card-link">Catalog</NuxtLink>
          </template>
          <div v-if="topProducts.length > 0" class="top-products">
            <div v-for="(p, i) in topProducts" :key="i" class="top-product-row">
              <span class="top-rank">{{ i + 1 }}</span>
              <span class="top-name" :title="p.name">{{ p.name }}</span>
              <div class="top-bar-wrap">
                <div class="top-bar" :style="{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }" />
              </div>
              <span class="top-qty">{{ p.qty }} sold</span>
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
            <NuxtLink to="/inventory" class="card-link">Manage Stock</NuxtLink>
          </template>
          <div class="inv-breakdown">
            <div class="inv-row">
              <span class="inv-dot green" />
              <span class="inv-label">Healthy Stock</span>
              <span class="inv-val">{{ invSummary.inStock }}</span>
            </div>
            <div class="inv-row">
              <span class="inv-dot amber" />
              <span class="inv-label">Low Stock Warning</span>
              <span class="inv-val amber">{{ invSummary.lowStock }}</span>
            </div>
            <div class="inv-row">
              <span class="inv-dot red" />
              <span class="inv-label">Out of Stock</span>
              <span class="inv-val red">{{ invSummary.outOfStock }}</span>
            </div>
            <div class="inv-divider" />
            <div class="inv-row">
              <span class="inv-label">Total Active SKUs</span>
              <span class="inv-val">{{ invSummary.totalSkus }}</span>
            </div>
            <div class="inv-row">
              <span class="inv-label">Stock Cost Valuation</span>
              <span class="inv-val mono">${{ fmt(invSummary.stockValue) }}</span>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Bottom Row: Recent Sales + Low Stock Alerts -->
      <div class="dashboard-bottom-grid">
        <AppCard title="Recent Sales Transactions" :no-pad="true">
          <template #header-right>
            <NuxtLink to="/sales" class="card-link">View All</NuxtLink>
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
            <NuxtLink to="/inventory?low_stock_only=true" class="card-link">Restock</NuxtLink>
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

<style scoped>
.dashboard-charts-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 14px;
}

.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: 1.35fr 1fr;
  gap: 14px;
}

@media (max-width: 1100px) {
  .dashboard-charts-grid {
    grid-template-columns: 1fr 1fr;
  }
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-charts-grid {
    grid-template-columns: 1fr;
  }
}

.card-link {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  text-decoration: none;
}

.card-link:hover {
  color: var(--text-primary, #0f172a);
  text-decoration: underline;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 150px;
  padding-top: 8px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  height: 100%;
}

.bar-fill-wrap {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: var(--accent-primary, #0f172a);
  border-radius: 3px 3px 0 0;
  transition: height 0.25s ease, opacity 0.15s;
  min-height: 4px;
}

.bar-col:hover .bar-fill {
  opacity: 0.75;
}

.bar-label {
  font-size: 10px;
  color: var(--text-tertiary, #64748b);
  white-space: nowrap;
}

.top-products {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top-product-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.top-rank {
  width: 18px;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary, #64748b);
  text-align: center;
  flex-shrink: 0;
}

.top-name {
  flex: 1;
  color: var(--text-primary, #0f172a);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top-bar-wrap {
  width: 64px;
  height: 5px;
  background: var(--surface-hover, #f1f5f9);
  border-radius: 3px;
  flex-shrink: 0;
}

.top-bar {
  height: 100%;
  background: var(--accent-primary, #0f172a);
  border-radius: 3px;
}

.top-qty {
  width: 52px;
  text-align: right;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  flex-shrink: 0;
  font-size: 11px;
}

.inv-breakdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
}

.inv-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.inv-dot.green { background: var(--status-green, #15803d); }
.inv-dot.amber { background: var(--status-amber, #b45309); }
.inv-dot.red   { background: var(--status-red, #b91c1c); }

.inv-label {
  flex: 1;
  color: var(--text-secondary, #475569);
}

.inv-val {
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}
.inv-val.amber { color: var(--status-amber, #b45309); }
.inv-val.red   { color: var(--status-red, #b91c1c); }

.inv-divider {
  height: 1px;
  background: var(--border-subtle, #e5e7eb);
  margin: 2px 0;
}
</style>
