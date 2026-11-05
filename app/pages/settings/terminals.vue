<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">POS Terminals &amp; Live Monitor</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Real-time station heartbeat, cashier shift sessions, cash drawer oversight, and hardware assignments
        </p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Live Auto-Refresh Toggle -->
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          :class="{ '!text-emerald-700 dark:!text-emerald-400': autoRefreshEnabled }"
          @click="toggleAutoRefresh"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'"
          />
          <span>Auto-refresh (15s): {{ autoRefreshEnabled ? 'ON' : 'OFF' }}</span>
        </button>

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
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Online Workstations</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ onlineCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-heroicons-signal" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Open Shifts</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ openShiftsCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Maintenance / Offline</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ offlineCount }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
            <UIcon name="i-heroicons-pause-circle" class="w-5 h-5" />
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Terminals Live Monitor Table Card -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="terminals"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-computer-desktop', label: 'No POS registers registered yet' }"
      >
        <!-- Register Identifier -->
        <template #cell-code="{ row }">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-mono font-semibold text-xs border border-gray-200 dark:border-gray-700">
              <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm font-mono leading-tight">{{ row.code }}</p>
              <p class="text-xs text-gray-500 leading-tight mt-0.5">{{ row.name }}</p>
            </div>
          </div>
        </template>

        <!-- Branch -->
        <template #cell-branch="{ row }">
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">{{ row.branch?.name || 'Branch' }}</p>
            <p class="text-xs text-gray-500 font-mono leading-tight mt-0.5">{{ row.branch?.code }}</p>
          </div>
        </template>

        <!-- Warehouse -->
        <template #cell-warehouse="{ row }">
          <div class="flex items-center gap-1.5">
            <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 text-gray-400" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ row.warehouse?.name || 'Main Warehouse' }}</span>
          </div>
        </template>

        <!-- Live Heartbeat Status -->
        <template #cell-heartbeat="{ row }">
          <div class="flex items-center gap-2">
            <span
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="getHeartbeatClass(row.last_active_at)"
            />
            <div class="text-xs">
              <span class="font-medium text-gray-800 dark:text-gray-200">
                {{ getHeartbeatLabel(row.last_active_at) }}
              </span>
              <p v-if="row.last_active_at" class="text-[11px] text-gray-400">
                {{ formatRelativeTime(row.last_active_at) }}
              </p>
            </div>
          </div>
        </template>

        <!-- Cashier Shift Status -->
        <template #cell-shift="{ row }">
          <div v-if="activeShiftsByTerminalId[row.id]" class="space-y-1">
            <div class="flex items-center gap-1.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-gray-200 dark:border-gray-700">
                OPEN SHIFT
              </span>
              <span class="text-xs font-medium text-gray-800 dark:text-gray-200">
                {{ activeShiftsByTerminalId[row.id].cashier_name || 'Cashier' }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-[11px] text-gray-500">
              <span>Float: ${{ Number(activeShiftsByTerminalId[row.id].opening_float_usd || 0).toFixed(2) }}</span>
              <button
                type="button"
                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                @click="viewShiftSummary(activeShiftsByTerminalId[row.id].id)"
              >
                Inspect
              </button>
            </div>
          </div>
          <div v-else class="text-xs text-gray-400 italic">
            No active shift
          </div>
        </template>

        <!-- Terminal Status -->
        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status_code === 'ACTIVE' ? 'emerald' : row.status_code === 'MAINTENANCE' ? 'amber' : 'gray'"
            :label="row.status_code"
            size="sm"
            variant="subtle"
          />
        </template>

        <!-- Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil"
              label="Edit"
              @click="openEditModal(row)"
            />
            <!-- Remote Force Close Shift if shift is open -->
            <AppButton
              v-if="activeShiftsByTerminalId[row.id]"
              size="sm"
              variant="ghost"
              icon="i-heroicons-lock-closed"
              label="End Shift"
              @click="openForceCloseModal(row, activeShiftsByTerminalId[row.id])"
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

    <!-- Shift Details / Summary Modal -->
    <AppModal v-model="showSummaryModal">
      <AppCard v-if="selectedShiftSummary">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-gray-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Live Shift Summary: {{ selectedShiftSummary.terminal_code }}
              </h3>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showSummaryModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Metadata strip -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
            <div>
              <p class="text-gray-500">Cashier</p>
              <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ selectedShiftSummary.cashier_name }}</p>
            </div>
            <div>
              <p class="text-gray-500">Branch</p>
              <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ selectedShiftSummary.branch_name }}</p>
            </div>
            <div>
              <p class="text-gray-500">Opened At</p>
              <p class="font-semibold text-gray-900 dark:text-white mt-0.5">{{ new Date(selectedShiftSummary.opened_at).toLocaleTimeString() }}</p>
            </div>
          </div>

          <!-- Sales Overview Breakdown -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500">Tender &amp; Revenue Breakdown</h4>
            <div class="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">
              <div class="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800">
                <span class="text-gray-600 dark:text-gray-300">Opening Cash Float</span>
                <span class="font-mono font-medium">${{ Number(selectedShiftSummary.opening_float_usd || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800">
                <span class="text-gray-600 dark:text-gray-300">Cash Sales ({{ selectedShiftSummary.cash_payments_count }} txns)</span>
                <span class="font-mono font-medium text-emerald-600 dark:text-emerald-400">+${{ Number(selectedShiftSummary.cash_sales_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800">
                <span class="text-gray-600 dark:text-gray-300">ABA KHQR Sales ({{ selectedShiftSummary.aba_payments_count }} txns)</span>
                <span class="font-mono font-medium text-blue-600 dark:text-blue-400">${{ Number(selectedShiftSummary.aba_sales_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800">
                <span class="text-gray-600 dark:text-gray-300">Credit / Debit Card Sales</span>
                <span class="font-mono font-medium">${{ Number(selectedShiftSummary.card_sales_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/80 font-bold">
                <span>Total Gross Sales ({{ selectedShiftSummary.total_sales_count }} sales)</span>
                <span class="font-mono">${{ Number(selectedShiftSummary.total_sales_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="flex items-center justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 font-bold text-emerald-700 dark:text-emerald-300">
                <span>Current Expected Cash in Drawer</span>
                <span class="font-mono">${{ Number(selectedShiftSummary.expected_cash_usd || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <AppButton variant="ghost" label="Close" @click="showSummaryModal = false" />
          </div>
        </div>
      </AppCard>
    </AppModal>

    <!-- Force End Shift Modal -->
    <AppModal v-model="showForceCloseModal">
      <AppCard v-if="closingShift">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-500" />
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Remote Force Close Shift: {{ closingTerminal?.code }}
              </h3>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showForceCloseModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleForceCloseShift">
          <p class="text-xs text-gray-600 dark:text-gray-300">
            This will immediately close cashier <span class="font-bold text-gray-900 dark:text-white">{{ closingShift.cashier_name }}</span>'s
            shift on register <span class="font-mono font-bold">{{ closingTerminal?.code }}</span>.
          </p>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Final Counted Cash Float (USD) *
            </label>
            <input
              v-model.number="forceCloseForm.closing_cash_usd"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Admin Notes / Reason *
            </label>
            <textarea
              v-model="forceCloseForm.notes"
              rows="2"
              required
              placeholder="e.g. Cashier shift abandoned; closed remotely by Store Manager after counting physical drawer."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <AppButton variant="ghost" label="Cancel" @click="showForceCloseModal = false" />
            <AppButton type="submit" variant="primary" label="Confirm &amp; End Shift" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

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
const shiftApi = useShiftApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const terminals = ref<PosTerminal[]>([])
const activeShiftsByTerminalId = ref<Record<string, any>>({})
const branches = ref<Branch[]>([])
const allWarehouses = ref<Warehouse[]>([])

// Auto-refresh state
const autoRefreshEnabled = ref(true)
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showSummaryModal = ref(false)
const showForceCloseModal = ref(false)

const editingTerminal = ref<PosTerminal | null>(null)
const selectedShiftSummary = ref<any | null>(null)
const closingTerminal = ref<PosTerminal | null>(null)
const closingShift = ref<any | null>(null)

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

const forceCloseForm = ref({
  closing_cash_usd: 0,
  notes: '',
})

const columns = [
  { key: 'code', label: 'Register' },
  { key: 'branch', label: 'Branch' },
  { key: 'warehouse', label: 'Warehouse' },
  { key: 'heartbeat', label: 'Connection' },
  { key: 'shift', label: 'Active Shift' },
  { key: 'status', label: 'Config' },
  { key: 'actions', label: 'Actions' },
]

// Heartbeat & status calculation helpers
function getHeartbeatSeconds(isoString?: string | null): number {
  if (!isoString) return Infinity
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
}

function getHeartbeatClass(isoString?: string | null): string {
  const diffSec = getHeartbeatSeconds(isoString)
  if (diffSec < 45) return 'bg-emerald-500 animate-pulse'
  if (diffSec < 120) return 'bg-amber-500'
  return 'bg-gray-400'
}

function getHeartbeatLabel(isoString?: string | null): string {
  const diffSec = getHeartbeatSeconds(isoString)
  if (diffSec < 45) return 'Online'
  if (diffSec < 120) return 'Idle'
  return 'Offline'
}

const onlineCount = computed(() => {
  return terminals.value.filter(t => getHeartbeatSeconds(t.last_active_at) < 45).length
})

const openShiftsCount = computed(() => {
  return Object.keys(activeShiftsByTerminalId.value).length
})

const offlineCount = computed(() => {
  return terminals.value.filter(t => getHeartbeatSeconds(t.last_active_at) >= 45).length
})

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
  if (diffSec < 60) return `${diffSec}s ago`
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
    const [termList, branchList, whList, openShifts] = await Promise.all([
      terminalApi.listTerminals(),
      branchApi.listBranches(),
      branchApi.listWarehouses(),
      shiftApi.listShifts({ status_code: 'OPEN' }).catch(() => []),
    ])
    terminals.value = termList || []
    branches.value = branchList || []
    allWarehouses.value = whList || []

    // Map open shifts by terminal ID
    const shiftMap: Record<string, any> = {}
    for (const s of openShifts || []) {
      if (s.terminal_id) {
        shiftMap[s.terminal_id] = s
      }
    }
    activeShiftsByTerminalId.value = shiftMap
  } catch (err: any) {
    toast.error('Failed to load POS terminals', err.data?.detail || err.message)
  } finally {
    loading.value = false
  }
}

function toggleAutoRefresh() {
  autoRefreshEnabled.value = !autoRefreshEnabled.value
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
    toast.success('Live Monitor Active', 'Polling station heartbeats every 15 seconds.')
  } else {
    stopAutoRefresh()
    toast.add({ title: 'Live Monitor Paused', description: 'Auto-refresh paused.', color: 'default' })
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  autoRefreshTimer = setInterval(() => {
    fetchData()
  }, 15000)
}

function stopAutoRefresh() {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

async function viewShiftSummary(shiftId: string) {
  try {
    const summary = await shiftApi.getShiftSummary(shiftId)
    selectedShiftSummary.value = summary
    showSummaryModal.value = true
  } catch (err: any) {
    toast.error('Failed to load shift summary', err.data?.detail || err.message)
  }
}

function openForceCloseModal(terminal: PosTerminal, shift: any) {
  closingTerminal.value = terminal
  closingShift.value = shift
  forceCloseForm.value = {
    closing_cash_usd: Number(shift.opening_float_usd || 0),
    notes: 'Shift closed remotely by Admin.',
  }
  showForceCloseModal.value = true
}

async function handleForceCloseShift() {
  if (!closingShift.value) return
  saving.value = true
  try {
    await shiftApi.closeShift(closingShift.value.id, {
      closing_cash_usd: forceCloseForm.value.closing_cash_usd,
      notes: forceCloseForm.value.notes.trim(),
    })
    toast.success('Shift Closed', `Station ${closingTerminal.value?.code} shift closed successfully.`)
    showForceCloseModal.value = false
    await fetchData()
  } catch (err: any) {
    toast.error('Failed to close shift', err.data?.detail || err.message)
  } finally {
    saving.value = false
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
  if (autoRefreshEnabled.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
