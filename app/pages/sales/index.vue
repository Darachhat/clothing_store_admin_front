<template>
  <div class="page-root">
    <AppPageHeader
      :title="t('sales.title', 'Sales History')"
      :description="t('sales.description', 'View POS transactions, online storefront orders, and receipt records.')"
      :breadcrumbs="[
        { label: t('nav_section.store', 'Store'), to: '/sales' },
        { label: t('nav.sales_orders', 'Sales Orders') },
      ]"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-uturn-left" :label="t('nav.returns', 'Returns')" to="/sales/returns" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-down-tray" :label="t('common.export_csv', 'Export CSV')" @click="exportCsv" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" :label="t('common.refresh', 'Refresh')" :loading="loading" @click="fetchSales" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      :search-placeholder="t('sales.search_placeholder', 'Search invoice number (e.g. INV-2026...)...')"
      :chips="activeChips"
      :shown-count="paginatedSales.length"
      :total-count="filteredSales.length"
      :summary-items="[
        { label: t('sales.total_revenue', 'Total Revenue'), value: `$${totalSalesRevenue}` },
        { label: t('sales.invoices', 'Invoices'), value: filteredSales.length },
        { label: t('status.completed', 'Completed'), value: completedSalesCount },
      ]"
      :count-label="t('nav.sales_orders', 'sales')"
      @submit="fetchSales"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="channelFilter"
        :options="[
          { label: t('sales.all_channels', 'All Channels'), value: 'ALL' },
          { label: t('sales.channel_pos', 'POS In-Store'), value: 'POS' },
          { label: t('sales.channel_online', 'Online Store'), value: 'ONLINE' },
        ]"
        style="min-width: 145px;"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: t('products.all_statuses', 'All Statuses'), value: '' },
          { label: t('status.completed', 'Completed'), value: 'COMPLETED' },
          { label: t('status.refunded', 'Returned'), value: 'RETURNED' },
          { label: t('status.cancelled', 'Cancelled'), value: 'CANCELLED' },
          { label: t('status.draft', 'Draft'), value: 'DRAFT' },
        ]"
        style="min-width: 145px;"
        @change="fetchSales"
      />
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">{{ t('sales.from', 'From') }}:</span>
        <AppInput v-model="fromDate" type="date" style="width: 140px;" @change="fetchSales" />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">{{ t('sales.to', 'To') }}:</span>
        <AppInput v-model="toDate" type="date" style="width: 140px;" @change="fetchSales" />
      </div>
    </AppFilterBar>

    <!-- Sales Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedSales"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-receipt-percent',
          label: t('sales.empty_title', 'No sales found'),
          description: t('sales.empty_desc', 'Completed POS sales and online storefront orders will appear here.'),
        }"
      >
        <template #cell-invoice_number="{ row }">
          <div class="flex flex-col gap-0.5 min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <NuxtLink :to="`/sales/${row.id}`" class="mono font-medium text-ink hover:underline">
                {{ row.invoice_number }}
              </NuxtLink>
              <span class="text-xs text-ink-secondary">
                ({{ isOnlineOrder(row) ? t('sales.channel_online', 'Online Store') : t('sales.channel_pos', 'POS In-Store') }})
              </span>
            </div>
            <div class="text-xs text-ink-secondary truncate max-w-[380px]">
              Clothing Store | {{ row.items?.length ? `${row.items.length} ${t('sales.items', 'items')}` : 'Standard Retail Sale' }}
              <template v-if="row.notes"> — {{ row.notes }}</template>
            </div>
          </div>
        </template>

        <template #cell-channel="{ row }">
          <span
            class="inline-flex items-center gap-1.5 h-7 px-3 py-1 rounded text-xs font-medium"
            :class="isOnlineOrder(row) ? 'bg-navy text-white' : 'bg-surface-inset text-ink border border-border-subtle'"
          >
            <UIcon :name="isOnlineOrder(row) ? 'i-heroicons-globe-alt' : 'i-heroicons-building-storefront'" class="w-3.5 h-3.5" />
            <span>{{ isOnlineOrder(row) ? t('sales.channel_online', 'Online Store') : 'POS' }}</span>
          </span>
        </template>

        <template #cell-total="{ row }">
          <div class="flex flex-col items-end gap-0.5">
            <span class="mono font-medium text-ink">
              ${{ Number(row.total || 0).toFixed(2) }}
            </span>
            <span class="text-xs text-ink-secondary whitespace-nowrap">
              {{ formatDate(row.created_at) }}
            </span>
          </div>
        </template>

        <template #cell-sale_status="{ row }">
          <AppBadge
            :color="getStatusColor(row.sale_status || row.status)"
            :label="localizeStatus(row.sale_status || row.status || 'COMPLETED')"
            size="sm"
          />
        </template>

        <template #cell-payments="{ row }">
          <div class="flex gap-1 flex-wrap">
            <template v-if="row.payments?.length">
              <AppBadge
                v-for="p in row.payments"
                :key="p.id"
                variant="default"
                size="sm"
              >
                {{ p.payment_method }}: ${{ Number(p.amount).toFixed(2) }}
              </AppBadge>
            </template>
            <span v-else class="text-xs text-ink-tertiary">—</span>
          </div>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-ink-secondary whitespace-nowrap">
            {{ (row.sale_status || row.status || 'COMPLETED') === 'COMPLETED' ? `${t('status.paid', 'Paid')} - ` : '' }}{{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              size="xs"
              variant="ghost"
              :label="t('sales.preview', 'Preview')"
              @click="openDetails(row)"
            />
            <AppButton
              size="xs"
              variant="default"
              :label="t('common.view', 'View')"
              :to="`/sales/${row.id}`"
            />
          </div>
        </template>

        <template v-if="filteredSales.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredSales.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Sale Detail Modal -->
    <AppModal
      v-model="isDetailOpen"
      :title="selectedSale ? `${t('dashboard.col_invoice', 'Invoice #')} ${selectedSale.invoice_number}` : t('sales.title', 'Sale Detail')"
      :description="selectedSale ? formatDate(selectedSale.created_at) : ''"
      size="md"
    >
      <div v-if="selectedSale" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">{{ t('common.status', 'Status') }}</span>
          <AppBadge :color="getStatusColor(selectedSale.sale_status)" :label="localizeStatus(selectedSale.sale_status)" size="sm" />
        </div>

        <!-- Items List -->
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ t('sales.items', 'Items') }}</h4>
          <div class="divide-y divide-gray-100 border border-gray-200 rounded-lg px-3">
            <div
              v-for="item in selectedSale.items"
              :key="item.id"
              class="py-2 flex items-center justify-between text-sm"
            >
              <div>
                <p class="font-medium text-gray-900">
                  Variant #{{ item.variant_id?.slice(0, 8) }}
                </p>
                <p class="text-xs text-gray-500">{{ t('fields.quantity', 'Qty') }}: {{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
              </div>
              <span class="font-semibold mono">${{ Number(item.subtotal).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Summary Breakdown -->
        <div class="border-t border-gray-200 pt-3 space-y-1 text-sm">
          <div class="flex justify-between text-gray-500">
            <span>{{ t('fields.subtotal', 'Subtotal') }}</span>
            <span class="mono">${{ Number(selectedSale.subtotal || 0).toFixed(2) }}</span>
          </div>
          <div v-if="Number(selectedSale.discount_amount) > 0" class="flex justify-between text-green-600">
            <span>{{ t('fields.discount', 'Discount') }}</span>
            <span class="mono">-${{ Number(selectedSale.discount_amount).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-medium text-base text-gray-900 pt-1">
            <span>{{ t('fields.total', 'Total') }}</span>
            <span class="mono">${{ Number(selectedSale.total || 0).toFixed(2) }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <AppButton variant="ghost" @click="isDetailOpen = false">{{ t('common.close', 'Close') }}</AppButton>
          <AppButton variant="primary" :to="`/sales/${selectedSale.id}`">{{ t('sales.full_invoice', 'Full Invoice') }}</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { FilterChipItem } from '~/types'

definePageMeta({
  middleware: ['auth'],
})

const { t } = useAppTranslation()
useHead({ title: computed(() => `${t('sales.title', 'Sales History')} — Clothing Store Admin`) })

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const sales = ref<any[]>([])
const channelFilter = ref<'ALL' | 'POS' | 'ONLINE'>('ALL')
const searchQuery = ref('')
const statusFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const currentPage = ref(1)
const pageSize = 25

const isDetailOpen = ref(false)
const selectedSale = ref<any>(null)

const columns = computed(() => [
  { key: 'invoice_number', label: t('dashboard.col_invoice', 'Invoice #'), sortable: true },
  { key: 'channel', label: t('sales.col_channel', 'Channel') },
  { key: 'total', label: t('fields.total', 'Total ($)'), sortable: true, align: 'right' as const },
  { key: 'sale_status', label: t('common.status', 'Status') },
  { key: 'payments', label: t('sales.col_payment', 'Payment') },
  { key: 'created_at', label: t('fields.date', 'Date / Time'), sortable: true },
  { key: 'actions', label: t('common.actions', 'Actions'), align: 'right' as const },
])

function localizeStatus(status?: string): string {
  const s = (status || 'COMPLETED').toUpperCase()
  if (s === 'COMPLETED') return t('status.completed', 'Completed')
  if (s === 'CANCELLED') return t('status.cancelled', 'Cancelled')
  if (s === 'DRAFT') return t('status.draft', 'Draft')
  if (s === 'REFUNDED' || s === 'RETURNED' || s === 'PARTIALLY_REFUNDED') return t('status.refunded', 'Refunded')
  return s
}

const totalSalesRevenue = computed(() =>
  filteredSales.value.reduce((sum, s) => sum + Number(s.total || 0), 0).toFixed(2),
)

const completedSalesCount = computed(() =>
  filteredSales.value.filter(s => (s.sale_status || s.status || 'COMPLETED') === 'COMPLETED').length,
)

function isOnlineOrder(sale: any): boolean {
  return String(sale?.notes || '').includes('[ONLINE STORE]')
}

const filteredSales = computed(() => {
  let list = sales.value
  if (channelFilter.value === 'ONLINE') {
    list = list.filter(s => isOnlineOrder(s))
  } else if (channelFilter.value === 'POS') {
    list = list.filter(s => !isOnlineOrder(s))
  }
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(s =>
      String(s.invoice_number || '').toLowerCase().includes(q) ||
      String(s.notes || '').toLowerCase().includes(q),
    )
  }
  return list
})

const paginatedSales = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSales.value.slice(start, start + pageSize)
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (channelFilter.value !== 'ALL') chips.push({ key: 'channel', label: t('sales.col_channel', 'Channel'), value: channelFilter.value })
  if (statusFilter.value) chips.push({ key: 'status', label: t('common.status', 'Status'), value: localizeStatus(statusFilter.value) })
  if (fromDate.value) chips.push({ key: 'from', label: t('sales.from', 'From'), value: fromDate.value })
  if (toDate.value) chips.push({ key: 'to', label: t('sales.to', 'To'), value: toDate.value })
  return chips
})

function removeChip(key: string) {
  if (key === 'channel') channelFilter.value = 'ALL'
  if (key === 'status') statusFilter.value = ''
  if (key === 'from') fromDate.value = ''
  if (key === 'to') toDate.value = ''
  currentPage.value = 1
  fetchSales()
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'COMPLETED': return 'green'
    case 'REFUNDED':
    case 'RETURNED':
    case 'CANCELLED': return 'red'
    case 'PARTIALLY_REFUNDED': return 'yellow'
    default: return 'default'
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

async function fetchSales() {
  loading.value = true
  try {
    const params: Record<string, any> = { limit: 100 }
    if (searchQuery.value.trim()) params.q = searchQuery.value.trim()
    if (statusFilter.value) params.status = statusFilter.value
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value
    const res: any = await saleApi.listSales(params)
    sales.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (err: any) {
    toast.add({
      title: 'Failed to load sales',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  searchQuery.value = ''
  statusFilter.value = ''
  fromDate.value = ''
  toDate.value = ''
  channelFilter.value = 'ALL'
  currentPage.value = 1
  fetchSales()
}

function openDetails(sale: any) {
  selectedSale.value = sale
  isDetailOpen.value = true
}

function exportCsv() {
  if (!filteredSales.value.length) return
  const headers = ['Invoice #', 'Channel', 'Total USD', 'Status', 'Date']
  const lines = filteredSales.value.map(r => [
    r.invoice_number,
    isOnlineOrder(r) ? 'ONLINE' : 'POS',
    Number(r.total || 0).toFixed(2),
    r.sale_status || 'COMPLETED',
    r.created_at || '',
  ].join(','))
  const csv = [headers.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
}

onMounted(() => {
  fetchSales()
})
</script>
