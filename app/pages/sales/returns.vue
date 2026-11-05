<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Returns</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View processed refunds and return requests</p>
      </div>
      <div class="flex gap-2">
        <AppButton label="Create Return" variant="primary" icon="i-heroicons-plus" @click="openReturnModal" />
        <AppButton to="/pos" label="Open POS" variant="default" target="_blank" />
      </div>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex-1 min-w-48">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
          <input v-model="fromDate" type="date" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" @change="fetchReturns" />
        </div>
        <div class="flex-1 min-w-48">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
          <input v-model="toDate" type="date" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" @change="fetchReturns" />
        </div>
        <AppButton variant="ghost" @click="fetchReturns">Refresh</AppButton>
      </div>
    </AppCard>

    <!-- Returns Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="returns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-arrow-uturn-left', label: 'No returns found' }"
      >
        <template #cell-return_number="{ row }">
          <span class="font-mono font-medium text-amber-600 dark:text-amber-400">{{ row.return_number }}</span>
        </template>

        <template #cell-return_type="{ row }">
          <AppBadge :color="row.return_type === 'FULL' ? 'red' : 'amber'" :label="row.return_type" size="sm" variant="subtle" />
        </template>

        <template #cell-total_refund="{ row }">
          <span class="font-bold text-red-600 dark:text-red-400">-${{ Number(row.total_refund).toFixed(2) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="row.status === 'COMPLETED' ? 'emerald' : 'gray'" :label="row.status" size="sm" variant="subtle" />
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Return Modal -->
    <AppModal v-model="showReturnModal" :ui="{ width: 'sm:max-w-xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Create Sales Return</h3>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showReturnModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitReturn">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Original Sale Transaction *</label>
            <select v-model="returnForm.sale_id" required class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" @change="onSelectSale">
              <option value="" disabled>Select completed sale...</option>
              <option v-for="s in salesList" :key="s.id" :value="s.id">
                {{ s.sale_number }} — ${{ Number(s.total_amount).toFixed(2) }} ({{ new Date(s.created_at).toLocaleDateString() }})
              </option>
            </select>
          </div>

          <div v-if="selectedSale?.items?.length" class="space-y-2">
            <label class="block text-xs font-medium text-gray-700">Return Items & Quantities *</label>
            <div v-for="(item, idx) in returnForm.items" :key="item.sale_item_id" class="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-900 truncate">{{ item.label }}</p>
                <p class="text-[11px] text-gray-500">Purchased: {{ item.max_qty }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-1 text-xs text-gray-600">
                  <input v-model="item.restock" type="checkbox" class="rounded" />
                  Restock
                </label>
                <input
                  v-model.number="item.quantity_returned"
                  type="number"
                  min="0"
                  :max="item.max_qty"
                  class="w-20 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-right"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Return Reason *</label>
            <input
              v-model="returnForm.reason"
              type="text"
              required
              placeholder="e.g. Wrong size, defective item, customer exchange..."
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showReturnModal = false" />
            <AppButton type="submit" variant="primary" label="Process Return" :loading="submittingReturn" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const returns = ref<any[]>([])
const fromDate = ref('')
const toDate = ref('')

const showReturnModal = ref(false)
const submittingReturn = ref(false)
const salesList = ref<any[]>([])
const selectedSale = ref<any>(null)
const returnForm = reactive({
  sale_id: '',
  reason: '',
  items: [] as Array<{ sale_item_id: string; label: string; max_qty: number; unit_price: number; quantity_returned: number; restock: boolean }>,
})

const columns = [
  { key: 'return_number', label: 'Return #' },
  { key: 'return_type', label: 'Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'total_refund', label: 'Refund' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
]

async function openReturnModal() {
  returnForm.sale_id = ''
  returnForm.reason = ''
  returnForm.items = []
  selectedSale.value = null
  showReturnModal.value = true
  try {
    const data = await saleApi.listSales({ limit: 50 }) as any[]
    salesList.value = (data || []).filter((s: any) => s.status === 'COMPLETED')
  } catch (err: any) {
    toast.add({ title: 'Error loading sales', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function onSelectSale() {
  if (!returnForm.sale_id) return
  try {
    const detail = await saleApi.getSale(returnForm.sale_id) as any
    selectedSale.value = detail
    returnForm.items = (detail.items || []).map((it: any) => ({
      sale_item_id: it.id,
      label: it.product_name || it.sku || `Item #${String(it.id).slice(0, 8)}`,
      max_qty: it.quantity,
      unit_price: Number(it.unit_price || 0),
      quantity_returned: it.quantity,
      restock: true,
    }))
  } catch (err: any) {
    toast.add({ title: 'Error loading sale items', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function submitReturn() {
  const validItems = returnForm.items.filter(i => i.quantity_returned > 0)
  if (!returnForm.sale_id || validItems.length === 0) {
    toast.add({ title: 'Validation Error', description: 'Select at least one item with quantity > 0 to return', color: 'amber' })
    return
  }
  const isFull = returnForm.items.every(i => i.quantity_returned === i.max_qty)
  submittingReturn.value = true
  try {
    await saleApi.createReturn({
      sale_id: returnForm.sale_id,
      return_type: isFull ? 'FULL' : 'PARTIAL',
      reason: returnForm.reason,
      items: validItems.map(i => ({
        sale_item_id: i.sale_item_id,
        quantity_returned: i.quantity_returned,
        restock: i.restock,
      })),
    })
    toast.add({ title: 'Return Processed', description: 'Refund and inventory update completed', color: 'green' })
    showReturnModal.value = false
    await fetchReturns()
  } catch (err: any) {
    toast.add({ title: 'Return Failed', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    submittingReturn.value = false
  }
}

async function fetchReturns() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value
    const data = await saleApi.listReturns(params) as any[]
    returns.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchReturns)
</script>
