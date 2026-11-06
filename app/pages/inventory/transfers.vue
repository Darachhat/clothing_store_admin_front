<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Transfers"
      description="Move inventory between warehouses and branches with approval, dispatch, and receiving workflows."
      :breadcrumbs="[
        { label: 'Inventory', to: '/inventory' },
        { label: 'Transfers' },
      ]"
      primary-label="New Transfer"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchTransfers" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search transfers by number, source/destination warehouse, or notes..."
      :chips="activeChips"
      :shown-count="filteredTransfers.length"
      :total-count="transfers.length"
      count-label="transfers"
      @remove-chip="statusFilter = ''"
      @clear-all="searchQuery = ''; statusFilter = ''"
    >
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'In Transit', value: 'IN_TRANSIT' },
          { label: 'Completed / Received', value: 'COMPLETED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ]"
        style="min-width: 170px;"
      />
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredTransfers"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-truck',
          label: 'No stock transfers found',
          description: 'Create a transfer to move inventory between store warehouses.',
        }"
      >
        <template #cell-transfer_number="{ row }">
          <span class="mono font-semibold text-gray-900">{{ row.transfer_number }}</span>
        </template>

        <template #cell-from_warehouse_display="{ row }">
          <span class="font-medium text-gray-800">{{ row.from_warehouse_display }}</span>
        </template>

        <template #cell-to_warehouse_display="{ row }">
          <span class="font-medium text-gray-800">{{ row.to_warehouse_display }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="statusColor(row.status_code || row.status)" size="sm">
            {{ row.status_code || row.status }}
          </AppBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-gray-500">{{ row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              v-if="['PENDING', 'DRAFT'].includes(row.status_code || row.status)"
              size="xs"
              variant="default"
              label="Approve"
              @click="approveTransfer(row.id)"
            />
            <AppButton
              v-if="['APPROVED', 'DRAFT'].includes(row.status_code || row.status)"
              size="xs"
              variant="primary"
              label="Dispatch"
              @click="dispatchTransfer(row.id)"
            />
            <AppButton
              v-if="['DISPATCHED', 'IN_TRANSIT'].includes(row.status_code || row.status)"
              size="xs"
              variant="primary"
              label="Receive"
              @click="receiveTransfer(row.id)"
            />
            <AppButton
              v-if="['PENDING', 'DRAFT', 'APPROVED'].includes(row.status_code || row.status)"
              size="xs"
              variant="danger"
              label="Cancel"
              @click="promptCancel(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Transfer Modal -->
    <AppModal
      v-model="showModal"
      title="Create Stock Transfer"
      description="Select source and destination warehouses and specify the SKUs to move."
      size="lg"
    >
      <form class="form-grid" @submit.prevent="handleCreate">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">From Warehouse <span class="required">*</span></label>
            <select v-model="form.from_warehouse_id" required class="field-input">
              <option value="" disabled>Select source</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">To Warehouse <span class="required">*</span></label>
            <select v-model="form.to_warehouse_id" required class="field-input">
              <option value="" disabled>Select destination</option>
              <option v-for="w in warehouses" :key="w.id" :value="w.id" :disabled="w.id === form.from_warehouse_id">
                {{ w.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="field-label">Items <span class="required">*</span></label>
            <AppButton size="xs" variant="default" icon="i-heroicons-plus" label="Add Item" @click="addItem" />
          </div>
          <div v-for="(item, idx) in form.items" :key="idx" class="flex gap-2 items-center">
            <select v-model="item.variant_id" required class="field-input flex-1">
              <option value="" disabled>Select SKU</option>
              <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.sku }}</option>
            </select>
            <input
              v-model.number="item.quantity"
              type="number"
              min="1"
              required
              placeholder="Qty"
              class="field-input w-24 text-right mono"
            />
            <AppButton
              v-if="form.items.length > 1"
              variant="danger"
              size="xs"
              icon="i-heroicons-trash"
              @click="form.items.splice(idx, 1)"
            />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <input v-model="form.notes" type="text" placeholder="Transfer reason or reference" class="field-input" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" label="Create Transfer" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showCancelConfirm"
      title="Cancel Transfer"
      variant="danger"
      confirm-label="Cancel Transfer"
      :loading="cancelling"
      :message="`Are you sure you want to cancel transfer ${cancelTarget?.transfer_number || ''}?`"
      @confirm="executeCancelTransfer"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Transfers — Clothing Store Admin' })

const invApi = useInventoryApi()
const variantApi = useVariantApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const cancelling = ref(false)
const transfers = ref<any[]>([])
const warehouses = ref<any[]>([])
const variants = ref<any[]>([])
const showModal = ref(false)
const showCancelConfirm = ref(false)
const cancelTarget = ref<any>(null)

const searchQuery = ref('')
const statusFilter = ref('')

const form = ref({
  from_warehouse_id: '',
  to_warehouse_id: '',
  notes: '',
  items: [{ variant_id: '', quantity: 1 }] as any[],
})

const columns = [
  { key: 'transfer_number', label: 'Transfer #', sortable: true },
  { key: 'from_warehouse_display', label: 'From Warehouse', sortable: true },
  { key: 'to_warehouse_display', label: 'To Warehouse', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'notes', label: 'Notes' },
  { key: 'created_at', label: 'Created', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const warehouseMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const w of warehouses.value) {
    if (w?.id) m[w.id] = w.name
  }
  return m
})

const enrichedTransfers = computed(() =>
  transfers.value.map(t => ({
    ...t,
    from_warehouse_display: t.from_warehouse_name || warehouseMap.value[t.from_warehouse_id] || (t.from_warehouse_id ? String(t.from_warehouse_id).slice(0, 8) : '—'),
    to_warehouse_display: t.to_warehouse_name || warehouseMap.value[t.to_warehouse_id] || (t.to_warehouse_id ? String(t.to_warehouse_id).slice(0, 8) : '—'),
  })),
)

const filteredTransfers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return enrichedTransfers.value.filter((t) => {
    const st = t.status_code || t.status
    if (statusFilter.value) {
      if (statusFilter.value === 'COMPLETED' && !['COMPLETED', 'RECEIVED'].includes(st)) return false
      else if (statusFilter.value !== 'COMPLETED' && st !== statusFilter.value) return false
    }
    if (q) {
      const hay = [t.transfer_number, t.from_warehouse_display, t.to_warehouse_display, t.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const activeChips = computed<FilterChipItem[]>(() =>
  statusFilter.value ? [{ key: 'status', label: 'Status', value: statusFilter.value }] : [],
)

function statusColor(status: string) {
  switch (status) {
    case 'PENDING':
    case 'DRAFT': return 'default'
    case 'APPROVED': return 'blue'
    case 'IN_TRANSIT':
    case 'DISPATCHED': return 'yellow'
    case 'COMPLETED':
    case 'RECEIVED': return 'green'
    case 'CANCELLED': return 'red'
    default: return 'default'
  }
}

function addItem() {
  form.value.items.push({ variant_id: variants.value[0]?.id || '', quantity: 1 })
}

function openCreateModal() {
  form.value = {
    from_warehouse_id: warehouses.value[0]?.id || '',
    to_warehouse_id: warehouses.value[1]?.id || '',
    notes: '',
    items: [{ variant_id: variants.value[0]?.id || '', quantity: 1 }],
  }
  showModal.value = true
}

async function fetchTransfers() {
  loading.value = true
  try {
    const data = await invApi.listTransfers({ limit: 50 }) as any
    transfers.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchMeta() {
  try {
    const [stocks, vars, branches] = await Promise.all([
      invApi.listStocks({}).catch(() => []) as any,
      variantApi.listVariants({ limit: 500 }).catch(() => []) as any,
      branchApi.listBranches().catch(() => []),
    ])
    const wMap = new Map()
    ;(branches || []).forEach((b: any) => {
      ;(b.warehouses || []).forEach((w: any) => {
        wMap.set(w.id, { id: w.id, name: `${b.name} — ${w.name}` })
      })
    })
    const stockArr = Array.isArray(stocks) ? stocks : (stocks?.items || [])
    stockArr.forEach((s: any) => {
      if (s.warehouse_id && !wMap.has(s.warehouse_id)) {
        wMap.set(s.warehouse_id, { id: s.warehouse_id, name: `Warehouse ${s.warehouse_id.slice(0, 8)}` })
      }
    })
    warehouses.value = Array.from(wMap.values())
    variants.value = Array.isArray(vars) ? vars : (vars?.items || [])
  } catch (e) {
    console.error(e)
  }
}

async function handleCreate() {
  if (form.value.from_warehouse_id === form.value.to_warehouse_id) {
    toast.add({ title: 'Validation Error', description: 'Source and destination warehouses must be different.', color: 'amber' })
    return
  }
  saving.value = true
  try {
    await invApi.createTransfer({
      from_warehouse_id: form.value.from_warehouse_id,
      to_warehouse_id: form.value.to_warehouse_id,
      notes: form.value.notes,
      items: form.value.items,
    })
    toast.add({ title: 'Success', description: 'Transfer created', color: 'green' })
    showModal.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function approveTransfer(id: string) {
  try {
    await invApi.approveTransfer(id)
    toast.add({ title: 'Approved', description: 'Transfer approved', color: 'green' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function dispatchTransfer(id: string) {
  try {
    await invApi.dispatchTransfer(id)
    toast.add({ title: 'Dispatched', description: 'Transfer dispatched', color: 'amber' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

async function receiveTransfer(id: string) {
  try {
    await invApi.receiveTransfer(id)
    toast.add({ title: 'Received', description: 'Transfer completed, stock updated!', color: 'green' })
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

function promptCancel(row: any) {
  cancelTarget.value = row
  showCancelConfirm.value = true
}

async function executeCancelTransfer() {
  if (!cancelTarget.value) return
  cancelling.value = true
  try {
    await invApi.cancelTransfer(cancelTarget.value.id)
    toast.add({ title: 'Cancelled', description: 'Stock transfer cancelled', color: 'green' })
    showCancelConfirm.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  await fetchMeta()
  await fetchTransfers()
})
</script>
