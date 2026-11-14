<template>
  <AppModal :model-value="modelValue" title="Generate Variants Grid" size="xl" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4">
      <!-- Step 1: Select colors & sizes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Colors -->
        <div class="rounded-lg border border-border-subtle bg-surface-card p-3 flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-semibold text-ink uppercase tracking-wider">1. Colors ({{ selectedColors.length }})</span>
            <div class="flex items-center gap-2 text-xs text-ink-secondary">
              <button v-if="selectedColors.length < colors.length" class="underline hover:text-ink" type="button" @click="selectAllColors">All</button>
              <button v-if="selectedColors.length > 0" class="underline hover:text-ink" type="button" @click="selectedColors = []">Clear</button>
              <button type="button" class="inline-flex items-center gap-0.5 font-medium text-ink hover:underline" @click="showNewColor = !showNewColor">
                <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                <span>New Color</span>
              </button>
            </div>
          </div>

          <div v-if="showNewColor" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-2">
            <input
              v-model="newColorHex"
              type="color"
              class="w-7 h-7 rounded border border-border-subtle cursor-pointer bg-transparent p-0 shrink-0"
              title="Pick color swatch"
            />
            <AppInput
              id="bvf-new-color"
              v-model="newColorName"
              class="flex-1 min-w-[120px]"
              placeholder="Color name (e.g. Black)"
              @keydown.enter.prevent="quickCreateColor"
            />
            <AppButton type="button" size="xs" variant="primary" icon="i-heroicons-check" label="Add" :loading="creatingColor" @click="quickCreateColor" />
          </div>

          <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            <button
              v-for="c in colors"
              :key="c.id"
              type="button"
              class="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
              :class="selectedColors.includes(c.id)
                ? 'bg-ink text-white border-border-default'
                : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
              @click="toggleColor(c.id)"
            >
              <span
                v-if="(c as any).hex_code"
                class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                :style="{ background: (c as any).hex_code }"
              />
              <span>{{ c.name }}</span>
            </button>
            <p v-if="colors.length === 0" class="text-xs text-ink-tertiary italic m-0">No colors configured.</p>
          </div>
        </div>

        <!-- Sizes -->
        <div class="rounded-lg border border-border-subtle bg-surface-card p-3 flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-xs font-semibold text-ink uppercase tracking-wider">2. Sizes ({{ selectedSizes.length }})</span>
            <div class="flex items-center gap-2 text-xs text-ink-secondary">
              <button v-if="selectedSizes.length < sizes.length" class="underline hover:text-ink" type="button" @click="selectAllSizes">All</button>
              <button v-if="selectedSizes.length > 0" class="underline hover:text-ink" type="button" @click="selectedSizes = []">Clear</button>
              <button type="button" class="inline-flex items-center gap-0.5 font-medium text-ink hover:underline" @click="showNewSize = !showNewSize">
                <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                <span>New Size</span>
              </button>
            </div>
          </div>

          <div v-if="showNewSize" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-inset p-2">
            <AppInput
              id="bvf-new-size"
              v-model="newSizeName"
              class="flex-1 min-w-[120px]"
              placeholder="Size name (e.g. S, M, L)"
              @keydown.enter.prevent="quickCreateSize"
            />
            <AppButton type="button" size="xs" variant="primary" icon="i-heroicons-check" label="Add" :loading="creatingSize" @click="quickCreateSize" />
          </div>

          <div class="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            <button
              v-for="s in sizes"
              :key="s.id"
              type="button"
              class="inline-flex items-center justify-center min-h-[32px] min-w-[36px] px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
              :class="selectedSizes.includes(s.id)
                ? 'bg-ink text-white border-border-default'
                : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
              @click="toggleSize(s.id)"
            >
              <span>{{ s.name }}</span>
            </button>
            <p v-if="sizes.length === 0" class="text-xs text-ink-tertiary italic m-0">No sizes configured.</p>
          </div>
        </div>
      </div>

      <!-- Step 2: Size Availability & Opening Stock per Color -->
      <div
        v-if="selectedColors.length > 0 || selectedSizes.length > 0"
        class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden"
      >
        <div class="px-3 py-2 border-b border-border-subtle bg-surface-inset flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="text-xs font-semibold text-ink uppercase tracking-wider">3. Size Availability &amp; Stock per Color</div>
            <p class="text-xs text-ink-secondary m-0 mt-0.5">
              Tick available sizes for each color and enter the opening stock quantity (`Qty`).
            </p>
          </div>
          <div class="inline-flex items-center gap-1">
            <input
              v-model="defaults.initial_stock"
              type="number"
              min="0"
              step="1"
              placeholder="Qty"
              class="h-7 w-16 rounded-md border border-border-subtle bg-surface-card px-2 text-xs mono text-ink"
            />
            <AppButton type="button" size="xs" variant="default" label="Set All Stock" @click="applyDefaultStockToGrid" />
          </div>
        </div>

        <div class="max-h-56 overflow-y-auto divide-y divide-border-subtle">
          <div
            v-for="cGroup in effectiveColors"
            :key="cGroup.key"
            class="p-2.5 flex flex-col gap-2"
          >
            <div class="flex items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-1.5 font-semibold text-ink">
                <span
                  v-if="cGroup.hex"
                  class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                  :style="{ background: cGroup.hex }"
                />
                <span>{{ cGroup.name }}</span>
              </div>
              <div class="flex items-center gap-2 text-ink-secondary">
                <button type="button" class="underline hover:text-ink" @click="setColorAllSizes(cGroup.key, true)">All</button>
                <button type="button" class="underline hover:text-ink" @click="setColorAllSizes(cGroup.key, false)">None</button>
              </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              <div
                v-for="sGroup in effectiveSizes"
                :key="sGroup.key"
                class="flex items-center justify-between gap-1.5 rounded border border-border-subtle px-2 py-1"
                :class="getCell(`${cGroup.key}::${sGroup.key}`).included ? 'bg-surface-card' : 'bg-surface-inset opacity-45'"
              >
                <label class="inline-flex items-center gap-1.5 text-xs font-medium text-ink cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    v-model="getCell(`${cGroup.key}::${sGroup.key}`).included"
                    class="h-3.5 w-3.5 rounded border-border-default text-ink cursor-pointer shrink-0"
                  />
                  <span class="truncate">{{ sGroup.name }}</span>
                </label>
                <input
                  v-model="getCell(`${cGroup.key}::${sGroup.key}`).stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Qty"
                  :disabled="!getCell(`${cGroup.key}::${sGroup.key}`).included"
                  class="h-6 w-14 rounded border border-border-subtle bg-surface-inset px-1.5 text-xs text-center mono text-ink disabled:opacity-40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview count -->
      <p class="text-xs text-ink-secondary m-0">
        Generating <strong class="text-ink">{{ activeCells.length }}</strong> variant{{ activeCells.length === 1 ? '' : 's' }}
        (existing color+size combinations on this product are skipped automatically).
      </p>

      <!-- Defaults -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AppInput
          id="bvf-price"
          v-model="defaults.selling_price"
          type="number"
          label="Default Selling Price ($)"
          step="0.01"
          min="0.01"
          mono
          required
          :error="submitted && Number(defaults.selling_price) <= 0 ? 'Required' : undefined"
        />
        <AppInput
          id="bvf-cost"
          v-model="defaults.cost_price"
          type="number"
          label="Default Cost Price ($)"
          step="0.01"
          min="0"
          mono
        />
        <AppInput
          id="bvf-reorder"
          v-model="defaults.reorder_level"
          type="number"
          label="Reorder Level (per variant)"
          step="1"
          min="0"
          mono
        />
      </div>

      <!-- Warehouse selector -->
      <AppSelect
        id="bvf-warehouse"
        v-model="selectedWarehouse"
        label="Warehouse (for opening stock)"
        :options="warehouseOptions"
        placeholder="Default warehouse"
      />

      <!-- Result summary -->
      <div
        v-if="result"
        class="rounded-lg border border-border-subtle p-3 bg-surface-inset text-sm flex flex-col gap-1"
      >
        <p class="font-medium text-ink">
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 inline text-ink-secondary mr-1" />
          Created <strong>{{ result.created.length }}</strong> variant{{ result.created.length !== 1 ? '' : 's' }}
          <span v-if="result.skipped.length > 0" class="text-ink-secondary ml-1">
            ({{ result.skipped.length }} skipped — already exist)
          </span>
        </p>
        <ul v-if="result.skipped?.length" class="mt-1 text-xs text-ink-tertiary space-y-0.5">
          <li v-for="(sk, i) in result.skipped.slice(0, 5)" :key="i">
            Skipped: {{ sk.reason }}
          </li>
          <li v-if="result.skipped.length > 5">…and {{ result.skipped.length - 5 }} more</li>
        </ul>
      </div>
    </div>

    <!-- Actions -->
    <template #footer>
      <div class="flex flex-col-reverse sm:flex-row justify-end gap-2 w-full">
        <AppButton variant="ghost" type="button" class="w-full sm:w-auto justify-center" @click="$emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton
          variant="primary"
          icon="i-heroicons-sparkles"
          :loading="submitting"
          :disabled="activeCells.length === 0"
          type="button"
          class="w-full sm:w-auto justify-center"
          @click="submit"
        >
          Generate {{ activeCells.length > 0 ? activeCells.length : '' }} Variant{{ activeCells.length === 1 ? '' : 's' }}
        </AppButton>
      </div>
    </template>
  </AppModal>
</template>

<script setup lang="ts">
import type { Color, Size, Warehouse, BulkVariantResponse } from '~/types'

interface Props {
  modelValue: boolean
  productId: string
}
interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', result: BulkVariantResponse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { createVariantsBulk } = useProductApi()
const { listColors, listSizes, createColor, createSize } = useCatalogApi()
const { addToast } = useAppToast()

const colors = ref<Color[]>([])
const sizes = ref<Size[]>([])
const warehouses = ref<Warehouse[]>([])

const selectedColors = ref<string[]>([])
const selectedSizes = ref<string[]>([])
const selectedWarehouse = ref('')
const submitted = ref(false)
const submitting = ref(false)
const result = ref<BulkVariantResponse | null>(null)

const showNewColor = ref(false)
const newColorName = ref('')
const newColorHex = ref('#000000')
const creatingColor = ref(false)
const showNewSize = ref(false)
const newSizeName = ref('')
const creatingSize = ref(false)

async function quickCreateColor() {
  const name = newColorName.value.trim()
  if (!name || creatingColor.value) return
  creatingColor.value = true
  try {
    const created = await createColor({ name, hex_code: newColorHex.value }) as Color
    colors.value.push(created)
    selectedColors.value.push(created.id)
    newColorName.value = ''
    showNewColor.value = false
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not add color', message: e?.data?.detail ?? String(e) })
  } finally {
    creatingColor.value = false
  }
}

async function quickCreateSize() {
  const name = newSizeName.value.trim()
  if (!name || creatingSize.value) return
  creatingSize.value = true
  try {
    const created = await createSize({ name, type: 'LETTER', sort_order: sizes.value.length + 1 }) as Size
    sizes.value.push(created)
    selectedSizes.value.push(created.id)
    newSizeName.value = ''
    showNewSize.value = false
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not add size', message: e?.data?.detail ?? String(e) })
  } finally {
    creatingSize.value = false
  }
}

const defaults = reactive({
  selling_price: '' as number | string,
  cost_price: '' as number | string,
  initial_stock: 0 as number | string,
  reorder_level: 5 as number | string,
})

interface GridCellState {
  included: boolean
  stock: number | string
}
const cellMap = reactive<Record<string, GridCellState>>({})

function getCell(key: string): GridCellState {
  if (!cellMap[key]) {
    cellMap[key] = {
      included: true,
      stock: defaults.initial_stock || '',
    }
  }
  return cellMap[key]!
}

const effectiveColors = computed(() => {
  if (selectedColors.value.length > 0) {
    return selectedColors.value.map((id) => {
      const c = colors.value.find(item => item.id === id)
      return { id: id as string | null, key: id, name: c?.name || 'Color', hex: (c as any)?.hex_code || undefined }
    })
  }
  return [{ id: null as string | null, key: 'null', name: 'Standard Color', hex: undefined }]
})

const effectiveSizes = computed(() => {
  if (selectedSizes.value.length > 0) {
    return selectedSizes.value.map((id) => {
      const s = sizes.value.find(item => item.id === id)
      return { id: id as string | null, key: id, name: s?.name || 'Size' }
    })
  }
  return [{ id: null as string | null, key: 'null', name: 'Free Size' }]
})

const activeCells = computed(() => {
  const list: { colorId: string | null; sizeId: string | null; stock: number }[] = []
  for (const c of effectiveColors.value) {
    for (const s of effectiveSizes.value) {
      const cell = getCell(`${c.key}::${s.key}`)
      if (cell.included) {
        list.push({
          colorId: c.id,
          sizeId: s.id,
          stock: Math.max(0, Math.floor(Number(cell.stock) || 0)),
        })
      }
    }
  }
  return list
})

function setColorAllSizes(cKey: string, included: boolean) {
  for (const s of effectiveSizes.value) {
    getCell(`${cKey}::${s.key}`).included = included
  }
}

function applyDefaultStockToGrid() {
  const qty = Math.max(0, Math.floor(Number(defaults.initial_stock) || 0))
  for (const c of effectiveColors.value) {
    for (const s of effectiveSizes.value) {
      const cell = getCell(`${c.key}::${s.key}`)
      if (cell.included) {
        cell.stock = qty
      }
    }
  }
}

const warehouseOptions = computed(() => [
  { label: 'Default Warehouse', value: '' },
  ...warehouses.value.map(w => ({ label: w.name, value: w.id })),
])

function toggleColor(id: string) {
  const idx = selectedColors.value.indexOf(id)
  if (idx === -1) selectedColors.value.push(id)
  else selectedColors.value.splice(idx, 1)
}
function toggleSize(id: string) {
  const idx = selectedSizes.value.indexOf(id)
  if (idx === -1) selectedSizes.value.push(id)
  else selectedSizes.value.splice(idx, 1)
}
function selectAllColors() { selectedColors.value = colors.value.map(c => c.id) }
function selectAllSizes() { selectedSizes.value = sizes.value.map(s => s.id) }

const num = (v: number | string) => (v === '' || v == null ? 0 : Number(v))

async function submit() {
  submitted.value = true
  result.value = null
  if (num(defaults.selling_price) <= 0 || activeCells.value.length === 0) return

  const items = activeCells.value.map(cell => ({
    color_id: cell.colorId,
    size_id: cell.sizeId,
    selling_price: num(defaults.selling_price),
    cost_price: num(defaults.cost_price) || null,
    initial_stock: cell.stock,
    reorder_level: Math.max(0, Math.floor(num(defaults.reorder_level))),
  }))

  submitting.value = true
  try {
    const res = await createVariantsBulk(props.productId, {
      items,
      warehouse_id: selectedWarehouse.value || null,
    })
    result.value = res
    addToast({
      type: 'success',
      title: `${res.created.length} Variant${res.created.length !== 1 ? 's' : ''} Created`,
      message: res.skipped.length > 0 ? `${res.skipped.length} existing combo${res.skipped.length !== 1 ? 's' : ''} skipped.` : undefined,
    })
    emit('created', res)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const [c, s] = await Promise.all([
    listColors().catch(() => []),
    listSizes().catch(() => []),
  ])
  colors.value = Array.isArray(c) ? (c as Color[]) : ((c as any)?.items ?? [])
  sizes.value = Array.isArray(s) ? (s as Size[]) : ((s as any)?.items ?? [])
  try {
    const { apiFetch } = useApi()
    const wRes = await apiFetch<Warehouse[] | { items: Warehouse[] }>('/api/admin/v1/warehouses')
    warehouses.value = Array.isArray(wRes) ? wRes : ((wRes as any)?.items ?? [])
  } catch {
    // warehouses optional — no crash
  }
})
</script>

