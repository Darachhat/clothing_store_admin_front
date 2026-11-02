<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">POS Terminals &amp; Registers</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage cashier workstations, branch assignments, and hardware registers</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchData"
        />
        <AppButton
          variant="primary"
          icon="i-heroicons-plus"
          label="Add Register"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Registers</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ terminals.length }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300">
            <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Terminals</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ activeCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Maintenance / Inactive</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ inactiveCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <UIcon name="i-heroicons-pause-circle" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Terminals Table Card -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="terminals"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-computer-desktop', label: 'No POS registers registered yet' }"
      >
        <template #cell-code="{ row }">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-mono font-semibold text-xs border border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm font-mono">{{ row.code }}</p>
              <p class="text-xs text-gray-500">{{ row.name }}</p>
            </div>
          </div>
        </template>

        <template #cell-branch="{ row }">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ row.branch?.name || 'Branch' }}</p>
            <p class="text-xs text-gray-500 font-mono">{{ row.branch?.code }}</p>
          </div>
        </template>

        <template #cell-warehouse="{ row }">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-gray-400" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.warehouse?.name || 'Main Warehouse' }}</span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status_code === 'ACTIVE' ? 'emerald' : row.status_code === 'MAINTENANCE' ? 'amber' : 'gray'"
            :label="row.status_code"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-last_active="{ row }">
          <div class="text-xs">
            <p v-if="row.last_active_at" class="text-gray-700 dark:text-gray-300 font-medium">
              {{ formatRelativeTime(row.last_active_at) }}
            </p>
            <p v-else class="text-gray-400 italic">Never connected</p>
            <p v-if="row.last_active_at" class="text-[11px] text-gray-400">
              {{ new Date(row.last_active_at).toLocaleTimeString() }}
            </p>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              v-if="row.status_code === 'ACTIVE'"
              size="sm"
              variant="ghost"
              icon="i-heroicons-pause"
              label="Deactivate"
              @click="toggleTerminalStatus(row, 'INACTIVE')"
            />
            <AppButton
              v-else
              size="sm"
              variant="ghost"
              icon="i-heroicons-check"
              label="Activate"
              @click="toggleTerminalStatus(row, 'ACTIVE')"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Terminal Modal -->
    <AppModal v-model="showCreateModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-computer-desktop" class="w-5 h-5 text-gray-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Register New POS Station</h3>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateTerminal">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Terminal Code *</label>
              <input
                v-model="createForm.code"
                type="text"
                required
                placeholder="e.g. POS-02"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm uppercase font-mono"
              />
              <p class="text-[11px] text-gray-400 mt-0.5">Unique hardware or station identifier</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Register Name *</label>
              <input
                v-model="createForm.name"
                type="text"
                required
                placeholder="e.g. Counter Register 2"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Branch *</label>
              <select
                v-model="createForm.branch_id"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                @change="onBranchChange"
              >
                <option value="" disabled>Select Branch</option>
                <option v-for="b in branches" :key="b.id" :value="b.id">
                  {{ b.name }} ({{ b.code }})
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fulfillment Warehouse *</label>
              <select
                v-model="createForm.warehouse_id"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="" disabled>Select Warehouse</option>
                <option v-for="w in filteredWarehouses" :key="w.id" :value="w.id">
                  {{ w.name }} <template v-if="w.is_default">(Default)</template>
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes / Location Description</label>
            <input
              v-model="createForm.notes"
              type="text"
              placeholder="e.g. Ground floor main entrance checkout station"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Register Station" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Edit Terminal Modal -->
    <AppModal v-model="showEditModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-pencil" class="w-5 h-5 text-gray-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Edit POS Station: {{ editingTerminal?.code }}</h3>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showEditModal = false" />
          </div>
        </template>

        <form v-if="editingTerminal" class="space-y-4" @submit.prevent="handleUpdateTerminal">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Terminal Code</label>
              <input
                :value="editingTerminal.code"
                disabled
                type="text"
                class="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/60 px-3 py-2 text-sm uppercase font-mono text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Register Name *</label>
              <input
                v-model="editForm.name"
                type="text"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fulfillment Warehouse</label>
              <select
                v-model="editForm.warehouse_id"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option v-for="w in editWarehouses" :key="w.id" :value="w.id">
                  {{ w.name }} <template v-if="w.is_default">(Default)</template>
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Station Status</label>
              <select
                v-model="editForm.status_code"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input
              v-model="editForm.notes"
              type="text"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <AppButton variant="ghost" label="Cancel" @click="showEditModal = false" />
            <AppButton type="submit" variant="primary" label="Save Changes" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { PosTerminal, Branch, Warehouse } from '~/types'

definePageMeta({ middleware: ['auth'] })

const terminalApi = useTerminalApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const terminals = ref<PosTerminal[]>([])
const branches = ref<Branch[]>([])
const allWarehouses = ref<Warehouse[]>([])

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingTerminal = ref<PosTerminal | null>(null)

const createForm = ref({
  branch_id: '',
  warehouse_id: '',
  code: '',
  name: '',
  notes: '',
})

const editForm = ref({
  name: '',
  warehouse_id: '',
  status_code: 'ACTIVE',
  notes: '',
})

const columns = [
  { key: 'code', label: 'Register' },
  { key: 'branch', label: 'Branch' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'status', label: 'Status' },
  { key: 'last_active', label: 'Last Activity' },
  { key: 'actions', label: 'Actions' },
]

const activeCount = computed(() => terminals.value.filter(t => t.status_code === 'ACTIVE').length)
const inactiveCount = computed(() => terminals.value.filter(t => t.status_code !== 'ACTIVE').length)

const filteredWarehouses = computed(() => {
  if (!createForm.value.branch_id) return allWarehouses.value
  return allWarehouses.value.filter(w => (w as any).branch_id === createForm.value.branch_id)
})

const editWarehouses = computed(() => {
  if (!editingTerminal.value) return allWarehouses.value
  return allWarehouses.value.filter(w => (w as any).branch_id === editingTerminal.value?.branch_id)
})

function formatRelativeTime(isoString: string) {
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

function onBranchChange() {
  const defaultWh = filteredWarehouses.value.find(w => (w as any).is_default) || filteredWarehouses.value[0]
  if (defaultWh) {
    createForm.value.warehouse_id = defaultWh.id
  } else {
    createForm.value.warehouse_id = ''
  }
}

async function fetchData() {
  loading.value = true
  try {
    const [termList, branchList, whList] = await Promise.all([
      terminalApi.listTerminals(),
      branchApi.listBranches(),
      branchApi.listWarehouses(),
    ])
    terminals.value = termList || []
    branches.value = branchList || []
    allWarehouses.value = whList || []
  } catch (err: any) {
    toast.error('Failed to load POS terminals', err.data?.detail || err.message)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  const defaultBranch = branches.value[0]
  const defaultBranchId = defaultBranch?.id || ''
  createForm.value = {
    branch_id: defaultBranchId,
    warehouse_id: '',
    code: `POS-0${terminals.value.length + 1}`,
    name: `Register ${terminals.value.length + 1}`,
    notes: '',
  }
  if (defaultBranchId) {
    onBranchChange()
  }
  showCreateModal.value = true
}

function openEditModal(terminal: PosTerminal) {
  editingTerminal.value = terminal
  editForm.value = {
    name: terminal.name,
    warehouse_id: terminal.warehouse_id,
    status_code: terminal.status_code,
    notes: terminal.notes || '',
  }
  showEditModal.value = true
}

async function handleCreateTerminal() {
  saving.value = true
  try {
    await terminalApi.createTerminal({
      branch_id: createForm.value.branch_id,
      warehouse_id: createForm.value.warehouse_id,
      code: createForm.value.code.trim().toUpperCase(),
      name: createForm.value.name.trim(),
      notes: createForm.value.notes?.trim() || undefined,
    })
    toast.success('POS Terminal Registered', `Station ${createForm.value.code} registered successfully.`)
    showCreateModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.error('Failed to register terminal', err.data?.detail || err.message)
  } finally {
    saving.value = false
  }
}

async function handleUpdateTerminal() {
  if (!editingTerminal.value) return
  saving.value = true
  try {
    await terminalApi.updateTerminal(editingTerminal.value.id, {
      name: editForm.value.name.trim(),
      warehouse_id: editForm.value.warehouse_id,
      status_code: editForm.value.status_code,
      notes: editForm.value.notes?.trim() || undefined,
    })
    toast.success('POS Terminal Updated', `Station ${editingTerminal.value.code} updated successfully.`)
    showEditModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.error('Failed to update terminal', err.data?.detail || err.message)
  } finally {
    saving.value = false
  }
}

async function toggleTerminalStatus(terminal: PosTerminal, newStatus: string) {
  try {
    await terminalApi.updateTerminal(terminal.id, {
      status_code: newStatus,
    })
    toast.success('Status Updated', `Station ${terminal.code} set to ${newStatus}.`)
    await fetchData()
  } catch (err: any) {
    toast.error('Failed to change status', err.data?.detail || err.message)
  }
}

onMounted(() => {
  fetchData()
})
</script>
