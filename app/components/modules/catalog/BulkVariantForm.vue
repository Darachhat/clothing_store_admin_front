<template>
  <AppModal :model-value="modelValue" title="Add Product Colors & Sizes" size="xl" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4">
      <!-- SAVED COLORS SUMMARY + "ADD ANOTHER COLOR?" PROMPT -->
      <div v-if="selectedColors.length > 0" class="flex flex-col gap-3">
        <div
          v-if="!isBuilderOpen"
          class="rounded-lg border border-border-default bg-surface-inset p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
        >
          <div class="flex items-start sm:items-center gap-2">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-ink shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div class="text-sm font-semibold text-ink">
                {{ lastSavedColorName ? `${lastSavedColorName} added!` : 'Color & sizes saved!' }}
                Does this product have another color?
              </div>
              <p class="text-xs text-ink-secondary m-0 mt-0.5">
                Click <strong>+ Add Another Color</strong> to configure another color, or click Generate below.
              </p>
            </div>
          </div>
          <AppButton
            type="button"
            size="xs"
            variant="primary"
            icon="i-heroicons-plus"
            label="Add Another Color"
            class="w-full sm:w-auto justify-center shrink-0"
            @click="startAddAnotherColor"
          />
        </div>

        <div class="rounded-lg border border-border-subtle bg-surface-card overflow-hidden">
          <div class="px-3 py-2 border-b border-border-subtle bg-surface-inset flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-ink uppercase tracking-wider">
              Added Colors ({{ selectedColors.length }}) · {{ activeCells.length }} Variants
            </span>
            <AppButton
              v-if="!isBuilderOpen"
              type="button"
              size="xs"
              variant="default"
              icon="i-heroicons-plus"
              label="Add Another Color"
              @click="startAddAnotherColor"
            />
          </div>
          <div class="max-h-52 overflow-y-auto divide-y divide-border-subtle">
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
                  <span class="text-ink-secondary font-normal mono">
                    ({{ getColorIncludedSizes(cGroup.key).length }} sizes)
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="text-xs underline text-ink-secondary hover:text-ink" @click="selectColorForBuilder(cGroup.key)">Edit</button>
                  <button type="button" class="text-xs underline text-ink-secondary hover:text-ink" @click="removeAddedColor(cGroup.key)">Remove</button>
                </div>
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <div
                  v-for="sItem in getColorIncludedSizes(cGroup.key)"
                  :key="sItem.id"
                  class="flex items-center justify-between gap-1.5 rounded border border-border-subtle bg-surface-inset px-2 py-1"
                >
                  <span class="text-xs font-semibold text-ink truncate">{{ sItem.name }}</span>
                  <input
                    v-model="getCell(`${cGroup.key}::${sItem.id}`).stock"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    class="h-6 w-14 rounded border border-border-subtle bg-surface-card px-1.5 text-xs text-center mono text-ink"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP-BY-STEP BUILDER: 1. CHOOSE/ADD COLOR -> 2. CHOOSE SIZES & STOCK -> SAVE COLOR -->
      <div
        v-if="isBuilderOpen || selectedColors.length === 0"
        class="rounded-lg border border-border-default bg-surface-card overflow-hidden flex flex-col"
      >
        <div class="px-3 py-2 border-b border-border-subtle bg-surface-inset flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-ink uppercase tracking-wider">
            {{ activeBuilderColorId ? `Step 2 — Select Sizes & Stock for ${activeBuilderColorName}` : 'Step 1 — Choose or Add a Color' }}
          </span>
          <button
            v-if="selectedColors.length > 0"
            type="button"
            class="text-xs text-ink-secondary hover:text-ink underline"
            @click="cancelColorBuilder"
          >
            Done adding colors
          </button>
        </div>

        <div class="p-3 flex flex-col gap-3">
          <!-- Colors -->
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-semibold text-ink">1. Pick one color:</span>
              <button type="button" class="inline-flex items-center gap-0.5 text-xs font-medium text-ink hover:underline" @click="showNewColor = !showNewColor">
                <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                <span>New Color</span>
              </button>
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
              <AppButton type="button" size="xs" variant="primary" icon="i-heroicons-check" label="Add & Select" :loading="creatingColor" @click="quickCreateColor" />
            </div>

            <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              <button
                v-for="c in colors"
                :key="c.id"
                type="button"
                class="inline-flex items-center gap-1.5 min-h-[34px] px-3 py-1 rounded-md text-xs font-medium border transition-colors"
                :class="activeBuilderColorId === c.id
                  ? 'bg-ink text-white border-border-default'
                  : selectedColors.includes(c.id)
                    ? 'bg-surface-card text-ink border-border-default'
                    : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                @click="selectColorForBuilder(c.id)"
              >
                <span
                  v-if="(c as any).hex_code"
                  class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle shrink-0"
                  :style="{ background: (c as any).hex_code }"
                />
                <span>{{ c.name }}</span>
                <UIcon v-if="selectedColors.includes(c.id)" name="i-heroicons-check-circle" class="w-3.5 h-3.5 shrink-0" />
              </button>
              <p v-if="colors.length === 0" class="text-xs text-ink-tertiary italic m-0">No colors configured.</p>
            </div>
          </div>

          <!-- Sizes & Stock for Selected Color -->
          <div v-if="activeBuilderColorId" class="rounded-lg border border-border-subtle bg-surface-inset p-3 flex flex-col gap-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-semibold text-ink">
                2. Choose sizes for <strong>{{ activeBuilderColorName }}</strong> &amp; enter stock:
              </span>
              <div class="flex items-center gap-2 text-xs text-ink-secondary">
                <button type="button" class="underline hover:text-ink" @click="setDraftAllSizes(true)">All Sizes</button>
                <button type="button" class="underline hover:text-ink" @click="setDraftAllSizes(false)">Clear</button>
                <button type="button" class="inline-flex items-center gap-0.5 font-medium text-ink hover:underline" @click="showNewSize = !showNewSize">
                  <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
                  <span>New Size</span>
                </button>
              </div>
            </div>

            <div v-if="showNewSize" class="flex flex-wrap items-center gap-1.5 rounded-md border border-border-subtle bg-surface-card p-2">
              <AppInput
                id="bvf-new-size"
                v-model="newSizeName"
                class="flex-1 min-w-[120px]"
                placeholder="Size name (e.g. S, M, L)"
                @keydown.enter.prevent="quickCreateSize"
              />
              <AppButton type="button" size="xs" variant="primary" icon="i-heroicons-check" label="Add & Select" :loading="creatingSize" @click="quickCreateSize" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              <div
                v-for="s in sizes"
                :key="s.id"
                class="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                :class="getDraftSize(s.id).included ? 'bg-surface-card border-border-default' : 'bg-surface-card/50 border-border-subtle opacity-65'"
              >
                <label class="inline-flex items-center gap-1.5 text-xs font-semibold text-ink cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    v-model="getDraftSize(s.id).included"
                    class="h-4 w-4 rounded border-border-default text-ink cursor-pointer shrink-0"
                  />
                  <span class="truncate">{{ s.name }}</span>
                </label>
                <input
                  v-if="getDraftSize(s.id).included"
                  v-model="getDraftSize(s.id).stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Stock"
                  class="h-7 w-16 rounded border border-border-subtle bg-surface-inset px-1.5 text-xs text-center mono text-ink"
                  @keydown.enter.prevent="commitActiveColor()"
                />
                <span v-else class="text-[11px] text-ink-tertiary cursor-pointer" @click="getDraftSize(s.id).included = true">
                  Select
                </span>
              </div>
            </div>

            <div class="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs text-ink-secondary">
                Selected: <strong class="text-ink">{{ activeDraftCount }}</strong> size{{ activeDraftCount === 1 ? '' : 's' }}
              </span>
              <AppButton
                type="button"
                size="xs"
                variant="primary"
                icon="i-heroicons-check"
                :disabled="activeDraftCount === 0"
                :label="`Save ${activeBuilderColorName} (${activeDraftCount} Size${activeDraftCount === 1 ? '' : 's'})`"
                @click="commitActiveColor()"
              />
            </div>
          </div>
        </div>
      </div>

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
          :disabled="activeCells.length === 0 && activeDraftCount === 0"
          type="button"
          class="w-full sm:w-auto justify-center"
          @click="submit"
        >
          Generate {{ (activeCells.length || activeDraftCount) > 0 ? (activeCells.length || activeDraftCount) : '' }} Variant{{ (activeCells.length || activeDraftCount) === 1 ? '' : 's' }}
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

const isBuilderOpen = ref(true)
const activeBuilderColorId = ref<string | null>(null)
const lastSavedColorName = ref('')

const showNewColor = ref(false)
const newColorName = ref('')
const newColorHex = ref('#000000')
const creatingColor = ref(false)
const showNewSize = ref(false)
const newSizeName = ref('')
const creatingSize = ref(false)

interface GridCellState {
  included: boolean
  stock: number | string
}
const cellMap = reactive<Record<string, GridCellState>>({})
const draftSizes = reactive<Record<string, GridCellState>>({})

function getCell(key: string): GridCellState {
  if (!cellMap[key]) {
    cellMap[key] = {
      included: false,
      stock: '',
    }
  }
  return cellMap[key]!
}

function getDraftSize(sizeId: string): GridCellState {
  if (!draftSizes[sizeId]) {
    draftSizes[sizeId] = { included: false, stock: '' }
  }
  return draftSizes[sizeId]!
}

const activeBuilderColorName = computed(() =>
  colors.value.find(c => c.id === activeBuilderColorId.value)?.name || 'Selected Color',
)

const activeDraftCount = computed(() =>
  sizes.value.filter(s => getDraftSize(s.id).included).length,
)

function selectColorForBuilder(colorId: string) {
  activeBuilderColorId.value = colorId
  isBuilderOpen.value = true
  const alreadySaved = selectedColors.value.includes(colorId)
  for (const s of sizes.value) {
    const existing = cellMap[`${colorId}::${s.id}`]
    if (alreadySaved && existing) {
      draftSizes[s.id] = { included: existing.included, stock: existing.stock }
    } else {
      draftSizes[s.id] = { included: false, stock: '' }
    }
  }
}

function setDraftAllSizes(included: boolean) {
  for (const s of sizes.value) {
    getDraftSize(s.id).included = included
  }
}

function syncSelectedSizes() {
  const used = new Set<string>()
  for (const cId of selectedColors.value) {
    for (const s of sizes.value) {
      if (cellMap[`${cId}::${s.id}`]?.included) used.add(s.id)
    }
  }
  selectedSizes.value = sizes.value.filter(s => used.has(s.id)).map(s => s.id)
}

function commitActiveColor(silent = false): boolean {
  const cId = activeBuilderColorId.value
  if (!cId) return false
  if (activeDraftCount.value === 0) {
    if (!silent) {
      addToast({ type: 'warn', title: 'Select at least one size', message: `Choose sizes for ${activeBuilderColorName.value}.` })
    }
    return false
  }
  if (!selectedColors.value.includes(cId)) {
    selectedColors.value.push(cId)
  }
  for (const s of sizes.value) {
    const d = getDraftSize(s.id)
    const cell = getCell(`${cId}::${s.id}`)
    cell.included = d.included
    cell.stock = d.included ? d.stock : ''
  }
  syncSelectedSizes()
  lastSavedColorName.value = activeBuilderColorName.value
  activeBuilderColorId.value = null
  isBuilderOpen.value = false
  return true
}

function startAddAnotherColor() {
  activeBuilderColorId.value = null
  isBuilderOpen.value = true
}

function cancelColorBuilder() {
  activeBuilderColorId.value = null
  if (selectedColors.value.length > 0) isBuilderOpen.value = false
}

function removeAddedColor(colorId: string) {
  const idx = selectedColors.value.indexOf(colorId)
  if (idx !== -1) selectedColors.value.splice(idx, 1)
  for (const s of sizes.value) {
    if (cellMap[`${colorId}::${s.id}`]) cellMap[`${colorId}::${s.id}`]!.included = false
  }
  syncSelectedSizes()
  if (selectedColors.value.length === 0) isBuilderOpen.value = true
}

function getColorIncludedSizes(colorId: string): Size[] {
  return sizes.value.filter(s => getCell(`${colorId}::${s.id}`).included)
}

async function quickCreateColor() {
  const name = newColorName.value.trim()
  if (!name || creatingColor.value) return
  creatingColor.value = true
  try {
    const created = await createColor({ name, hex_code: newColorHex.value }) as Color
    colors.value.push(created)
    selectColorForBuilder(created.id)
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
    getDraftSize(created.id).included = true
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

const effectiveColors = computed(() => {
  return selectedColors.value.map((id) => {
    const c = colors.value.find(item => item.id === id)
    return { id: id as string | null, key: id, name: c?.name || 'Color', hex: (c as any)?.hex_code || undefined }
  })
})

const activeCells = computed(() => {
  const list: { colorId: string | null; sizeId: string | null; stock: number }[] = []
  for (const c of effectiveColors.value) {
    for (const s of sizes.value) {
      const cell = getCell(`${c.key}::${s.id}`)
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

const warehouseOptions = computed(() => [
  { label: 'Default Warehouse', value: '' },
  ...warehouses.value.map(w => ({ label: w.name, value: w.id })),
])

const num = (v: number | string) => (v === '' || v == null ? 0 : Number(v))

async function submit() {
  submitted.value = true
  result.value = null
  if (isBuilderOpen.value && activeBuilderColorId.value && activeDraftCount.value > 0) {
    commitActiveColor(true)
  }
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

