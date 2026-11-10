<template>
  <div class="page-root">
    <!-- Header -->
    <AppPageHeader
      title="Domain Audit Trail"
      description="Append-only ledger of stock adjustments, purchase approvals, goods receipts, and sales events."
      :breadcrumbs="[{ label: 'Administration' }, { label: 'Audit Logs' }]"
    >
      <template #actions>
        <AppButton
          size="sm"
          variant="default"
          label="Refresh"
          icon="i-heroicons-arrow-path"
          :loading="loading"
          @click="fetchLogs"
        />
      </template>
    </AppPageHeader>

    <!-- Filter Bar -->
    <AppFilterBar
      v-model:search="actionFilter"
      search-placeholder="Filter action or entity ID (e.g. SALE_COMPLETED)..."
      :total-count="filteredLogs.length"
      result-label="events"
      :active-chips="activeChips"
      @remove-chip="removeChip"
      @clear-all="clearFilters"
    >
      <template #filters>
        <AppSelect
          v-model="selectedEntityType"
          :options="entityOptions"
          style="min-width: 180px;"
          @update:model-value="fetchLogs"
        />
      </template>
    </AppFilterBar>

    <!-- Audit Logs Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedLogs"
        :loading="loading"
        empty-text="No audit log entries match the current filters."
        empty-icon="i-heroicons-clipboard-document-check"
      >
        <template #cell-created_at="{ row }">
          <span class="mono-muted">{{ formatDate(row.created_at) }}</span>
        </template>

        <template #cell-action="{ row }">
          <span class="action-code-pill">{{ row.action }}</span>
        </template>

        <template #cell-entity_type="{ row }">
          <AppBadge color="default" size="sm">{{ row.entity_type || '—' }}</AppBadge>
        </template>

        <template #cell-entity_id="{ row }">
          <span class="mono-muted" :title="row.entity_id">
            {{ row.entity_id ? String(row.entity_id).slice(0, 8) : '—' }}
          </span>
        </template>

        <template #cell-user_id="{ row }">
          <span class="mono-muted" :title="row.user_id">
            {{ row.user_id ? String(row.user_id).slice(0, 8) : 'System' }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            size="xs"
            variant="ghost"
            label="Inspect Payload"
            icon="i-heroicons-eye"
            @click="inspectEntry(row)"
          />
        </template>

        <template v-if="filteredLogs.length > pageSize" #footer>
          <AppPagination
            v-model:page="page"
            :total="filteredLogs.length"
            :page-size="pageSize"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Payload Diff Detail Drawer -->
    <AppDetailDrawer
      v-model="isInspectOpen"
      :title="selectedEntry?.action || 'Audit Event'"
      :subtitle="selectedEntry ? `${formatDate(selectedEntry.created_at)} · Entity: ${selectedEntry.entity_type || 'N/A'}` : ''"
      width="lg"
    >
      <div v-if="selectedEntry" class="flex flex-col gap-4">
        <div class="detail-list">
          <div class="detail-row">
            <dt>Action Code</dt>
            <dd><span class="inline-block px-2 py-0.5 font-mono text-[11.5px] font-semibold text-ink bg-surface-inset border border-border-subtle rounded-sm">{{ selectedEntry.action }}</span></dd>
          </div>
          <div class="detail-row">
            <dt>Timestamp</dt>
            <dd class="font-mono text-xs text-ink-secondary">{{ formatDate(selectedEntry.created_at) }}</dd>
          </div>
          <div class="detail-row">
            <dt>Entity Type</dt>
            <dd>{{ selectedEntry.entity_type || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt>Entity ID</dt>
            <dd class="font-mono text-xs text-ink-secondary">{{ selectedEntry.entity_id || '—' }}</dd>
          </div>
          <div class="detail-row">
            <dt>Actor User ID</dt>
            <dd class="font-mono text-xs text-ink-secondary">{{ selectedEntry.user_id || 'System' }}</dd>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <div class="p-3 bg-surface-inset border border-border-subtle rounded-md">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-2">Previous State (old_data)</p>
            <pre class="font-mono text-[11.5px] text-ink overflow-x-auto whitespace-pre-wrap break-words m-0">{{ JSON.stringify(selectedEntry.old_data || {}, null, 2) }}</pre>
          </div>
          <div class="p-3 bg-surface-inset border border-border-subtle rounded-md">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary mb-2">New State (new_data)</p>
            <pre class="font-mono text-[11.5px] text-ink overflow-x-auto whitespace-pre-wrap break-words m-0">{{ JSON.stringify(selectedEntry.new_data || {}, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton variant="default" size="sm" label="Close" @click="isInspectOpen = false" />
      </template>
    </AppDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

definePageMeta({
  middleware: ['auth'],
})
useHead({ title: 'Audit Logs — Clothing Store' })

const auditApi = useAuditApi()
const { addToast } = useAppToast()

const loading = ref(false)
const logs = ref<any[]>([])
const selectedEntityType = ref('')
const actionFilter = ref('')
const isInspectOpen = ref(false)
const selectedEntry = ref<any>(null)
const page = ref(1)
const pageSize = 25

const entityOptions = [
  { label: 'All Entity Types', value: '' },
  { label: 'Inventory Stock', value: 'inventory_stock' },
  { label: 'Purchase Order', value: 'purchase_order' },
  { label: 'Goods Receipt', value: 'goods_receipt' },
  { label: 'Sale', value: 'sale' },
  { label: 'Return', value: 'return' },
]

const columns = [
  { key: 'created_at', label: 'Timestamp', sortable: true },
  { key: 'action', label: 'Action', sortable: true },
  { key: 'entity_type', label: 'Entity Type', sortable: true },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'user_id', label: 'Actor ID' },
  { key: 'actions', label: 'Actions' },
]

const activeChips = computed(() => {
  const chips: { key: string; label: string; value: string }[] = []
  if (selectedEntityType.value) {
    const found = entityOptions.find(o => o.value === selectedEntityType.value)
    if (found) chips.push({ key: 'entity', label: 'Entity', value: found.label })
  }
  return chips
})

function removeChip(key: string) {
  if (key === 'entity') {
    selectedEntityType.value = ''
    fetchLogs()
  }
}

function clearFilters() {
  actionFilter.value = ''
  selectedEntityType.value = ''
  fetchLogs()
}

const filteredLogs = computed(() => {
  const q = actionFilter.value.trim().toLowerCase()
  if (!q) return logs.value
  return logs.value.filter((l: any) =>
    (l.action || '').toLowerCase().includes(q) ||
    (l.entity_id || '').toLowerCase().includes(q) ||
    (l.entity_type || '').toLowerCase().includes(q) ||
    (l.user_id || '').toLowerCase().includes(q)
  )
})

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredLogs.value.slice(start, start + pageSize)
})

watch([actionFilter, selectedEntityType], () => {
  page.value = 1
})

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

function inspectEntry(entry: any) {
  selectedEntry.value = entry
  isInspectOpen.value = true
}

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = { limit: 150 }
    if (selectedEntityType.value) params.entity_type = selectedEntityType.value
    const res = await auditApi.listAuditLogs(params)
    logs.value = Array.isArray(res) ? res : []
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to load audit logs',
      message: err?.data?.detail || err?.message || 'Error loading audit logs',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

