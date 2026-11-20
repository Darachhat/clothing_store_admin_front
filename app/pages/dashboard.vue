<template>
  <div class="page-root">
    <!-- Top Dashboard Action & KPI Strip -->
    <div class="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
      <!-- Left: Primary & Secondary Actions -->
      <div class="flex flex-wrap items-center gap-2.5">
        <AppButton
          size="md"
          variant="primary"
          icon="i-heroicons-plus"
          :label="t('dashboard.new_product', 'New Product')"
          to="/products/new"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-arrow-down-tray"
          :label="t('nav_section.reports', 'Reports')"
          to="/reports"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-computer-desktop"
          :label="t('nav.pos_registers', 'POS Registers')"
          to="/settings/terminals"
        />
        <AppButton
          size="md"
          variant="default"
          icon="i-heroicons-arrow-path"
          :label="t('common.refresh', 'Refresh')"
          :loading="loading"
          @click="loadDashboard"
        />
      </div>

      <!-- Right: Two Wide CDC Gradient KPI Cards with Decorative Watermarks & Progress Bars -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 xl:min-w-[640px] flex-1 xl:max-w-[740px]">
        <!-- Card 1: Today's Revenue -->
        <div class="relative bg-gradient-to-r from-[#102D71]/12 via-[#102D71]/5 to-surface-card border border-border-subtle rounded-xl p-4 shadow-card flex flex-col justify-between gap-3 overflow-hidden">
          <div class="pointer-events-none absolute w-28 h-28 right-0 top-0 translate-x-6 -translate-y-1/2 bg-[#102D71]/15 rounded-full" aria-hidden="true" />
          <div class="pointer-events-none absolute w-16 h-16 right-0 top-0 -translate-x-14 -translate-y-1/2 bg-[#102D71]/10 rounded-full" aria-hidden="true" />

          <div class="relative z-10 flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-navy text-white inline-flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-check" class="w-3.5 h-3.5" />
            </span>
            <span class="text-sm font-medium text-ink">{{ t('dashboard.today_revenue', "Today's Revenue") }}</span>
          </div>

          <div class="relative z-10 text-2xl sm:text-3xl font-semibold text-ink font-mono tabular-nums tracking-tight text-right leading-none">
            ${{ fmt(kpis.todayRevenue) }}
          </div>

          <div class="relative z-10 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-ink-secondary">
              <span>{{ t('dashboard.orders', 'Orders') }}: <strong class="font-medium text-ink font-mono">{{ kpis.todayOrders }}</strong></span>
              <span>{{ t('dashboard.avg_order', 'Avg Order') }}: <strong class="font-medium text-ink font-mono">${{ fmt(kpis.avgOrderValue) }}</strong></span>
            </div>
            <div class="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                class="h-full bg-navy rounded-full transition-all duration-700"
                :style="{ width: kpis.monthRevenue > 0 ? `${Math.min(100, Math.max(12, (kpis.todayRevenue / kpis.monthRevenue) * 100))}%` : '25%' }"
              />
            </div>
          </div>
        </div>

        <!-- Card 2: 30-Day Gross Revenue -->
        <div class="relative bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-surface-card border border-border-subtle rounded-xl p-4 shadow-card flex flex-col justify-between gap-3 overflow-hidden">
          <div class="pointer-events-none absolute w-28 h-28 right-0 top-0 translate-x-6 -translate-y-1/2 bg-emerald-500/18 rounded-full" aria-hidden="true" />
          <div class="pointer-events-none absolute w-16 h-16 right-0 top-0 -translate-x-14 -translate-y-1/2 bg-emerald-500/10 rounded-full" aria-hidden="true" />

          <div class="relative z-10 flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-status-green-bg text-white inline-flex items-center justify-center shrink-0">
              <UIcon name="i-heroicons-banknotes" class="w-3.5 h-3.5" />
            </span>
            <span class="text-sm font-medium text-ink">{{ t('dashboard.month_revenue', '30-Day Gross Revenue') }}</span>
          </div>

          <div class="relative z-10 text-2xl sm:text-3xl font-semibold text-ink font-mono tabular-nums tracking-tight text-right leading-none">
            ${{ fmt(kpis.monthRevenue) }}
          </div>

          <div class="relative z-10 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-ink-secondary">
              <span>{{ t('dashboard.orders', 'Orders') }}: <strong class="font-medium text-ink font-mono">{{ kpis.monthOrders }}</strong></span>
              <span>{{ t('dashboard.active_skus', 'Active SKUs') }}: <strong class="font-medium text-ink font-mono">{{ invSummary.totalSkus }}</strong></span>
            </div>
            <div class="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
              <div
                class="h-full bg-status-green-bg rounded-full transition-all duration-700"
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
      :title="t('dashboard.error_title', 'Unable to load dashboard metrics')"
      :message="loadError"
      @retry="loadDashboard"
    />

    <template v-else>
      <!-- Operational Units / Store Breakdown Expandable Accordion Card (CDC Pattern) -->
      <div class="bg-surface-card border border-border-subtle rounded-xl p-4 shadow-card space-y-2.5">
        <!-- Header Row -->
        <div class="bg-surface-inset rounded-lg px-4 py-2.5 grid grid-cols-12 items-center text-sm font-medium text-ink">
          <div class="col-span-6 sm:col-span-7">{{ t('dashboard.ops_unit', 'Store Operational Unit') }}</div>
          <div class="col-span-3 sm:col-span-2 text-right">{{ t('dashboard.ops_today', 'Today / Active') }}</div>
          <div class="col-span-3 text-right pr-6">{{ t('dashboard.ops_month', '30-Day / Valuation') }}</div>
        </div>

        <!-- Accordion Group 1: POS & Storefront Revenue -->
        <div class="rounded-lg border border-border-subtle overflow-hidden">
          <button
            type="button"
            class="w-full px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors cursor-pointer text-left bg-transparent border-0"
            :aria-expanded="expandedUnits.pos"
            @click="expandedUnits.pos = !expandedUnits.pos"
          >
            <div class="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0">
              <span class="h-7 px-2.5 rounded-md bg-navy text-white text-xs font-semibold inline-flex items-center justify-center shrink-0">POS</span>
              <span class="text-sm font-medium text-ink truncate">{{ t('dashboard.ops_pos', 'In-Store POS & Online Storefront Revenue') }}</span>
            </div>
            <div class="col-span-3 sm:col-span-2 text-right text-sm font-medium text-ink font-mono tabular-nums">
              ${{ fmt(kpis.todayRevenue) }}
            </div>
            <div class="col-span-3 text-right text-sm font-medium text-ink font-mono tabular-nums flex items-center justify-end gap-2">
              <span>${{ fmt(kpis.monthRevenue) }}</span>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-4 h-4 text-ink-tertiary shrink-0 transition-transform duration-200"
                :class="expandedUnits.pos ? 'rotate-180 text-navy' : ''"
              />
            </div>
          </button>

          <div v-if="expandedUnits.pos" class="border-t border-subtle bg-surface-inset/50 py-1.5">
            <div class="border-l border-border-default ml-5 sm:ml-8 pl-3 sm:pl-4 pr-4 space-y-1">
              <NuxtLink to="/sales" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-[#102D71]/10 text-navy text-[11px] font-medium">ORD</span>
                  <span class="truncate text-ink">{{ t('nav.sales_orders', 'Sales Orders') }}</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">{{ kpis.todayOrders }} today</div>
                <div class="col-span-3 text-right font-mono text-ink-secondary pr-6">{{ kpis.monthOrders }} / 30d</div>
              </NuxtLink>
              <NuxtLink to="/reports/sales" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-[#102D71]/10 text-navy text-[11px] font-medium">AVG</span>
                  <span class="truncate text-ink">{{ t('dashboard.avg_order', 'Average Order Value') }}</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">${{ fmt(kpis.avgOrderValue) }}</div>
                <div class="col-span-3 text-right text-navy text-xs font-medium pr-6">View report &rarr;</div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Accordion Group 2: Active Catalog & Warehouse Valuation -->
        <div class="rounded-lg border border-border-subtle overflow-hidden">
          <button
            type="button"
            class="w-full px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors cursor-pointer text-left bg-transparent border-0"
            :aria-expanded="expandedUnits.inv"
            @click="expandedUnits.inv = !expandedUnits.inv"
          >
            <div class="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0">
              <span class="h-7 px-2.5 rounded-md bg-status-green-bg text-white text-xs font-semibold inline-flex items-center justify-center shrink-0">INV</span>
              <span class="text-sm font-medium text-ink truncate">{{ t('dashboard.ops_inv', 'Warehouse Inventory & Active Catalog SKUs') }}</span>
            </div>
            <div class="col-span-3 sm:col-span-2 text-right text-sm font-medium text-ink font-mono tabular-nums">
              {{ invSummary.inStock }} {{ t('dashboard.healthy', 'healthy') }}
            </div>
            <div class="col-span-3 text-right text-sm font-medium text-ink font-mono tabular-nums flex items-center justify-end gap-2">
              <span>${{ fmt(invSummary.stockValue) }}</span>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-4 h-4 text-ink-tertiary shrink-0 transition-transform duration-200"
                :class="expandedUnits.inv ? 'rotate-180 text-navy' : ''"
              />
            </div>
          </button>

          <div v-if="expandedUnits.inv" class="border-t border-subtle bg-surface-inset/50 py-1.5">
            <div class="border-l border-border-default ml-5 sm:ml-8 pl-3 sm:pl-4 pr-4 space-y-1">
              <NuxtLink to="/inventory" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-[11px] font-medium">SKU</span>
                  <span class="truncate text-ink">{{ t('dashboard.active_skus', 'Active Catalog SKUs') }}</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">{{ invSummary.totalSkus }} total</div>
                <div class="col-span-3 text-right text-navy text-xs font-medium pr-6">Manage stock &rarr;</div>
              </NuxtLink>
              <NuxtLink to="/inventory/movements" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 text-[11px] font-medium">MOV</span>
                  <span class="truncate text-ink">{{ t('nav.movements', 'Stock Movements & Ledger') }}</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">—</div>
                <div class="col-span-3 text-right text-navy text-xs font-medium pr-6">View ledger &rarr;</div>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Accordion Group 3: Stock Alerts & Replenishment -->
        <div class="rounded-lg border border-border-subtle overflow-hidden">
          <button
            type="button"
            class="w-full px-4 py-3 grid grid-cols-12 items-center hover:bg-surface-hover transition-colors cursor-pointer text-left bg-transparent border-0"
            :aria-expanded="expandedUnits.alt"
            @click="expandedUnits.alt = !expandedUnits.alt"
          >
            <div class="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0">
              <span
                class="h-7 px-2.5 rounded-md text-white text-xs font-semibold inline-flex items-center justify-center shrink-0"
                :class="kpis.outOfStockCount > 0 ? 'bg-status-red-bg' : 'bg-navy'"
              >
                ALT
              </span>
              <span class="text-sm font-medium text-ink truncate">{{ t('dashboard.ops_alert', 'Replenishment & Low Stock Operational Alerts') }}</span>
            </div>
            <div class="col-span-3 sm:col-span-2 text-right text-sm font-medium font-mono tabular-nums" :class="invSummary.outOfStock > 0 ? 'text-status-red' : 'text-ink'">
              {{ invSummary.outOfStock }} {{ t('dashboard.out_of_stock', 'out of stock') }}
            </div>
            <div class="col-span-3 text-right text-sm font-medium text-ink font-mono tabular-nums flex items-center justify-end gap-2">
              <span>{{ invSummary.lowStock }} {{ t('dashboard.low_stock', 'low stock') }}</span>
              <UIcon
                name="i-heroicons-chevron-down"
                class="w-4 h-4 text-ink-tertiary shrink-0 transition-transform duration-200"
                :class="expandedUnits.alt ? 'rotate-180 text-navy' : ''"
              />
            </div>
          </button>

          <div v-if="expandedUnits.alt" class="border-t border-subtle bg-surface-inset/50 py-1.5">
            <div class="border-l border-border-default ml-5 sm:ml-8 pl-3 sm:pl-4 pr-4 space-y-1">
              <NuxtLink to="/inventory?low_stock_only=true" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 text-[11px] font-medium">LOW</span>
                  <span class="truncate text-ink">Low Stock Variants</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">{{ invSummary.lowStock }}</div>
                <div class="col-span-3 text-right text-navy text-xs font-medium pr-6">Replenish &rarr;</div>
              </NuxtLink>
              <NuxtLink to="/purchases/new" class="grid grid-cols-12 items-center py-2 px-2 rounded-md hover:bg-surface-hover transition-colors no-underline text-xs sm:text-sm">
                <div class="col-span-6 sm:col-span-7 flex items-center gap-2 text-ink-secondary">
                  <span class="px-1.5 py-0.5 rounded bg-red-500/10 text-red-700 text-[11px] font-medium">PO</span>
                  <span class="truncate text-ink">Create Purchase Order</span>
                </div>
                <div class="col-span-3 sm:col-span-2 text-right font-mono text-ink-secondary">{{ invSummary.outOfStock }} critical</div>
                <div class="col-span-3 text-right text-navy text-xs font-medium pr-6">New PO &rarr;</div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Full-Width Bar Chart Card -->
      <div class="bg-surface-card border border-border-subtle rounded-xl p-5 shadow-card">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div class="flex items-center gap-3">
            <h2 class="text-base font-medium text-ink">
              {{ chartMetric === 'revenue' ? t('dashboard.chart_revenue', 'Daily Revenue — Last 14 Days') : t('dashboard.chart_orders', 'Daily Order Volume — Last 14 Days') }}
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
                {{ t('dashboard.metric_revenue', 'Revenue ($)') }}
              </button>
              <button
                type="button"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                :class="chartMetric === 'orders' ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
                @click="chartMetric = 'orders'"
              >
                {{ t('dashboard.metric_orders', 'Orders (#)') }}
              </button>
            </div>
            <NuxtLink
              to="/reports/sales"
              class="w-8 h-8 rounded-lg border border-border-subtle bg-surface-card hover:bg-surface-hover inline-flex items-center justify-center text-ink-secondary hover:text-ink no-underline"
              :title="t('nav.sales_report', 'Sales Report')"
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4" />
            </NuxtLink>
          </div>
        </div>

        <div v-if="salesTrend.length > 0" class="relative pt-4 pb-1">
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
                :title="`${bar.period}: $${fmt(bar.revenue)} (${bar.order_count || 0} ${t('dashboard.orders', 'Orders')})`"
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
          :title="t('dashboard.empty_chart_title', 'No sales recorded in the last 14 days')"
          :description="t('dashboard.empty_chart_desc', 'Completed POS and admin sales will appear here.')"
        />
      </div>

      <!-- Bottom Row: Recent Sales + Low Stock Alerts & Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-3.5">
        <AppCard :title="t('dashboard.recent_sales', 'Recent Sales Transactions')" :no-pad="true">
          <template #header-right>
            <NuxtLink to="/sales" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">
              {{ t('common.view_all', 'View All') }}
            </NuxtLink>
          </template>
          <AppTable
            :columns="saleColumns"
            :rows="recentSales"
            :loading="loading"
            :empty-text="t('dashboard.empty_sales', 'No recent sales recorded.')"
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
                {{ localizeStatus(row.sale_status || row.status || 'COMPLETED') }}
              </AppBadge>
            </template>
            <template #cell-created_at="{ value }">
              <span class="text-xs text-ink-secondary">{{ value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>

        <div class="flex flex-col gap-3.5">
          <AppCard :title="t('dashboard.low_stock_alerts', 'Low Stock Operational Alerts')" :no-pad="true">
            <template #header-right>
              <NuxtLink to="/inventory?low_stock_only=true" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">
                {{ t('dashboard.restock', 'Restock') }}
              </NuxtLink>
            </template>
            <AppTable
              :columns="alertColumns"
              :rows="lowStockItems"
              :loading="loading"
              :empty-text="t('dashboard.empty_alerts', 'All SKUs are well stocked.')"
            >
              <template #cell-sku="{ value }">
                <code class="mono font-medium text-ink">{{ value }}</code>
              </template>
              <template #cell-quantity_available="{ value }">
                <AppBadge :color="Number(value) <= 0 ? 'red' : 'yellow'" size="sm">
                  {{ Number(value) <= 0 ? t('dashboard.out_badge', '0 (Out)') : `${value} ${t('dashboard.left', 'left')}` }}
                </AppBadge>
              </template>
            </AppTable>
          </AppCard>

          <!-- Top Products -->
          <AppCard v-if="topProducts.length > 0" :title="t('dashboard.top_products', 'Top Products (30d)')">
            <template #header-right>
              <NuxtLink to="/products" class="text-xs font-medium text-ink-secondary hover:text-ink no-underline hover:underline">
                {{ t('nav_section.catalog', 'Catalog') }}
              </NuxtLink>
            </template>
            <div class="flex flex-col gap-2.5">
              <div v-for="(p, i) in topProducts" :key="i" class="flex items-center gap-2 text-xs">
                <span class="w-5 text-xs font-medium text-ink-tertiary text-center shrink-0">{{ i + 1 }}</span>
                <span class="flex-1 text-ink font-normal truncate" :title="p.name">{{ p.name }}</span>
                <div class="w-20 h-1.5 bg-surface-inset rounded-full shrink-0 overflow-hidden">
                  <div class="h-full bg-navy rounded-full" :style="{ width: `${(p.qty / (topProducts[0]?.qty || 1)) * 100}%` }" />
                </div>
                <span class="w-[56px] text-right font-medium text-ink-secondary shrink-0 text-xs mono">
                  {{ p.qty }} {{ t('dashboard.sold', 'sold') }}
                </span>
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

const { t } = useAppTranslation()
useHead({ title: computed(() => `${t('nav.dashboard', 'Dashboard')} — Clothing Store Admin`) })

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
const expandedUnits = reactive({
  pos: true,
  inv: false,
  alt: false,
})

const maxRevenue = computed(() => Math.max(...salesTrend.value.map(r => Number(r.revenue || 0)), 1))
const maxOrders = computed(() => Math.max(...salesTrend.value.map(r => Number(r.order_count || 0)), 1))

const saleColumns = computed(() => [
  { key: 'sale_number', label: t('dashboard.col_invoice', 'Invoice #') },
  { key: 'total_amount', label: t('fields.total', 'Total') },
  { key: 'status', label: t('common.status', 'Status') },
  { key: 'created_at', label: t('fields.date', 'Date') },
])

const alertColumns = computed(() => [
  { key: 'sku', label: t('fields.sku', 'SKU') },
  { key: 'product_name', label: t('nav.products', 'Product') },
  { key: 'quantity_available', label: t('dashboard.col_available', 'Available') },
])

function localizeStatus(status: string): string {
  const s = (status || 'COMPLETED').toUpperCase()
  if (s === 'COMPLETED') return t('status.completed', 'Completed')
  if (s === 'CANCELLED') return t('status.cancelled', 'Cancelled')
  if (s === 'PENDING') return t('status.pending', 'Pending')
  if (s === 'REFUNDED' || s === 'RETURNED') return t('status.refunded', 'Refunded')
  return s
}

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
    loadError.value = err?.data?.detail || err?.message || t('dashboard.error_msg', 'Could not load dashboard metrics.')
  } finally {
    loading.value = false
  }
}

onMounted(loadDashboard)
</script>
