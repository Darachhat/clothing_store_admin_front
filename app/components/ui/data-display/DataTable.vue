<template>
  <div class="w-full">
    <!-- Mobile Toolbar: Sort & View Mode Switcher (<768px) -->
    <div v-if="!loading && !error && sortedRows.length > 0" class="flex md:hidden items-center justify-between gap-2 p-2 sm:px-3 bg-surface-inset border-b border-border-subtle flex-wrap">
      <div v-if="sortableColumns.length > 0" class="flex items-center gap-1.5 min-w-0 flex-1">
        <UIcon name="i-heroicons-arrows-up-down" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <select
          class="h-7 px-2 text-xs font-medium text-ink-secondary bg-surface-card border border-border-subtle rounded max-w-[185px] min-w-0"
          :value="sortKey"
          aria-label="Sort records by"
          @change="onMobileSortSelect(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Sort: Default</option>
          <option v-for="sc in sortableColumns" :key="sc.key" :value="sc.key">
            Sort: {{ sc.label }} ({{ sortKey === sc.key ? (sortOrder === 'asc' ? 'A→Z' : 'Z→A') : 'Asc' }})
          </option>
        </select>
        <button
          v-if="sortKey"
          type="button"
          class="inline-flex items-center justify-center w-7 h-7 rounded border border-border-subtle bg-surface-card text-ink shrink-0 cursor-pointer"
          :title="sortOrder === 'asc' ? 'Ascending' : 'Descending'"
          @click="toggleSort(sortKey)"
        >
          <UIcon
            :name="sortOrder === 'asc' ? 'i-heroicons-bars-arrow-up' : 'i-heroicons-bars-arrow-down'"
            class="w-3.5 h-3.5"
          />
        </button>
      </div>
      <div v-else class="text-xs text-ink-tertiary font-medium">
        {{ sortedRows.length }} {{ sortedRows.length === 1 ? 'record' : 'records' }}
      </div>

      <div class="inline-flex items-center bg-surface-card border border-border-subtle rounded p-0.5 gap-0.5 shrink-0" role="group" aria-label="View mode">
        <button
          type="button"
          class="inline-flex items-center gap-1 h-6 px-2 text-[11px] font-semibold rounded cursor-pointer transition-colors"
          :class="mobileMode === 'cards' ? 'bg-ink text-white' : 'text-ink-tertiary hover:text-ink'"
          title="Card view"
          @click="mobileMode = 'cards'"
        >
          <UIcon name="i-heroicons-squares-2x2" class="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 h-6 px-2 text-[11px] font-semibold rounded cursor-pointer transition-colors"
          :class="mobileMode === 'table' ? 'bg-ink text-white' : 'text-ink-tertiary hover:text-ink'"
          title="Table view"
          @click="mobileMode = 'table'"
        >
          <UIcon name="i-heroicons-table-cells" class="w-3.5 h-3.5" />
          <span>Table</span>
        </button>
      </div>
    </div>

    <!-- Mobile Record Cards (<768px when mobileMode === 'cards' and rows exist) -->
    <div v-if="!loading && !error && sortedRows.length > 0 && mobileMode === 'cards'" class="flex md:hidden flex-col divide-y divide-border-subtle">
      <div
        v-for="(row, idx) in sortedRows"
        :key="row[rowKey] ?? idx"
        class="p-3 sm:px-3.5 bg-surface-card flex flex-col gap-2.5"
        :class="rowClickable && 'cursor-pointer hover:bg-surface-hover transition-colors'"
        @click="rowClickable ? $emit('row-click', row) : undefined"
      >
        <!-- Card Header: Primary Identifier + Status Badge -->
        <div v-if="primaryColumn" class="flex items-start justify-between gap-2.5">
          <div class="min-w-0 flex-1 text-xs sm:text-sm font-medium">
            <slot :name="`cell-${primaryColumn.key}`" :row="row" :value="row[primaryColumn.key]">
              <span class="font-semibold text-ink">{{ row[primaryColumn.key] ?? '—' }}</span>
            </slot>
          </div>
          <div v-if="statusColumn" class="shrink-0">
            <slot :name="`cell-${statusColumn.key}`" :row="row" :value="row[statusColumn.key]">
              {{ row[statusColumn.key] ?? '—' }}
            </slot>
          </div>
        </div>

        <!-- Card Primary Body Fields -->
        <div v-if="visibleBodyColumns.length > 0" class="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-1.5 border-t border-dashed border-border-subtle">
          <div
            v-for="col in visibleBodyColumns"
            :key="col.key"
            class="flex flex-col gap-0.5 min-w-0"
          >
            <span class="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">{{ col.label }}</span>
            <div class="text-xs text-ink min-w-0 break-words">
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '—' }}
              </slot>
            </div>
          </div>
        </div>

        <!-- Card Expandable Secondary Fields -->
        <template v-if="extraBodyColumns.length > 0">
          <div v-if="isCardExpanded(row[rowKey] ?? idx)" class="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 p-2 bg-surface-inset rounded border border-border-subtle">
            <div
              v-for="col in extraBodyColumns"
              :key="col.key"
              class="flex flex-col gap-0.5 min-w-0"
            >
              <span class="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">{{ col.label }}</span>
              <div class="text-xs text-ink min-w-0 break-words">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                  {{ row[col.key] ?? '—' }}
                </slot>
              </div>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex items-center justify-center gap-1 w-full py-1.5 px-2 text-xs font-semibold text-ink-secondary bg-surface-inset border border-border-subtle rounded cursor-pointer hover:bg-surface-hover transition-colors"
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
        <div v-if="hasActionsColumn" class="flex items-center justify-end flex-wrap gap-1.5 pt-2 border-t border-border-subtle [&>div]:flex [&>div]:flex-wrap [&>div]:justify-end [&>div]:gap-1.5 [&>div]:w-full" @click.stop>
          <slot v-if="$slots['cell-actions']" name="cell-actions" :row="row" :value="row.actions" />
          <slot v-else-if="$slots.actions" name="actions" :row="row" />
        </div>
      </div>
    </div>

    <!-- Standard Desktop/Tablet Table (and Mobile when mobileMode === 'table' or loading/empty) -->
    <div
      class="w-full overflow-x-auto"
      :class="[!loading && !error && sortedRows.length > 0 && mobileMode === 'cards' ? 'hidden md:block' : '']"
    >
      <table class="w-full border-collapse text-xs sm:text-sm">
        <thead class="sticky top-0 z-10 bg-surface-inset border-b border-border-subtle">
          <tr>
            <th v-if="selectable" class="w-9 pl-3.5 pr-1 py-2.5 bg-surface-inset shadow-[inset_0_-1px_0_var(--border-subtle,#e5e7eb)]">
              <input
                type="checkbox"
                class="rounded border-border-default text-ink focus:ring-0 focus:outline-none"
                :checked="allSelected"
                aria-label="Select all rows"
                @change="toggleSelectAll"
              />
            </th>
            <th
              v-for="col in normalizedColumns"
              :key="col.key"
              :style="col.width ? `width:${col.width}` : undefined"
              class="sticky top-0 bg-surface-inset shadow-[inset_0_-1px_0_var(--border-subtle,#e5e7eb)] py-2.5 px-3 sm:px-4 text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider whitespace-nowrap select-none"
              :class="[
                col.align ? `text-${col.align}` : 'text-left',
                col.key === 'actions' && 'text-right',
                col.sortable && 'cursor-pointer hover:text-ink hover:bg-surface-hover transition-colors',
              ]"
              @click="col.sortable ? toggleSort(col.key) : undefined"
            >
              <div
                class="inline-flex items-center gap-1 w-full"
                :class="(col.key === 'actions' || col.align === 'right') ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="inline-flex items-center">
                  <UIcon
                    v-if="sortKey === col.key"
                    :name="sortOrder === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
                    class="w-3.5 h-3.5 text-ink"
                  />
                  <UIcon
                    v-else
                    name="i-heroicons-chevron-up-down"
                    class="w-3.5 h-3.5 text-ink-tertiary"
                  />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-subtle">
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="`sk-${i}`" class="animate-pulse">
              <td v-if="selectable" class="p-2.5 sm:px-4">
                <div class="w-4 h-4 bg-surface-active rounded" />
              </td>
              <td v-for="col in normalizedColumns" :key="col.key" class="p-2.5 sm:px-4">
                <div
                  class="h-3.5 bg-surface-active rounded"
                  :class="col.key === 'actions' ? 'w-3/5 ml-auto' : 'w-3/4'"
                />
              </td>
            </tr>
          </template>
          <tr v-else-if="error">
            <td :colspan="normalizedColumns.length + (selectable ? 1 : 0)" class="text-center py-10 px-4 text-ink-tertiary">
              <div class="flex flex-col items-center justify-center gap-1.5">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-7 h-7 text-status-amber mb-0.5" />
                <span class="text-xs sm:text-sm font-medium text-ink-secondary">{{ error }}</span>
                <BaseButton v-if="onRetry" size="sm" variant="default" icon="i-heroicons-arrow-path" label="Retry" @click="onRetry" />
              </div>
            </td>
          </tr>
          <tr v-else-if="!sortedRows.length">
            <td :colspan="normalizedColumns.length + (selectable ? 1 : 0)" class="text-center py-10 px-4 text-ink-tertiary">
              <div class="flex flex-col items-center justify-center gap-1.5">
                <UIcon :name="emptyIcon || emptyState?.icon || 'i-heroicons-inbox'" class="w-7 h-7 text-ink-tertiary mb-0.5" />
                <span class="text-xs sm:text-sm font-medium text-ink-secondary">{{ emptyTitle || emptyState?.label || emptyText || 'No records found.' }}</span>
                <span v-if="emptyState?.description || (emptyTitle && emptyText)" class="text-xs text-ink-tertiary max-w-[360px]">
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
              class="hover:bg-surface-hover transition-colors"
              :class="rowClickable && 'cursor-pointer'"
              @click="rowClickable ? $emit('row-click', row) : undefined"
            >
              <td v-if="selectable" class="w-9 pl-3.5 pr-1 py-2.5" @click.stop>
                <input
                  type="checkbox"
                  class="rounded border-border-default text-ink focus:ring-0 focus:outline-none"
                  :checked="isRowSelected(row[rowKey] ?? idx)"
                  :aria-label="`Select row ${idx + 1}`"
                  @change="toggleRowSelect(row[rowKey] ?? idx)"
                />
              </td>
              <td
                v-for="col in normalizedColumns"
                :key="col.key"
                class="py-2.5 px-3 sm:px-4 text-ink align-middle"
                :class="[
                  col.align ? `text-${col.align}` : '',
                  col.key === 'actions' && 'text-right whitespace-nowrap',
                ]"
              >
                <template v-if="col.key === 'actions'">
                  <div class="inline-flex items-center justify-end gap-1">
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
    <div v-if="$slots.footer" class="p-2.5 sm:px-4 border-t border-border-subtle bg-surface-inset">
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

