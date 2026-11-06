<template>
  <div class="app-table-wrap">
    <div class="app-table-scroll">
      <table class="app-table">
        <thead>
          <tr>
            <th
              v-for="col in normalizedColumns"
              :key="col.key"
              :style="col.width ? `width:${col.width}` : undefined"
              :class="[
                col.align ? `text-${col.align}` : '',
                col.key === 'actions' ? 'app-table__th-actions' : '',
                col.sortable ? 'app-table__th-sortable' : '',
              ]"
              @click="col.sortable ? toggleSort(col.key) : undefined"
            >
              <div class="app-table__th-inner" :class="{ 'justify-end': col.key === 'actions' || col.align === 'right' }">
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="app-table__sort-icon">
                  <UIcon
                    v-if="sortKey === col.key"
                    :name="sortOrder === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-3.5 h-3.5 text-gray-900"
                  />
                  <UIcon
                    v-else
                    name="i-heroicons-chevron-up-down"
                    class="w-3.5 h-3.5 text-gray-400"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="`sk-${i}`" class="skeleton-row">
              <td v-for="col in normalizedColumns" :key="col.key">
                <div class="skeleton-cell" :style="col.key === 'actions' ? 'width: 60%; margin-left: auto;' : ''" />
              </td>
            </tr>
          </template>
          <tr v-else-if="error">
            <td :colspan="normalizedColumns.length" class="empty-cell">
              <div class="empty-state">
                <UIcon name="i-heroicons-exclamation-triangle" class="empty-state__icon text-amber-600" />
                <span class="empty-state__title">{{ error }}</span>
                <AppButton v-if="onRetry" size="sm" variant="default" icon="i-heroicons-arrow-path" label="Retry" @click="onRetry" />
              </div>
            </td>
          </tr>
          <tr v-else-if="!sortedRows.length">
            <td :colspan="normalizedColumns.length" class="empty-cell">
              <div class="empty-state">
                <UIcon :name="emptyIcon || emptyState?.icon || 'i-heroicons-inbox'" class="empty-state__icon" />
                <span class="empty-state__title">{{ emptyState?.label || emptyText || 'No records found.' }}</span>
                <span v-if="emptyState?.description" class="empty-state__desc">{{ emptyState.description }}</span>
                <slot name="empty-action" />
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(row, idx) in sortedRows"
            :key="row.id ?? idx"
            class="table-row"
            :class="{ 'is-clickable': rowClickable }"
            @click="rowClickable ? $emit('row-click', row) : undefined"
          >
            <td
              v-for="col in normalizedColumns"
              :key="col.key"
              :class="[
                col.align ? `text-${col.align}` : '',
                col.key === 'actions' ? 'actions-cell' : '',
              ]"
            >
              <template v-if="col.key === 'actions'">
                <div class="actions-cell__inner">
                  <slot v-if="$slots['cell-actions']" name="cell-actions" :row="row" :value="row[col.key]" />
                  <slot v-else-if="$slots.actions" name="actions" :row="row" />
                </div>
              </template>
              <template v-else>
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="app-table-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
export interface TableColumn {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  rows: any[]
  loading?: boolean
  skeletonRows?: number
  emptyText?: string
  emptyIcon?: string
  emptyState?: { icon?: string; label?: string; description?: string }
  error?: string | null
  onRetry?: () => void
  rowClickable?: boolean
}>(), {
  loading: false,
  skeletonRows: 5,
  rowClickable: false,
})

const emit = defineEmits<{
  'row-click': [row: any]
  'sort': [payload: { key: string; order: 'asc' | 'desc' }]
}>()

const slots = useSlots()

const normalizedColumns = computed<TableColumn[]>(() => {
  const cols = [...props.columns]
  const hasActionsCol = cols.some(c => c.key === 'actions')
  if (!hasActionsCol && (slots.actions || slots['cell-actions'])) {
    cols.push({ key: 'actions', label: 'Actions', align: 'right' })
  }
  return cols
})

const sortKey = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  emit('sort', { key: sortKey.value, order: sortOrder.value })
}

const sortedRows = computed<any[]>(() => {
  if (!sortKey.value) return props.rows
  const key = sortKey.value
  const dir = sortOrder.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const va = a?.[key]
    const vb = b?.[key]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    const na = Number(va)
    const nb = Number(vb)
    if (!Number.isNaN(na) && !Number.isNaN(nb) && typeof va !== 'boolean' && va !== '' && vb !== '') {
      return (na - nb) * dir
    }
    return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
})
</script>

<style scoped>
.app-table-wrap {
  width: 100%;
}

.app-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.app-table thead tr {
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
}

.app-table th {
  padding: 10px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  user-select: none;
}

.app-table__th-sortable {
  cursor: pointer;
  transition: color 0.12s, background 0.12s;
}

.app-table__th-sortable:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-hover, #f1f5f9);
}

.app-table__th-inner {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-table__th-actions {
  text-align: right !important;
}

.app-table td {
  padding: 11px 16px;
  color: var(--text-primary, #0f172a);
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  vertical-align: middle;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background: var(--surface-hover, #f1f5f9);
}

.table-row.is-clickable {
  cursor: pointer;
}

.actions-cell {
  text-align: right;
  white-space: nowrap;
}

.actions-cell__inner {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.empty-cell {
  text-align: center;
  padding: 44px 20px !important;
  color: var(--text-tertiary, #64748b);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.empty-state__icon {
  width: 28px;
  height: 28px;
  color: var(--text-muted, #94a3b8);
  margin-bottom: 2px;
}

.empty-state__title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
}

.empty-state__desc {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  max-width: 360px;
}

.skeleton-row td {
  padding: 12px 16px;
}

.skeleton-cell {
  height: 14px;
  width: 75%;
  border-radius: var(--radius-sm, 4px);
  background: linear-gradient(90deg, var(--surface-hover, #f1f5f9) 25%, var(--surface-active, #e2e8f0) 50%, var(--surface-hover, #f1f5f9) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.app-table-footer {
  padding: 11px 16px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
