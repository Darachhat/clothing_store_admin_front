<template>
  <div class="page-root">
    <AppPageHeader
      title="Sales History"
      description="View POS transactions, online storefront orders, and receipt records."
      :breadcrumbs="[
        { label: 'Store', to: '/sales' },
        { label: 'Sales Orders' },
      ]"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-uturn-left" label="Returns" to="/sales/returns" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-down-tray" label="Export CSV" @click="exportCsv" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchSales" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search invoice number (e.g. INV-2026...)..."
      :chips="activeChips"
      :shown-count="paginatedSales.length"
      :total-count="filteredSales.length"
      count-label="sales"
      @submit="fetchSales"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="channelFilter"
        :options="[
          { label: 'All Channels', value: 'ALL' },
          { label: 'POS In-Store', value: 'POS' },
          { label: 'Online Store', value: 'ONLINE' },
        ]"
        style="min-width: 145px;"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Returned', value: 'RETURNED' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Draft', value: 'DRAFT' },
        ]"
        style="min-width: 145px;"
        @change="fetchSales"
      />
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">From:</span>
        <input v-model="fromDate" type="date" class="field-input" style="width: 140px;" @change="fetchSales" />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">To:</span>
        <input v-model="toDate" type="date" class="field-input" style="width: 140px;" @change="fetchSales" />
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
          label: 'No sales found',
          description: 'Completed POS sales and online storefront orders will appear here.',
        }"
      >
        <template #cell-invoice_number="{ row }">
          <NuxtLink :to="`/sales/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
            {{ row.invoice_number }}
          </NuxtLink>
        </template>

        <template #cell-channel="{ row }">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 text-xs font-medium"
            :class="isOnlineOrder(row) ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'"
          >
            <UIcon :name="isOnlineOrder(row) ? 'i-heroicons-globe-alt' : 'i-heroicons-building-storefront'" class="w-3.5 h-3.5" />
            <span>{{ isOnlineOrder(row) ? 'Online Store' : 'POS' }}</span>
          </span>
        </template>

        <template #cell-total="{ row }">
          <span class="mono font-semibold text-gray-900">
            ${{ Number(row.total || 0).toFixed(2) }}
          </span>
        </template>

        <template #cell-sale_status="{ row }">
          <AppBadge
            :color="getStatusColor(row.sale_status || row.status)"
            :label="row.sale_status || row.status || 'COMPLETED'"
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
            <span v-else class="text-xs text-gray-400">—</span>
          </div>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              size="xs"
              variant="ghost"
              label="Preview"
              @click="openDetails(row)"
            />
            <AppButton
              size="xs"
              variant="default"
              label="View"
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
      :title="selectedSale ? `Sale #${selectedSale.invoice_number}` : 'Sale Detail'"
      :description="selectedSale ? formatDate(selectedSale.created_at) : ''"
      size="md"
    >
      <div v-if="selectedSale" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-500">Status</span>
          <AppBadge :color="getStatusColor(selectedSale.sale_status)" :label="selectedSale.sale_status" size="sm" />
        </div>

        <!-- Items List -->
        <div>
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</h4>
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
                <p class="text-xs text-gray-500">Qty: {{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
              </div>
              <span class="font-semibold mono">${{ Number(item.subtotal).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <!-- Summary Breakdown -->
        <div class="border-t border-gray-200 pt-3 space-y-1 text-sm">
          <div class="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span class="mono">${{ Number(selectedSale.subtotal || 0).toFixed(2) }}</span>
          </div>
          <div v-if="Number(selectedSale.discount_amount) > 0" class="flex justify-between text-green-600">
            <span>Discount</span>
            <span class="mono">-${{ Number(selectedSale.discount_amount).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold text-base text-gray-900 pt-1">
            <span>Total</span>
            <span class="mono">${{ Number(selectedSale.total || 0).toFixed(2) }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <AppButton variant="ghost" @click="isDetailOpen = false">Close</AppButton>
          <AppButton variant="primary" :to="`/sales/${selectedSale.id}`">Full Invoice</AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({
  middleware: ['auth'],
})
useHead({ title: 'Sales History — Clothing Store Admin' })

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

const columns = [
  { key: 'invoice_number', label: 'Invoice #', sortable: true },
  { key: 'channel', label: 'Channel' },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'sale_status', label: 'Status' },
  { key: 'payments', label: 'Payment' },
  { key: 'created_at', label: 'Date/Time', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

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
  if (channelFilter.value !== 'ALL') chips.push({ key: 'channel', label: 'Channel', value: channelFilter.value })
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  if (fromDate.value) chips.push({ key: 'from', label: 'From', value: fromDate.value })
  if (toDate.value) chips.push({ key: 'to', label: 'To', value: toDate.value })
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
