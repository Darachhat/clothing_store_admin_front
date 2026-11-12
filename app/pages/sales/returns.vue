<template>
  <div class="page-root">
    <AppPageHeader
      title="Sales Returns"
      description="View processed customer refunds and create full or partial sales returns with automatic restock."
      :breadcrumbs="[
        { label: 'Store', to: '/sales' },
        { label: 'Sales Orders', to: '/sales' },
        { label: 'Sales Returns' },
      ]"
      primary-label="Create Return"
      primary-icon="i-heroicons-plus"
      @primary-click="openReturnModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-shopping-bag" label="Sales Orders" to="/sales" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchReturns" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search returns by return #, reason, or type..."
      :chips="activeChips"
      :shown-count="filteredReturns.length"
      :total-count="returns.length"
      count-label="returns"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">From:</span>
        <AppInput v-model="fromDate" type="date" style="width: 140px;" @change="fetchReturns" />
      </div>
      <div class="flex items-center gap-1.5">
        <span class="text-xs text-gray-500">To:</span>
        <AppInput v-model="toDate" type="date" style="width: 140px;" @change="fetchReturns" />
      </div>
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredReturns"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-arrow-uturn-left',
          label: 'No sales returns found',
          description: 'Processed customer returns and refunds will appear here.',
        }"
      >
        <template #cell-return_number="{ row }">
          <span class="mono font-semibold text-gray-900">{{ row.return_number }}</span>
        </template>

        <template #cell-return_type="{ row }">
          <AppBadge :color="row.return_type === 'FULL' ? 'red' : 'yellow'" size="sm">
            {{ row.return_type }}
          </AppBadge>
        </template>

        <template #cell-total_refund="{ row }">
          <span class="mono font-medium text-red-700">-${{ Number(row.total_refund || 0).toFixed(2) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'COMPLETED' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'COMPLETED' }}
          </AppBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Return Modal -->
    <AppModal
      v-model="showReturnModal"
      title="Create Sales Return"
      description="Select a completed sale invoice, specify returned item quantities, and choose whether to restock."
      size="md"
    >
      <form class="form-grid" @submit.prevent="submitReturn">
        <div class="form-field">
          <label class="field-label">Original Sale Transaction <span class="required">*</span></label>
          <AppSelect
            v-model="returnForm.sale_id"
            :options="salesList.map(s => ({ label: `${s.invoice_number || s.sale_number} \u2013 ${Number(s.total ?? s.total_amount ?? 0).toFixed(2)} (${new Date(s.created_at).toLocaleDateString()})`, value: s.id }))"
            placeholder="Select completed sale..."
            required
            @change="onSelectSale"
          />
        </div>

        <div v-if="selectedSale?.items?.length" class="space-y-2">
          <label class="field-label">Return Items &amp; Quantities <span class="required">*</span></label>
          <div
            v-for="item in returnForm.items"
            :key="item.sale_item_id"
            class="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-gray-200 bg-gray-50"
          >
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-gray-900 truncate">{{ item.label }}</p>
              <p class="text-[11px] text-gray-500">Purchased: {{ item.max_qty }} × ${{ Number(item.unit_price).toFixed(2) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
                <input v-model="item.restock" type="checkbox" class="rounded" />
                Restock
              </label>
              <AppInput
                v-model.number="item.quantity_returned"
                type="number"
                min="0"
                :max="item.max_qty"
                class="w-20 text-right mono"
              />
            </div>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Return Reason <span class="required">*</span></label>
          <AppInput
            v-model="returnForm.reason"
            type="text"
            required
            placeholder="e.g. Wrong size, defective item, customer exchange..."
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showReturnModal = false" />
          <AppButton type="submit" variant="primary" label="Process Return" :loading="submittingReturn" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Sales Returns — Clothing Store Admin' })

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const returns = ref<any[]>([])
const searchQuery = ref('')
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
  { key: 'return_number', label: 'Return #', sortable: true },
  { key: 'return_type', label: 'Type', sortable: true },
  { key: 'reason', label: 'Reason' },
  { key: 'total_refund', label: 'Refund Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'created_at', label: 'Date', sortable: true },
]

const filteredReturns = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return returns.value
  return returns.value.filter(r =>
    [r.return_number, r.reason, r.return_type].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (fromDate.value) chips.push({ key: 'from', label: 'From', value: fromDate.value })
  if (toDate.value) chips.push({ key: 'to', label: 'To', value: toDate.value })
  return chips
})

function removeChip(key: string) {
  if (key === 'from') fromDate.value = ''
  if (key === 'to') toDate.value = ''
  fetchReturns()
}

function resetFilters() {
  searchQuery.value = ''
  fromDate.value = ''
  toDate.value = ''
  fetchReturns()
}

async function openReturnModal() {
  returnForm.sale_id = ''
  returnForm.reason = ''
  returnForm.items = []
  selectedSale.value = null
  showReturnModal.value = true
  try {
    const data = await saleApi.listSales({ limit: 50 }) as any[]
    salesList.value = (data || []).filter((s: any) => (s.sale_status || s.status) === 'COMPLETED')
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
    returns.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchReturns)
</script>
