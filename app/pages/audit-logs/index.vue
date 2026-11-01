<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Domain Audit Trail</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Append-only ledger of stock adjustments, purchase approvals, goods receipts, and sales events
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="selectedEntityType"
          class="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs text-gray-700 dark:text-gray-200"
          @change="fetchLogs"
        >
          <option value="">All Entities</option>
          <option value="inventory_stock">Inventory Stock</option>
          <option value="purchase_order">Purchase Order</option>
          <option value="goods_receipt">Goods Receipt</option>
          <option value="sale">Sale</option>
          <option value="return">Return</option>
        </select>

        <input
          v-model="actionFilter"
          type="text"
          placeholder="Filter action (e.g. SALE_COMPLETED)"
          class="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-xs text-gray-700 dark:text-gray-200"
          @keyup.enter="fetchLogs"
        >

        <AppButton
          size="sm"
          variant="secondary"
          label="Refresh"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="fetchLogs"
        />
      </div>
    </div>

    <!-- Audit Logs Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="logs"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-clipboard-document-check', label: 'No audit log entries found' }"
      >
        <template #cell-created_at="{ row }">
          <span class="text-xs font-mono text-gray-500">
            {{ formatDate(row.created_at) }}
          </span>
        </template>

        <template #cell-action="{ row }">
          <span class="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">
            {{ row.action }}
          </span>
        </template>

        <template #cell-entity_type="{ row }">
          <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
            {{ row.entity_type || '-' }}
          </span>
        </template>

        <template #cell-entity_id="{ row }">
          <span class="text-xs font-mono text-gray-500">
            {{ row.entity_id ? String(row.entity_id).slice(0, 8) : '-' }}
          </span>
        </template>

        <template #cell-user_id="{ row }">
          <span class="text-xs font-mono text-gray-500">
            {{ row.user_id ? String(row.user_id).slice(0, 8) : 'System' }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            size="sm"
            variant="ghost"
            label="Inspect Payload"
            icon="i-heroicons-eye"
            @click="inspectEntry(row)"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Payload Diff Modal -->
    <AppModal v-model="isInspectOpen">
      <AppCard v-if="selectedEntry">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                {{ selectedEntry.action }}
              </h3>
              <p class="text-xs text-gray-500">
                {{ formatDate(selectedEntry.created_at) }} &bull; Entity: {{ selectedEntry.entity_type || 'N/A' }} ({{ selectedEntry.entity_id || 'N/A' }})
              </p>
            </div>
            <button
              type="button"
              class="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              @click="isInspectOpen = false"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <p class="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Previous State (old_data)</p>
            <pre class="font-mono text-[11px] text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(selectedEntry.old_data || {}, null, 2) }}</pre>
          </div>
          <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <p class="font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">New State (new_data)</p>
            <pre class="font-mono text-[11px] text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap">{{ JSON.stringify(selectedEntry.new_data || {}, null, 2) }}</pre>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <AppButton variant="ghost" label="Close" @click="isInspectOpen = false" />
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

const auditApi = useAuditApi()
const toast = useAppToast()

const loading = ref(false)
const logs = ref<any[]>([])
const selectedEntityType = ref('')
const actionFilter = ref('')
const isInspectOpen = ref(false)
const selectedEntry = ref<any>(null)

const columns = [
  { key: 'created_at', label: 'Timestamp', sortable: true },
  { key: 'action', label: 'Action' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'user_id', label: 'Actor ID' },
  { key: 'actions', label: '' },
]

function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

function inspectEntry(entry: any) {
  selectedEntry.value = entry
  isInspectOpen.value = true
}

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = { limit: 100 }
    if (selectedEntityType.value) params.entity_type = selectedEntityType.value
    if (actionFilter.value.trim()) params.action = actionFilter.value.trim()
    const res = await auditApi.listAuditLogs(params)
    logs.value = Array.isArray(res) ? res : []
  } catch (err: any) {
    toast.add({
      title: 'Failed to load audit logs',
      description: err?.data?.detail || err?.message || 'Error loading audit logs',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

