<template>
  <div class="page-root">
    <AppPageHeader
      title="Stock Transfers"
      description="Create, dispatch, and receive inter-warehouse inventory transfers."
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
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Dispatched / In Transit', value: 'IN_TRANSIT' },
          { label: 'Received', value: 'RECEIVED' },
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
          <span class="text-xs text-gray-500">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              v-if="(row.status_code || row.status) === 'DRAFT'"
              size="xs"
              variant="primary"
              label="Dispatch"
              @click="promptAction(row, 'dispatch')"
            />
            <AppButton
              v-if="['DISPATCHED', 'IN_TRANSIT'].includes(row.status_code || row.status)"
              size="xs"
              variant="primary"
              label="Receive"
              @click="promptAction(row, 'receive')"
            />
            <AppButton
              v-if="['DRAFT', 'DISPATCHED', 'IN_TRANSIT'].includes(row.status_code || row.status)"
              size="xs"
              variant="danger"
              label="Cancel"
              @click="promptAction(row, 'cancel')"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Transfer Modal -->
    <AppModal
      v-model="showCreateModal"
      title="Create Stock Transfer"
      description="Select source and destination warehouses and specify the SKUs to move."
      size="lg"
    >
      <form class="form-grid" @submit.prevent="submitCreate">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Source Warehouse (From) <span class="required">*</span></label>
            <select v-model="form.from_warehouse_id" required class="field-input">
              <option value="" disabled>Select source warehouse...</option>
              <option v-for="w in warehousesList" :key="w.id" :value="w.id">
                {{ w.branchName ? `${w.branchName} — ${w.name}` : w.name }}
              </option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Destination Warehouse (To) <span class="required">*</span></label>
            <select v-model="form.to_warehouse_id" required class="field-input">
              <option value="" disabled>Select destination warehouse...</option>
              <option v-for="w in warehousesList" :key="w.id" :value="w.id" :disabled="w.id === form.from_warehouse_id">
                {{ w.branchName ? `${w.branchName} — ${w.name}` : w.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <input v-model="form.notes" type="text" placeholder="Optional transfer notes..." class="field-input" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="field-label">Items to Transfer <span class="required">*</span></label>
            <AppButton size="xs" variant="default" icon="i-heroicons-plus" label="Add Line" @click="addLine" />
          </div>
          <div v-for="(line, i) in form.items" :key="i" class="flex gap-2 items-center">
            <select v-model="line.variant_id" required class="field-input flex-1">
              <option value="" disabled>Select product variant (SKU)...</option>
              <option v-for="v in variantsList" :key="v.id" :value="v.id">
                {{ v.sku }} — {{ v.product_name || 'Product' }} ({{ [v.color, v.size].filter(Boolean).join(' / ') }})
              </option>
            </select>
            <input
              v-model.number="line.quantity"
              type="number"
              min="1"
              placeholder="Qty"
              required
              class="field-input w-24 text-right mono"
            />
            <AppButton
              v-if="form.items.length > 1"
              size="xs"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="form.items.splice(i, 1)"
            />
          </div>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showCreateModal = false" />
          <AppButton type="submit" variant="primary" label="Create Transfer" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <!-- Action Confirmation Dialog -->
    <AppConfirmDialog
      v-model="showActionConfirm"
      :title="actionConfirmTitle"
      :variant="pendingAction === 'cancel' ? 'danger' : 'primary'"
      :confirm-label="actionConfirmTitle"
      :loading="processingAction"
      :message="actionConfirmMessage"
      @confirm="executeTransferAction"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Stock Transfers — Clothing Store Admin' })

const inventoryApi = useInventoryApi()
const branchApi = useBranchApi()
const variantApi = useVariantApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const processingAction = ref(false)
const transfers = ref<any[]>([])
const warehousesList = ref<any[]>([])
const variantsList = ref<any[]>([])

const searchQuery = ref('')
const statusFilter = ref('')

const showCreateModal = ref(false)
const showActionConfirm = ref(false)
const actionTarget = ref<any>(null)
const pendingAction = ref<'dispatch' | 'receive' | 'cancel'>('dispatch')

const form = ref({
  from_warehouse_id: '',
  to_warehouse_id: '',
  notes: '',
  items: [{ variant_id: '', quantity: 1 }],
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
  for (const w of warehousesList.value) {
    if (w?.id) m[w.id] = w.branchName ? `${w.branchName} — ${w.name}` : w.name
  }
  return m
})

const enrichedTransfers = computed(() =>
  transfers.value.map(t => ({
    ...t,
    from_warehouse_display: t.from_warehouse_name || warehouseMap.value[t.from_warehouse_id] || String(t.from_warehouse_id || '').slice(0, 8),
    to_warehouse_display: t.to_warehouse_name || warehouseMap.value[t.to_warehouse_id] || String(t.to_warehouse_id || '').slice(0, 8),
  })),
)

const filteredTransfers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return enrichedTransfers.value.filter((t) => {
    const st = t.status_code || t.status
    if (statusFilter.value) {
      if (statusFilter.value === 'IN_TRANSIT' && !['DISPATCHED', 'IN_TRANSIT'].includes(st)) return false
      else if (statusFilter.value !== 'IN_TRANSIT' && st !== statusFilter.value) return false
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
  const map: Record<string, string> = {
    DRAFT: 'default',
    DISPATCHED: 'yellow',
    IN_TRANSIT: 'yellow',
    RECEIVED: 'green',
    CANCELLED: 'red',
  }
  return map[status] || 'default'
}

function addLine() {
  form.value.items.push({ variant_id: '', quantity: 1 })
}

async function openCreateModal() {
  form.value = {
    from_warehouse_id: warehousesList.value[0]?.id || '',
    to_warehouse_id: warehousesList.value[1]?.id || '',
    notes: '',
    items: [{ variant_id: '', quantity: 1 }],
  }
  showCreateModal.value = true
}

async function fetchLookups() {
  try {
    const [bList, vList] = await Promise.all([
      branchApi.listBranches().catch(() => []),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    variantsList.value = (vList as any[]) || []
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

async function fetchTransfers() {
  loading.value = true
  try {
    const data = await inventoryApi.listTransfers() as any[]
    transfers.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function submitCreate() {
  if (form.value.from_warehouse_id === form.value.to_warehouse_id) {
    toast.add({ title: 'Validation Error', description: 'Source and destination warehouses must be different.', color: 'amber' })
    return
  }
  saving.value = true
  try {
    await inventoryApi.createTransfer(form.value)
    toast.add({ title: 'Transfer Created', description: 'New stock transfer created', color: 'green' })
    showCreateModal.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

const actionConfirmTitle = computed(() => {
  if (pendingAction.value === 'dispatch') return 'Dispatch Transfer'
  if (pendingAction.value === 'receive') return 'Receive Transfer'
  return 'Cancel Transfer'
})

const actionConfirmMessage = computed(() => {
  const num = actionTarget.value?.transfer_number || ''
  if (pendingAction.value === 'dispatch') {
    return `Dispatch transfer ${num}? Stock will be deducted from ${actionTarget.value?.from_warehouse_display} and marked In Transit.`
  }
  if (pendingAction.value === 'receive') {
    return `Mark transfer ${num} as received? Stock will be added to ${actionTarget.value?.to_warehouse_display}.`
  }
  return `Are you sure you want to cancel transfer ${num}?`
})

function promptAction(row: any, action: 'dispatch' | 'receive' | 'cancel') {
  actionTarget.value = row
  pendingAction.value = action
  showActionConfirm.value = true
}

async function executeTransferAction() {
  if (!actionTarget.value) return
  processingAction.value = true
  try {
    if (pendingAction.value === 'dispatch') {
      await inventoryApi.dispatchTransfer(actionTarget.value.id)
      toast.add({ title: 'Dispatched', description: 'Transfer marked as in transit', color: 'green' })
    } else if (pendingAction.value === 'receive') {
      await inventoryApi.receiveTransfer(actionTarget.value.id, {})
      toast.add({ title: 'Received', description: 'Transfer stock received into destination warehouse', color: 'green' })
    } else {
      await inventoryApi.cancelTransfer(actionTarget.value.id)
      toast.add({ title: 'Cancelled', description: 'Stock transfer cancelled', color: 'green' })
    }
    showActionConfirm.value = false
    await fetchTransfers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    processingAction.value = false
  }
}

onMounted(async () => {
  await fetchLookups()
  await fetchTransfers()
})
</script>
