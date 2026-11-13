<template>
  <AppModal v-model="modelValue" title="Generate Variants Grid" size="xl" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-5">
      <!-- Step 1: Select colors & sizes -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Colors -->
        <div>
          <p class="text-sm font-medium text-ink mb-2">Colors</p>
          <div class="rounded-lg border border-border-subtle bg-surface-inset p-3 max-h-44 overflow-y-auto space-y-1.5">
            <label
              v-for="c in colors"
              :key="c.id"
              class="flex items-center gap-2 cursor-pointer text-sm text-ink hover:text-ink transition-colors"
            >
              <input
                type="checkbox"
                :value="c.id"
                :checked="selectedColors.includes(c.id)"
                class="w-3.5 h-3.5 rounded border-border-subtle accent-primary"
                @change="toggleColor(c.id)"
              />
              <span
                v-if="(c as any).hex_code"
                class="inline-block w-3 h-3 rounded-full border border-border-subtle shrink-0"
                :style="{ background: (c as any).hex_code }"
              />
              {{ c.name }}
            </label>
            <p v-if="colors.length === 0" class="text-xs text-ink-tertiary italic">No colors configured.</p>
          </div>
          <p class="mt-1 text-xs text-ink-tertiary">
            {{ selectedColors.length }} selected
            <button v-if="selectedColors.length < colors.length" class="ml-2 underline" type="button" @click="selectAllColors">All</button>
            <button v-if="selectedColors.length > 0" class="ml-1 underline" type="button" @click="selectedColors = []">None</button>
          </p>
        </div>

        <!-- Sizes -->
        <div>
          <p class="text-sm font-medium text-ink mb-2">Sizes</p>
          <div class="rounded-lg border border-border-subtle bg-surface-inset p-3 max-h-44 overflow-y-auto space-y-1.5">
            <label
              v-for="s in sizes"
              :key="s.id"
              class="flex items-center gap-2 cursor-pointer text-sm text-ink hover:text-ink transition-colors"
            >
              <input
                type="checkbox"
                :value="s.id"
                :checked="selectedSizes.includes(s.id)"
                class="w-3.5 h-3.5 rounded border-border-subtle accent-primary"
                @change="toggleSize(s.id)"
              />
              {{ s.name }}
            </label>
            <p v-if="sizes.length === 0" class="text-xs text-ink-tertiary italic">No sizes configured.</p>
          </div>
          <p class="mt-1 text-xs text-ink-tertiary">
            {{ selectedSizes.length }} selected
            <button v-if="selectedSizes.length < sizes.length" class="ml-2 underline" type="button" @click="selectAllSizes">All</button>
            <button v-if="selectedSizes.length > 0" class="ml-1 underline" type="button" @click="selectedSizes = []">None</button>
          </p>
        </div>
      </div>

      <!-- Preview count -->
      <p class="text-sm text-ink-secondary">
        This will generate up to
        <strong class="text-ink">{{ previewCount }}</strong>
        variant{{ previewCount === 1 ? '' : 's' }}
        ({{ selectedColors.length || 1 }} color{{ selectedColors.length !== 1 ? 's' : '' }} ×
        {{ selectedSizes.length || 1 }} size{{ selectedSizes.length !== 1 ? 's' : '' }}).
        Existing color+size combos are skipped.
      </p>

      <!-- Defaults -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          id="bvf-stock"
          v-model="defaults.initial_stock"
          type="number"
          label="Opening Stock (per variant)"
          step="1"
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
          Created <strong>{{ result.created.length }}</strong> variant{{ result.created.length !== 1 ? 's' : '' }}
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
      <div class="flex justify-end gap-2">
        <AppButton variant="ghost" type="button" @click="$emit('update:modelValue', false)">Cancel</AppButton>
        <AppButton
          variant="primary"
          icon="i-heroicons-sparkles"
          :loading="submitting"
          :disabled="previewCount === 0"
          type="button"
          @click="submit"
        >
          Generate {{ previewCount > 0 ? previewCount : '' }} Variant{{ previewCount === 1 ? '' : 's' }}
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
const { listColors, listSizes } = useCatalogApi()
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

const defaults = reactive({
  selling_price: '' as number | string,
  cost_price: '' as number | string,
  initial_stock: 0 as number | string,
  reorder_level: 5 as number | string,
})

const warehouseOptions = computed(() => [
  { label: 'Default Warehouse', value: '' },
  ...warehouses.value.map(w => ({ label: w.name, value: w.id })),
])

const previewCount = computed(() => {
  const c = selectedColors.value.length || 1
  const s = selectedSizes.value.length || 1
  return c * s
})

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
  if (num(defaults.selling_price) <= 0) return

  const colorIds = selectedColors.value.length ? selectedColors.value : [null]
  const sizeIds = selectedSizes.value.length ? selectedSizes.value : [null]

  const items = colorIds.flatMap(cId =>
    sizeIds.map(sId => ({
      color_id: cId,
      size_id: sId,
      selling_price: num(defaults.selling_price),
      cost_price: num(defaults.cost_price) || null,
      initial_stock: Math.max(0, Math.floor(num(defaults.initial_stock))),
      reorder_level: Math.max(0, Math.floor(num(defaults.reorder_level))),
    })),
  )

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
  // Try loading warehouses via useApi
  try {
    const { apiFetch } = useApi()
    const wRes = await apiFetch<Warehouse[] | { items: Warehouse[] }>('/api/admin/v1/warehouses')
    warehouses.value = Array.isArray(wRes) ? wRes : ((wRes as any)?.items ?? [])
  } catch {
    // warehouses optional — no crash
  }
})
</script>

