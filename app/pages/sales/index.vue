<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales History</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View transactions and receipt records</p>
      </div>
      <AppButton
        to="/pos"
        label="Open POS"
        variant="primary"
        target="_blank"
      />
    </div>

    <!-- Sales Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="sales"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-receipt-percent', label: 'No sales found' }"
      >
        <template #cell-invoice_number="{ row }">
          <span class="font-mono font-medium text-primary-600 dark:text-primary-400">
            {{ row.invoice_number }}
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
const isDetailOpen = ref(false)
const selectedSale = ref<any>(null)

const columns = [
  { key: 'invoice_number', label: 'Invoice #', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'sale_status', label: 'Status' },
  { key: 'payments', label: 'Payment' },
  { key: 'created_at', label: 'Date/Time', sortable: true },
  { key: 'actions', label: 'Actions' },
]

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
    const res: any = await saleApi.listSales({ limit: 50 })
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

function openDetails(sale: any) {
  selectedSale.value = sale
  isDetailOpen.value = true
}

onMounted(() => {
  fetchSales()
})
</script>
