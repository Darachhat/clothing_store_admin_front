<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales History</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View POS transactions, online storefront orders, and receipt records</p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="channelFilter"
          class="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs text-gray-700 dark:text-gray-200"
        >
          <option value="ALL">All Channels</option>
          <option value="POS">POS In-Store</option>
          <option value="ONLINE">Online Store</option>
        </select>
        <AppButton
          to="/sales/returns"
          label="Returns"
          variant="secondary"
        />
      </div>
    </div>

    <!-- Search & Date Filters -->
    <AppCard>
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex-1 min-w-48">
          <label class="block text-xs font-medium text-gray-700 mb-1">Invoice #</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search invoice number (e.g. INV-2026...)"
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            @keyup.enter="fetchSales"
          />
        </div>
        <div class="w-40">
          <label class="block text-xs font-medium text-gray-700 mb-1">Status</label>
          <select v-model="statusFilter" class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" @change="fetchSales">
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="RETURNED">Returned</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
        <div class="w-40">
          <label class="block text-xs font-medium text-gray-700 mb-1">From Date</label>
          <input v-model="fromDate" type="date" class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" @change="fetchSales" />
        </div>
        <div class="w-40">
          <label class="block text-xs font-medium text-gray-700 mb-1">To Date</label>
          <input v-model="toDate" type="date" class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" @change="fetchSales" />
        </div>
        <AppButton variant="secondary" label="Filter" icon="i-heroicons-magnifying-glass" @click="fetchSales" />
        <AppButton variant="ghost" label="Reset" @click="resetFilters" />
      </div>
    </AppCard>

    <!-- Sales Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="filteredSales"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-receipt-percent', label: 'No sales found' }"
      >
        <template #cell-invoice_number="{ row }">
          <span class="font-mono font-medium text-primary-600 dark:text-primary-400">
            {{ row.invoice_number }}
          </span>
        </template>

        <template #cell-channel="{ row }">
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-xs font-medium"
            :class="isOnlineOrder(row) ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'"
          >
            <UIcon :name="isOnlineOrder(row) ? 'i-heroicons-globe-alt' : 'i-heroicons-building-storefront'" class="w-3.5 h-3.5" />
            <span>{{ isOnlineOrder(row) ? 'Online Store' : 'POS' }}</span>
          </span>
        </template>

        <template #cell-total="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            ${{ Number(row.total || 0).toFixed(2) }}
          </span>
        </template>

        <template #cell-sale_status="{ row }">
          <AppBadge
            :color="getStatusColor(row.sale_status)"
            :label="row.sale_status"
            size="sm"
          />
        </template>

        <template #cell-payments="{ row }">
          <div class="flex gap-1 flex-wrap">
            <AppBadge
              v-for="p in row.payments"
              :key="p.id"
              variant="default" 
              size="sm"
            >
              {{ p.payment_method }}: ${{ Number(p.amount).toFixed(2) }}
            </AppBadge>
          </div>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div style="display:flex;gap:4px;">
            <AppButton
              size="sm"
              variant="ghost"
              label="View"
              :to="`/sales/${row.id}`"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Sale Detail Modal -->
    <AppModal v-model="isDetailOpen">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold">Sale #{{ selectedSale.invoice_number }}</h3>
              <p class="text-xs text-gray-500">{{ formatDate(selectedSale.created_at) }}</p>
            </div>
            <AppBadge :color="getStatusColor(selectedSale.sale_status)" :label="selectedSale.sale_status" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Items List -->
          <div>
            <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Items</h4>
            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="item in selectedSale.items"
                :key="item.id"
                class="py-2 flex items-center justify-between text-sm"
              >
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    Variant #{{ item.variant_id?.slice(0, 8) }}
                  </p>
                  <p class="text-xs text-gray-500">Qty: {{ item.quantity }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
                </div>
                <span class="font-semibold">${{ Number(item.subtotal).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Summary Breakdown -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1 text-sm">
            <div class="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>${{ Number(selectedSale.subtotal).toFixed(2) }}</span>
            </div>
            <div v-if="Number(selectedSale.discount_amount) > 0" class="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${{ Number(selectedSale.discount_amount).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-base text-gray-900 dark:text-white pt-1">
              <span>Total</span>
              <span>${{ Number(selectedSale.total).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <AppButton variant="ghost" @click="isDetailOpen = false">Close</AppButton>
          </div>
        </template>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth'],
})

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const sales = ref<any[]>([])
const channelFilter = ref<'ALL' | 'POS' | 'ONLINE'>('ALL')
const searchQuery = ref('')
const statusFilter = ref('')
const fromDate = ref('')
const toDate = ref('')
const isDetailOpen = ref(false)
const selectedSale = ref<any>(null)

const columns = [
  { key: 'invoice_number', label: 'Invoice #', sortable: true },
  { key: 'channel', label: 'Channel' },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'sale_status', label: 'Status' },
  { key: 'payments', label: 'Payment' },
  { key: 'created_at', label: 'Date/Time', sortable: true },
  { key: 'actions', label: 'Actions' },
]

function isOnlineOrder(sale: any): boolean {
  return String(sale?.notes || '').includes('[ONLINE STORE]')
}

const filteredSales = computed(() => {
  if (channelFilter.value === 'ONLINE') {
    return sales.value.filter(s => isOnlineOrder(s))
  }
  if (channelFilter.value === 'POS') {
    return sales.value.filter(s => !isOnlineOrder(s))
  }
  return sales.value
})

function getStatusColor(status?: string) {
  switch (status) {
    case 'COMPLETED': return 'green'
    case 'REFUNDED': return 'red'
    case 'PARTIALLY_REFUNDED': return 'amber'
    default: return 'gray'
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
    sales.value = res || []
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
  fetchSales()
}

function openDetails(sale: any) {
  selectedSale.value = sale
  isDetailOpen.value = true
}

onMounted(() => {
  fetchSales()
})
</script>
