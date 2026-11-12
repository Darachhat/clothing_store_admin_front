<template>
  <div class="page-root">
    <AppPageHeader
      title="Purchase Orders"
      description="Manage procurement, purchase orders, approvals, and warehouse goods receipts."
      :breadcrumbs="[
        { label: 'Purchasing', to: '/purchases' },
        { label: 'Purchase Orders' },
      ]"
      primary-label="New Purchase Order"
      primary-icon="i-heroicons-plus"
      primary-to="/purchases/new"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-plus" label="Quick Create PO" @click="openCreateModal" />
        <AppButton size="sm" variant="default" icon="i-heroicons-building-office-2" label="Suppliers" to="/suppliers" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchPurchases" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search purchase orders by PO number, supplier, or notes..."
      :chips="activeChips"
      :shown-count="paginatedPurchases.length"
      :total-count="filteredPurchases.length"
      :summary-items="[
        { label: 'Total Cost', value: `$${totalPoValue}` },
        { label: 'Purchase Orders', value: filteredPurchases.length },
        { label: 'Received', value: receivedPoCount },
      ]"
      count-label="purchase orders"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="supplierFilter"
        :options="supplierFilterOptions"
        style="min-width: 170px;"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Ordered', value: 'ORDERED' },
          { label: 'Partial', value: 'PARTIAL' },
          { label: 'Received', value: 'RECEIVED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]"
        style="min-width: 150px;"
        @change="fetchPurchases"
      />
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedPurchases"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-clipboard-document-list',
          label: 'No purchase orders found',
          description: 'Create a purchase order to track inbound supplier stock.',
        }"
      >
        <template #cell-po_number="{ row }">
          <NuxtLink :to="`/purchases/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
            {{ row.po_number }}
          </NuxtLink>
        </template>

        <template #cell-supplier_display="{ row }">
          <span class="font-medium text-gray-900">{{ row.supplier_display }}</span>
        </template>

        <template #cell-total_display="{ row }">
          <span class="mono font-medium">${{ Number(row.total_cost ?? row.total ?? 0).toFixed(2) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="statusColor(row.status_code || row.status)" size="sm">
            {{ row.status_code || row.status }}
          </AppBadge>
        </template>

        <template #cell-expected_date="{ row }">
          <span class="text-xs text-gray-500">
            {{ (row.expected_date || row.expected_at) ? new Date(row.expected_date || row.expected_at).toLocaleDateString() : '—' }}
          </span>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              v-if="(row.status_code || row.status) === 'DRAFT'"
              size="xs"
              variant="default"
              label="Approve"
              @click="approveOrder(row)"
            />
            <AppButton
              v-if="['ORDERED', 'PARTIAL'].includes(row.status_code || row.status)"
              size="xs"
              variant="primary"
              label="Receive Goods"
              @click="openReceiveModal(row)"
            />
            <AppButton
              size="xs"
              variant="ghost"
              label="Quick View"
              @click="openDetailsModal(row)"
            />
            <AppButton
              size="xs"
              variant="ghost"
              label="Details"
              :to="`/purchases/${row.id}`"
            />
          </div>
        </template>

        <template v-if="filteredPurchases.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredPurchases.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Purchase Order Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Create Purchase Order"
      description="Select a supplier, receiving warehouse, and ordered SKU quantities."
      size="lg"
    >
      <form class="form-grid" @submit.prevent="submitCreate">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Supplier <span class="required">*</span></label>
            <select v-model="form.supplier_id" required class="field-input">
              <option value="" disabled>Select supplier...</option>
              <option v-for="s in suppliersList" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Receiving Warehouse</label>
            <select v-model="form.warehouse_id" class="field-input">
              <option value="">Default Warehouse</option>
              <option v-for="w in warehousesList" :key="w.id" :value="w.id">
                {{ w.branchName ? `${w.branchName} — ${w.name}` : w.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Expected Delivery Date</label>
            <input v-model="form.expected_date" type="date" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Notes</label>
            <input v-model="form.notes" type="text" placeholder="Optional PO reference or payment terms..." class="field-input" />
          </div>
        </div>

        <!-- Line Items -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="field-label">Order Items <span class="required">*</span></label>
            <AppButton size="xs" variant="default" icon="i-heroicons-plus" label="Add Item" @click="addLine" />
          </div>

          <div v-for="(line, i) in form.items" :key="i" class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2.5 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-gray-200 bg-gray-50 sm:bg-transparent">
            <select v-model="line.variant_id" required class="sm:col-span-6 field-input" @change="onSelectVariant(line)">
              <option value="" disabled>Select Variant (SKU)...</option>
              <option v-for="v in variantsList" :key="v.id" :value="v.id">
                {{ v.sku }} — {{ v.product?.name || v.product_name || 'Product' }} (Cost: ${{ v.cost_price }})
              </option>
            </select>
            <div class="grid grid-cols-2 sm:contents gap-2">
              <input
                v-model.number="line.quantity_ordered"
                type="number"
                min="1"
                placeholder="Qty"
                required
                class="sm:col-span-2 field-input text-right mono"
              />
              <input
                v-model.number="line.unit_cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="Unit Cost"
                required
                class="sm:col-span-3 field-input text-right mono"
              />
            </div>
            <div class="sm:col-span-1 flex justify-end">
              <AppButton
                v-if="form.items.length > 1"
                size="xs"
                variant="danger"
                icon="i-heroicons-trash"
                @click="form.items.splice(i, 1)"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-gray-200">
          <span class="text-xs text-gray-500">Estimated Order Total:</span>
          <strong class="mono text-base text-gray-900">${{ formTotal.toFixed(2) }}</strong>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showCreateModal = false" />
          <AppButton type="submit" variant="primary" label="Create Order" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <!-- Receive Goods Modal -->
    <AppModal
      v-model="showReceiveModal"
      :title="`Receive Goods: ${selectedOrder?.po_number || ''}`"
      description="Enter the actual quantities received for each line item. Receiving goods will automatically update warehouse stock levels."
      size="lg"
    >
      <form class="form-grid" @submit.prevent="handleReceiveGoods">
        <div class="space-y-2.5">
          <div
            v-for="item in receiveItems"
            :key="item.purchase_item_id || item.variant_id"
            class="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200"
          >
            <div>
              <p class="font-medium text-sm text-gray-900 mono">
                SKU: {{ getVariantSku(item.variant_id) }}
              </p>
              <p class="text-xs text-gray-500">
                Ordered: {{ item.quantity_ordered }} | Previously Received: {{ item.quantity_received }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-xs font-medium text-gray-700">Receive Now:</label>
              <input
                v-model.number="item.receive_now"
                type="number"
                min="0"
                :max="Math.max(0, item.quantity_ordered - item.quantity_received)"
                class="w-24 field-input text-right mono"
              />
            </div>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Receipt Notes</label>
          <input
            v-model="receiveNotes"
            type="text"
            placeholder="e.g. Received in good condition, batch #1"
            class="field-input"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showReceiveModal = false" />
          <AppButton type="submit" variant="primary" label="Complete Receipt" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <!-- Details Modal -->
    <AppModal
      v-model="showDetailsModal"
      :title="`PO Details: ${selectedOrder?.po_number || ''}`"
      size="md"
    >
      <div v-if="selectedOrder" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Status:</span>
            <AppBadge :color="statusColor(selectedOrder.status_code || selectedOrder.status)" :label="selectedOrder.status_code || selectedOrder.status" size="sm" class="ml-2" />
          </div>
          <div>
            <span class="text-gray-500">Total:</span>
            <span class="font-medium ml-2 mono">${{ Number(selectedOrder.total || 0).toFixed(2) }}</span>
          </div>
        </div>

        <div class="border-t border-gray-200 pt-3">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Order Items</h4>
          <div class="space-y-2">
            <div
              v-for="item in selectedOrder.items"
              :key="item.id || item.variant_id"
              class="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200 text-xs"
            >
              <div>
                <span class="font-mono font-medium">{{ getVariantSku(item.variant_id) }}</span>
                <span class="text-gray-500 ml-2">Ordered: {{ item.quantity_ordered }} | Received: {{ item.quantity_received }}</span>
              </div>
              <div class="font-medium mono">
                ${{ Number(item.subtotal || (Number(item.quantity_ordered) * Number(item.unit_cost))).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <AppButton variant="ghost" label="Close" @click="showDetailsModal = false" />
          <AppButton variant="primary" label="Open Full Page" :to="`/purchases/${selectedOrder.id}`" />
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Purchase Orders — Clothing Store Admin' })

const purchaseApi = usePurchaseApi()
const supplierApi = useSupplierApi()
const branchApi = useBranchApi()
const variantApi = useVariantApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const purchases = ref<any[]>([])
const suppliersList = ref<any[]>([])
const warehousesList = ref<any[]>([])
const variantsList = ref<any[]>([])

const searchQuery = ref('')
const supplierFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 20

const showCreateModal = ref(false)
const showReceiveModal = ref(false)
const showDetailsModal = ref(false)
const selectedOrder = ref<any>(null)
const receiveItems = ref<any[]>([])
const receiveNotes = ref('')

const form = ref({
  supplier_id: '',
  warehouse_id: '',
  expected_date: '',
  notes: '',
  items: [{ variant_id: '', quantity_ordered: 10, unit_cost: 5.0 }],
})

const columns = [
  { key: 'po_number', label: 'PO #', sortable: true },
  { key: 'supplier_display', label: 'Supplier', sortable: true },
  { key: 'total_display', label: 'Total Cost', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'expected_date', label: 'Expected Date', sortable: true },
  { key: 'created_at', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const supplierMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const s of suppliersList.value) {
    if (s?.id) m[s.id] = s.name
  }
  return m
})

const supplierFilterOptions = computed(() => [
  { label: 'All Suppliers', value: '' },
  ...suppliersList.value.map(s => ({ label: s.name, value: s.id })),
])

const enrichedPurchases = computed(() =>
  purchases.value.map(p => ({
    ...p,
    supplier_display: p.supplier?.name || p.supplier_name || supplierMap.value[p.supplier_id] || 'Supplier',
    total_display: Number(p.total_cost ?? p.total ?? 0),
  })),
)

const filteredPurchases = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return enrichedPurchases.value.filter((p) => {
    if (supplierFilter.value && p.supplier_id !== supplierFilter.value) return false
    if (statusFilter.value && (p.status_code || p.status) !== statusFilter.value) return false
    if (q) {
      const hay = [p.po_number, p.supplier_display, p.notes].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const paginatedPurchases = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPurchases.value.slice(start, start + pageSize)
})

const totalPoValue = computed(() =>
  filteredPurchases.value.reduce((sum, p) => sum + Number(p.total_display || 0), 0).toFixed(2),
)

const receivedPoCount = computed(() =>
  filteredPurchases.value.filter(p => (p.status_code || p.status) === 'RECEIVED').length,
)

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (supplierFilter.value) {
    chips.push({ key: 'supplier', label: 'Supplier', value: supplierMap.value[supplierFilter.value] || supplierFilter.value })
  }
  if (statusFilter.value) {
    chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  }
  return chips
})

function removeChip(key: string) {
  if (key === 'supplier') supplierFilter.value = ''
  if (key === 'status') {
    statusFilter.value = ''
    fetchPurchases()
  }
  currentPage.value = 1
}

function resetFilters() {
  searchQuery.value = ''
  supplierFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchPurchases()
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'default',
    ORDERED: 'blue',
    PARTIAL: 'yellow',
    RECEIVED: 'green',
    CANCELLED: 'red',
  }
  return map[status] || 'default'
}

function getVariantSku(variantId: string) {
  const found = variantsList.value.find(v => v.id === variantId)
  return found ? found.sku : (variantId ? variantId.slice(0, 8) : '—')
}

const formTotal = computed(() =>
  form.value.items.reduce((sum, item) => sum + (Number(item.quantity_ordered) || 0) * (Number(item.unit_cost) || 0), 0),
)

function addLine() {
  form.value.items.push({ variant_id: '', quantity_ordered: 10, unit_cost: 5.0 })
}

function onSelectVariant(line: { variant_id: string; quantity_ordered: number; unit_cost: number }) {
  const found = variantsList.value.find((v: any) => v.id === line.variant_id)
  if (found && (found.cost_price_override || found.cost_price)) {
    line.unit_cost = Number(found.cost_price_override || found.cost_price)
  }
}

function openCreateModal() {
  form.value = {
    supplier_id: suppliersList.value[0]?.id || '',
    warehouse_id: warehousesList.value[0]?.id || '',
    expected_date: '',
    notes: '',
    items: [{ variant_id: '', quantity_ordered: 10, unit_cost: 5.0 }],
  }
  showCreateModal.value = true
}

function openReceiveModal(order: any) {
  selectedOrder.value = order
  receiveNotes.value = ''
  receiveItems.value = (order.items || []).map((it: any) => ({
    purchase_item_id: it.id,
    variant_id: it.variant_id,
    quantity_ordered: Number(it.quantity_ordered || 0),
    quantity_received: Number(it.quantity_received || 0),
    unit_cost: Number(it.unit_cost || 0),
    receive_now: Math.max(0, Number(it.quantity_ordered || 0) - Number(it.quantity_received || 0)),
  }))
  showReceiveModal.value = true
}

function openDetailsModal(order: any) {
  selectedOrder.value = order
  showDetailsModal.value = true
}

async function approveOrder(order: any) {
  try {
    await purchaseApi.approveOrder(order.id)
    toast.add({ title: 'PO Approved', description: `Order ${order.po_number} is now ORDERED`, color: 'green' })
    await fetchPurchases()
  } catch (err: any) {
    toast.add({ title: 'Approval Failed', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function handleReceiveGoods() {
  if (!selectedOrder.value) return
  saving.value = true
  try {
    const itemsToReceive = receiveItems.value
      .filter(i => Number(i.receive_now) > 0)
      .map(i => ({
        purchase_item_id: i.purchase_item_id,
        variant_id: i.variant_id,
        quantity_received: Number(i.receive_now),
        unit_cost: i.unit_cost,
      }))
    await purchaseApi.createReceipt({
      purchase_order_id: selectedOrder.value.id,
      warehouse_id: selectedOrder.value.warehouse_id || warehousesList.value[0]?.id || undefined,
      notes: receiveNotes.value || undefined,
      items: itemsToReceive,
    })
    toast.add({ title: 'Receipt Recorded', description: 'Goods received and warehouse stock updated', color: 'green' })
    showReceiveModal.value = false
    await fetchPurchases()
  } catch (err: any) {
    toast.add({ title: 'Receipt Failed', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function fetchLookups() {
  try {
    const [sList, bList, vList] = await Promise.all([
      supplierApi.listSuppliers().catch(() => []),
      branchApi.listBranches().catch(() => []),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    suppliersList.value = Array.isArray(sList) ? sList : ((sList as any)?.items || [])
    variantsList.value = Array.isArray(vList) ? vList : ((vList as any)?.items || [])
    const allWh: any[] = []
    for (const b of (bList as any[]) || []) {
      if (b.warehouses?.length) {
        for (const w of b.warehouses) allWh.push({ ...w, branchName: b.name })
      } else {
        try {
          const whs = await branchApi.listWarehouses(b.id) as any[]
          for (const w of whs || []) allWh.push({ ...w, branchName: b.name })
        } catch {}
      }
    }
    warehousesList.value = allWh
  } catch {}
}

async function fetchPurchases() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (statusFilter.value) params.status = statusFilter.value
    const data = await purchaseApi.listOrders(params) as any
    purchases.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  saving.value = true
  try {
    await purchaseApi.createOrder({
      supplier_id: form.value.supplier_id,
      warehouse_id: form.value.warehouse_id || null,
      expected_date: form.value.expected_date || null,
      notes: form.value.notes || null,
      items: form.value.items.map(i => ({
        variant_id: i.variant_id,
        quantity_ordered: Number(i.quantity_ordered),
        unit_cost: Number(i.unit_cost),
      })),
    })
    toast.add({ title: 'PO Created', description: 'Purchase order created successfully', color: 'green' })
    showCreateModal.value = false
    await fetchPurchases()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchLookups()
  await fetchPurchases()
})
</script>
