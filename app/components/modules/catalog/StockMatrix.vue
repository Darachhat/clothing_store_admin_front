<template>
  <AppCard :title="`Stock Matrix${warehouseLabel}`" class="overflow-x-auto">
    <template #header-right>
      <AppButton
        variant="ghost"
        size="xs"
        icon="i-heroicons-arrow-path"
        :loading="loading"
        aria-label="Refresh stock matrix"
        @click="loadMatrix"
      />
    </template>

    <!-- Loading -->
    <div v-if="loading && !matrix" class="py-8 flex items-center justify-center gap-2 text-ink-tertiary text-sm">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
      <span>Loading stock matrix…</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="py-6 flex flex-col items-center gap-2 text-sm text-ink-secondary">
      <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 text-ink-tertiary" />
      <span>{{ error }}</span>
      <AppButton variant="ghost" size="xs" icon="i-heroicons-arrow-path" label="Retry" @click="loadMatrix" />
    </div>

    <!-- Empty -->
    <div v-else-if="matrix && matrix.colors.length === 0 && matrix.sizes.length === 0" class="py-6 text-center text-sm text-ink-tertiary">
      No variants with stock data found.
    </div>

    <!-- Matrix Grid -->
    <template v-else-if="matrix">
      <!-- Summary row -->
      <div class="flex flex-wrap gap-3 mb-4 text-sm">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-inset border border-border-subtle">
          <UIcon name="i-heroicons-cube" class="w-3.5 h-3.5 text-ink-tertiary" />
          <span class="text-ink-secondary">Total:</span>
          <span class="font-semibold text-ink mono">{{ matrix.total_quantity }}</span>
        </span>
        <span
          v-if="matrix.low_count > 0"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-inset border border-border-subtle"
        >
          <UIcon name="i-heroicons-arrow-trending-down" class="w-3.5 h-3.5 text-ink-tertiary" />
          <span class="text-ink-secondary">Low:</span>
          <span class="font-semibold text-ink mono">{{ matrix.low_count }}</span>
        </span>
        <span
          v-if="matrix.out_count > 0"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-inset border border-border-subtle"
        >
          <UIcon name="i-heroicons-x-circle" class="w-3.5 h-3.5 text-ink-tertiary" />
          <span class="text-ink-secondary">Out:</span>
          <span class="font-semibold text-ink mono">{{ matrix.out_count }}</span>
        </span>
        <span v-if="matrix.warehouses.length > 1" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-inset border border-border-subtle">
          <UIcon name="i-heroicons-building-library" class="w-3.5 h-3.5 text-ink-tertiary" />
          <span class="text-ink-secondary">Warehouses:</span>
          <span class="font-semibold text-ink mono">{{ matrix.warehouses.length }}</span>
        </span>
      </div>

      <!-- Grid Table -->
      <div class="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
        <table class="text-sm w-full border-collapse">
          <thead>
            <tr>
              <th class="p-2 text-left text-xs font-medium text-ink-tertiary border-b border-border-subtle bg-surface-inset min-w-[110px]">
                Color \ Size
              </th>
              <th
                v-for="size in matrixSizes"
                :key="size.id ?? 'default-size'"
                class="p-2 text-center text-xs font-medium text-ink-secondary border-b border-border-subtle bg-surface-inset whitespace-nowrap"
              >
                {{ size.name }}
              </th>
              <th class="p-2 text-center text-xs font-medium text-ink-tertiary border-b border-border-subtle bg-surface-inset">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="color in matrixColors"
              :key="color.id ?? 'default-color'"
              class="group hover:bg-surface-inset/50 transition-colors"
            >
              <!-- color label -->
              <td class="p-2 border-b border-border-subtle">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="color.hex_code"
                    class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                    :style="{ background: color.hex_code }"
                  />
                  <span class="text-xs font-medium text-ink-secondary">{{ color.name }}</span>
                </div>
              </td>
              <!-- cells -->
              <td
                v-for="size in matrixSizes"
                :key="size.id ?? 'default-size'"
                class="p-1.5 border-b border-border-subtle text-center"
              >
                <span
                  :class="cellClass(getCell(color.id, size.id))"
                  :title="cellTooltip(getCell(color.id, size.id))"
                >
                  {{ cellQty(getCell(color.id, size.id)) }}
                </span>
              </td>
              <!-- row total -->
              <td class="p-2 border-b border-border-subtle text-center">
                <span class="text-xs font-semibold text-ink mono">{{ rowTotal(color.id) }}</span>
              </td>
            </tr>
            <!-- column totals -->
            <tr class="bg-surface-inset/40">
              <td class="p-2 text-xs font-medium text-ink-tertiary border-t border-border-subtle">Total</td>
              <td
                v-for="size in matrixSizes"
                :key="size.id ?? 'default-size'"
                class="p-2 text-center border-t border-border-subtle"
              >
                <span class="text-xs font-semibold text-ink mono">{{ colTotal(size.id) }}</span>
              </td>
              <td class="p-2 text-center border-t border-border-subtle">
                <span class="text-xs font-bold text-ink mono">{{ matrix.total_quantity }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap gap-3 mt-3 text-xs text-ink-tertiary">
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-green-400"></span>In Stock</span>
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>Low Stock</span>
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full bg-red-400"></span>Out of Stock</span>
        <span class="flex items-center gap-1"><span class="inline-block w-2 h-2 rounded-full border border-border-default bg-surface-inset"></span>No Variant</span>
      </div>
    </template>
  </AppCard>
</template>

<script setup lang="ts">
import type { StockMatrixResponse, StockMatrixOption, StockMatrixCell } from '~/types'

interface Props {
  productId: string
  warehouseId?: string
}

const props = defineProps<Props>()

const { getStockMatrix } = useProductApi()

const matrix = ref<StockMatrixResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const warehouseLabel = computed(() =>
  props.warehouseId ? '' : matrix.value && matrix.value.warehouses.length > 1 ? ' (All Warehouses)' : '',
)

const matrixColors = computed<StockMatrixOption[]>(() => matrix.value?.colors ?? [])
const matrixSizes = computed<StockMatrixOption[]>(() => matrix.value?.sizes ?? [])

const cellKey = (colorId: string | null | undefined, sizeId: string | null | undefined) =>
  `${colorId ?? 'null'}::${sizeId ?? 'null'}`

const cellMap = computed<Record<string, StockMatrixCell>>(() => {
  const map: Record<string, StockMatrixCell> = {}
  const list = matrix.value?.cells
  if (!Array.isArray(list)) return map
  for (const c of list) {
    map[cellKey(c.color_id, c.size_id)] = c
  }
  return map
})

function getCell(colorId: string | null | undefined, sizeId: string | null | undefined): StockMatrixCell | null {
  return cellMap.value[cellKey(colorId, sizeId)] ?? null
}

function cellClass(cell: StockMatrixCell | null): string {
  if (!cell || !cell.variant_id) {
    return 'inline-block px-2 py-1 rounded text-xs text-ink-tertiary bg-surface-inset border border-border-subtle'
  }
  const base = 'inline-block px-2 py-1 rounded text-xs font-semibold border mono'
  if (cell.stock_status === 'OUT') return `${base} bg-red-50 border-border-subtle text-red-700`
  if (cell.stock_status === 'LOW') return `${base} bg-amber-50 border-border-subtle text-amber-700`
  return `${base} bg-green-50 border-border-subtle text-green-700`
}

function cellQty(cell: StockMatrixCell | null): string {
  if (!cell || !cell.variant_id) return '—'
  return String(cell.quantity)
}

function cellTooltip(cell: StockMatrixCell | null): string | undefined {
  if (!cell || !cell.variant_id) return undefined
  const parts = [`SKU: ${cell.sku}`, `On hand: ${cell.quantity}`]
  if (cell.reorder_level > 0) parts.push(`Reorder at: ${cell.reorder_level}`)
  if (matrix.value && matrix.value.warehouses.length > 1 && cell.by_warehouse) {
    const whBreak = matrix.value.warehouses
      .map(w => `${w.name}: ${cell.by_warehouse[w.id] ?? 0}`)
      .join(', ')
    if (whBreak) parts.push(`By warehouse (${whBreak})`)
  }
  return parts.join(' | ')
}

function rowTotal(colorId: string | null | undefined): number {
  if (!matrix.value || !Array.isArray(matrix.value.cells)) return 0
  return matrix.value.cells
    .filter(c => (c.color_id ?? null) === (colorId ?? null))
    .reduce((sum, c) => sum + (c.quantity ?? 0), 0)
}

function colTotal(sizeId: string | null | undefined): number {
  if (!matrix.value || !Array.isArray(matrix.value.cells)) return 0
  return matrix.value.cells
    .filter(c => (c.size_id ?? null) === (sizeId ?? null))
    .reduce((sum, c) => sum + (c.quantity ?? 0), 0)
}

async function loadMatrix() {
  loading.value = true
  error.value = null
  try {
    const params = props.warehouseId ? { warehouse_id: props.warehouseId } : undefined
    matrix.value = await getStockMatrix(props.productId, params)
  } catch (e: any) {
    error.value = e?.data?.detail ?? e?.message ?? 'Failed to load stock matrix'
  } finally {
    loading.value = false
  }
}

defineExpose({ refresh: loadMatrix })

onMounted(loadMatrix)
</script>
