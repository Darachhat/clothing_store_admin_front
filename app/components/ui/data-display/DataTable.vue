<template>
  <div class="app-table-wrap" :class="`is-mobile-${mobileMode}`">
    <!-- Mobile Toolbar: Sort & View Mode Switcher (<768px) -->
    <div v-if="!loading && !error && sortedRows.length > 0" class="app-table-mobile-bar">
      <div v-if="sortableColumns.length > 0" class="app-table-mobile-sort">
        <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
        <select
          class="app-table-mobile-sort__select"
          :value="sortKey"
          aria-label="Sort records by"
          @change="onMobileSortSelect(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sort: Default</option>
          <option v-for="sc in sortableColumns" :key="sc.key" :value="sc.key">
            Sort: {{ sc.label }} ({{ sortKey === sc.key ? (sortOrder === 'asc' ? 'A→Z / Low→High' : 'Z→A / High→Low') : 'Asc' }})
          </option>
        </select>
        <button
          v-if="sortKey"
          type="button"
          class="app-table-mobile-sort__dir"
          :title="sortOrder === 'asc' ? 'Ascending' : 'Descending'"
          @click="toggleSort(sortKey)"
        >
          <UIcon
            :name="sortOrder === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down'"
            class="w-3.5 h-3.5"
          />
        </button>
      </div>
      <div v-else class="text-xs text-gray-500 font-medium">
        {{ sortedRows.length }} {{ sortedRows.length === 1 ? 'record' : 'records' }}
      </div>

      <div class="app-table-view-switch" role="group" aria-label="View mode">
        <button
          type="button"
          class="view-switch-btn"
          :class="{ 'is-active': mobileMode === 'cards' }"
          title="Card view"
          @click="mobileMode = 'cards'"
        >
          <UIcon name="i-heroicons-squares-2x2" class="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
        <button
          type="button"
          class="view-switch-btn"
          :class="{ 'is-active': mobileMode === 'table' }"
          title="Table view"
          @click="mobileMode = 'table'"
        >
          <UIcon name="i-heroicons-table-cells" class="w-3.5 h-3.5" />
          <span>Table</span>
        </button>
      </div>
    </div>

    <!-- Mobile Record Cards (<768px when mobileMode === 'cards' and rows exist) -->
    <div v-if="!loading && !error && sortedRows.length > 0 && mobileMode === 'cards'" class="app-table-mobile-cards">
      <div
        v-for="(row, idx) in sortedRows"
        :key="row[rowKey] ?? idx"
        class="mobile-record-card"
        :class="{ 'is-clickable': rowClickable }"
        @click="rowClickable ? $emit('row-click', row) : undefined"
      >
        <!-- Card Header: Primary Identifier + Status Badge -->
        <div v-if="primaryColumn" class="mobile-record-card__header">
          <div class="mobile-record-card__primary">
            <slot :name="`cell-${primaryColumn.key}`" :row="row" :value="row[primaryColumn.key]">
              <span class="font-semibold text-gray-900">{{ row[primaryColumn.key] ?? '—' }}</span>
            </slot>
          </div>
          <div v-if="statusColumn" class="mobile-record-card__status">
            <slot :name="`cell-${statusColumn.key}`" :row="row" :value="row[statusColumn.key]">
              {{ row[statusColumn.key] ?? '—' }}
            </slot>
          </div>
        </div>

        <!-- Card Primary Body Fields -->
        <div v-if="visibleBodyColumns.length > 0" class="mobile-record-card__grid">
          <div
            v-for="col in visibleBodyColumns"
            :key="col.key"
            class="mobile-record-card__field"
          >
            <span class="mobile-record-card__label">{{ col.label }}</span>
            <div class="mobile-record-card__val">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </div>
          </div>
        </div>

        <!-- Card Expandable Secondary Fields -->
        <template v-if="extraBodyColumns.length > 0">
          <div v-if="isCardExpanded(row[rowKey] ?? idx)" class="mobile-record-card__grid mobile-record-card__grid--extra">
            <div
              v-for="col in extraBodyColumns"
              :key="col.key"
              class="mobile-record-card__field"
            >
              <span class="mobile-record-card__label">{{ col.label }}</span>
              <div class="mobile-record-card__val">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="mobile-record-card__expand-btn"
            @click.stop="toggleCardExpand(row[rowKey] ?? idx)"
          >
            <span>{{ isCardExpanded(row[rowKey] ?? idx) ? 'Hide details' : `More details (${extraBodyColumns.length})` }}</span>
            <UIcon
              :name="isCardExpanded(row[rowKey] ?? idx) ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-3.5 h-3.5"
            />
          </button>
        </template>

        <!-- Card Actions Footer -->
        <div v-if="hasActionsColumn" class="mobile-record-card__actions" @click.stop>
          <slot v-if="$slots['cell-actions']" name="cell-actions" :row="row" :value="row.actions" />
          <slot v-else-if="$slots.actions" name="actions" :row="row" />
        </div>
      </div>
    </div>

    <!-- Standard Desktop/Tablet Table (and Mobile when mobileMode === 'table' or loading/empty) -->
    <div class="app-table-scroll" :class="{ 'hide-on-mobile-cards': !loading && !error && sortedRows.length > 0 && mobileMode === 'cards' }">
      <table class="app-table">
        <thead>
          <tr>
            <th v-if="selectable" class="app-table__th-select">
              <input
                type="checkbox"
                :checked="allSelected"
                aria-label="Select all rows"
                @change="toggleSelectAll"
              />
            </th>
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
              <td v-if="selectable"><div class="skeleton-cell" style="width: 16px;" /></td>
              <td v-for="col in normalizedColumns" :key="col.key">
                <div class="skeleton-cell" :style="col.key === 'actions' ? 'width: 60%; margin-left: auto;' : ''" />
              </td>
            </tr>
          </template>
          <tr v-else-if="error">
            <td :colspan="normalizedColumns.length + (selectable ? 1 : 0)" class="empty-cell">
              <div class="empty-state">
                <UIcon name="i-heroicons-exclamation-triangle" class="empty-state__icon text-amber-600" />
                <span class="empty-state__title">{{ error }}</span>
                <BaseButton v-if="onRetry" size="sm" variant="default" icon="i-heroicons-arrow-path" label="Retry" @click="onRetry" />
              </div>
            </td>
          </tr>
          <tr v-else-if="!sortedRows.length">
            <td :colspan="normalizedColumns.length + (selectable ? 1 : 0)" class="empty-cell">
              <div class="empty-state">
                <UIcon :name="emptyIcon || emptyState?.icon || 'i-heroicons-inbox'" class="empty-state__icon" />
                <span class="empty-state__title">{{ emptyTitle || emptyState?.label || emptyText || 'No records found.' }}</span>
                <span v-if="emptyState?.description || (emptyTitle && emptyText)" class="empty-state__desc">
                  {{ emptyState?.description || emptyText }}
                </span>
                <slot name="empty-action" />
              </div>
            </td>
          </tr>
          <template v-else>
            <tr
              v-for="(row, idx) in sortedRows"
              :key="row[rowKey] ?? idx"
              class="table-row"
              :class="{ 'is-clickable': rowClickable }"
              @click="rowClickable ? $emit('row-click', row) : undefined"
            >
              <td v-if="selectable" class="app-table__td-select" @click.stop>
                <input
                  type="checkbox"
                  :checked="isRowSelected(row[rowKey] ?? idx)"
                  :aria-label="`Select row ${idx + 1}`"
                  @change="toggleRowSelect(row[rowKey] ?? idx)"
                />
              </td>
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
          </template>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="app-table-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '~/types'

export type { TableColumn }

const props = withDefaults(defineProps<{
  columns: TableColumn[]
  rows: any[]
  rowKey?: string
  loading?: boolean
  skeletonRows?: number
  emptyTitle?: string
  emptyText?: string
  emptyIcon?: string
  emptyState?: { icon?: string; label?: string; description?: string }
  error?: string | null
  onRetry?: () => void
  rowClickable?: boolean
  selectable?: boolean
  selected?: Array<string | number>
  defaultMobileMode?: 'cards' | 'table'
}>(), {
  rowKey: 'id',
  loading: false,
  skeletonRows: 5,
  rowClickable: false,
  selectable: false,
  selected: () => [],
  defaultMobileMode: 'cards',
})

const emit = defineEmits<{
  'row-click': [row: any]
  'sort': [payload: { key: string; order: 'asc' | 'desc' }]
  'update:selected': [selected: Array<string | number>]
}>()

const slots = useSlots()

const mobileMode = ref<'cards' | 'table'>(props.defaultMobileMode)
const expandedCardKeys = ref<Set<string | number>>(new Set())

function isCardExpanded(key: string | number): boolean {
  return expandedCardKeys.value.has(key)
}

function toggleCardExpand(key: string | number) {
  const next = new Set(expandedCardKeys.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expandedCardKeys.value = next
}

function isRowSelected(id: string | number): boolean {
  return (props.selected || []).includes(id)
}

const allSelected = computed(() => {
  if (!sortedRows.value.length) return false
  return sortedRows.value.every((r, idx) => isRowSelected(r[props.rowKey] ?? idx))
})

function toggleSelectAll() {
  if (allSelected.value) {
    emit('update:selected', [])
  } else {
    emit('update:selected', sortedRows.value.map((r, idx) => r[props.rowKey] ?? idx))
  }
}

function toggleRowSelect(id: string | number) {
  const curr = props.selected || []
  const next = curr.includes(id) ? curr.filter(k => k !== id) : [...curr, id]
  emit('update:selected', next)
}

const normalizedColumns = computed<TableColumn[]>(() => {
  const cols = [...props.columns]
  const hasActionsCol = cols.some(c => c.key === 'actions')
  if (!hasActionsCol && (slots.actions || slots['cell-actions'])) {
    cols.push({ key: 'actions', label: 'Actions', align: 'right' })
  }
  return cols
})

const dataColumns = computed<TableColumn[]>(() =>
  normalizedColumns.value.filter(c => c.key !== 'actions'),
)

const hasActionsColumn = computed<boolean>(() =>
  normalizedColumns.value.some(c => c.key === 'actions'),
)

const STATUS_KEYS = new Set(['status', 'status_code', 'sale_status', 'connection', 'is_active'])

const primaryColumn = computed<TableColumn | null>(() => dataColumns.value[0] || null)

const statusColumn = computed<TableColumn | null>(() => {
  const rest = dataColumns.value.slice(1)
  return rest.find(c => STATUS_KEYS.has(c.key)) || null
})

const bodyColumns = computed<TableColumn[]>(() => {
  const pKey = primaryColumn.value?.key
  const sKey = statusColumn.value?.key
  return dataColumns.value
    .filter(c => c.key !== pKey && c.key !== sKey && !c.mobileHidden)
    .sort((a, b) => (a.mobilePriority ?? 99) - (b.mobilePriority ?? 99))
})

const visibleBodyColumns = computed<TableColumn[]>(() => bodyColumns.value.slice(0, 3))
const extraBodyColumns = computed<TableColumn[]>(() => bodyColumns.value.slice(3))

const sortableColumns = computed<TableColumn[]>(() =>
  dataColumns.value.filter(c => c.sortable),
)

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

function onMobileSortSelect(key: string) {
  if (!key) {
    sortKey.value = ''
    return
  }
  sortKey.value = key
  sortOrder.value = 'asc'
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

/* Mobile Toolbar & Cards hidden on >=768px */
.app-table-mobile-bar,
.app-table-mobile-cards {
  display: none;
}

@media (max-width: 767px) {
  .app-table-mobile-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface-inset, #f8fafc);
    border-bottom: 1px solid var(--border-subtle, #e5e7eb);
    flex-wrap: wrap;
  }

  .app-table-mobile-cards {
    display: flex;
    flex-direction: column;
    divide-y: 1px solid var(--border-subtle, #e5e7eb);
  }

  .app-table-scroll.hide-on-mobile-cards {
    display: none;
  }
}

.app-table-mobile-sort {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.app-table-mobile-sort__select {
  height: 28px;
  padding: 0 8px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  max-width: 185px;
  min-width: 0;
}

.app-table-mobile-sort__dir {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  cursor: pointer;
  flex-shrink: 0;
}

.app-table-view-switch {
  display: inline-flex;
  align-items: center;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.view-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
}

.view-switch-btn.is-active {
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
}

.mobile-record-card {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mobile-record-card:last-child {
  border-bottom: none;
}

.mobile-record-card.is-clickable {
  cursor: pointer;
}

.mobile-record-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.mobile-record-card__primary {
  min-width: 0;
  flex: 1;
  font-size: 13px;
}

.mobile-record-card__status {
  flex-shrink: 0;
}

.mobile-record-card__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  padding-top: 6px;
  border-top: 1px dashed var(--border-subtle, #e5e7eb);
}

.mobile-record-card__grid--extra {
  background: var(--surface-inset, #f8fafc);
  padding: 8px 10px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
}

@media (max-width: 359px) {
  .mobile-record-card__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.mobile-record-card__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mobile-record-card__label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-tertiary, #64748b);
}

.mobile-record-card__val {
  font-size: 12.5px;
  color: var(--text-primary, #0f172a);
  min-width: 0;
  overflow-wrap: anywhere;
}

.mobile-record-card__expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 5px 8px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  cursor: pointer;
}

.mobile-record-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}

.mobile-record-card__actions :deep(> div) {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  width: 100%;
}

.app-table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.app-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.app-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-table thead tr {
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
}

.app-table th {
  position: sticky;
  top: 0;
  background: var(--surface-inset, #f8fafc);
  box-shadow: inset 0 -1px 0 var(--border-subtle, #e5e7eb);
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

.app-table__th-select,
.app-table__td-select {
  width: 36px;
  padding-left: 14px !important;
  padding-right: 4px !important;
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

@media (max-width: 1023px) {
  .app-table th,
  .app-table td {
    padding: 9px 12px;
  }
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

@media (max-width: 639px) {
  .app-table-footer {
    padding: 10px 12px;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

