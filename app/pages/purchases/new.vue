<template>
  <div class="page-root">
    <AppPageHeader
      title="New Purchase Order"
      description="Create a multi-line supplier purchase order."
      :breadcrumbs="[
        { label: 'Purchasing', to: '/purchases' },
        { label: 'Purchase Orders', to: '/purchases' },
        { label: 'New Purchase Order' },
      ]"
    />

    <form class="flex flex-col gap-4 max-w-[900px]" @submit.prevent="submit">
      <AppCard title="Order Information">
        <div class="form-grid">
          <div class="form-row">
            <AppSelect v-model="form.supplier_id" label="Supplier" :options="supplierOptions" required />
            <AppSelect v-model="form.warehouse_id" label="Receiving Warehouse" :options="warehouseOptions" required />
          </div>
          <div class="form-row">
            <div class="form-field">
              <label class="field-label">Expected Delivery</label>
              <input v-model="form.expected_at" type="date" class="field-input" />
            </div>
            <div class="form-field">
              <label class="field-label">Notes</label>
              <input v-model="form.notes" type="text" class="field-input" placeholder="Optional PO reference or terms…" />
            </div>
          </div>
        </div>
      </AppCard>

      <AppCard title="Line Items">
        <template #header-right>
          <AppButton type="button" size="xs" variant="default" icon="i-heroicons-plus" label="Add Line" @click="addItem" />
        </template>

        <div class="space-y-2.5">
          <div v-for="(item, idx) in items" :key="idx" class="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 p-2.5 sm:p-0 rounded-md sm:rounded-none bg-surface-inset sm:bg-transparent border sm:border-0 border-border-subtle">
            <div class="form-field flex-1">
              <label v-if="idx === 0" class="field-label">Product Variant (SKU) <span class="required">*</span></label>
              <select v-model="item.variant_id" class="field-input" required @change="onVariantSelect(item)">
                <option value="" disabled>Select SKU / Variant...</option>
                <option v-for="v in variants" :key="v.id" :value="v.id">
                  {{ v.sku }} — {{ v.product_name || 'Product' }} ({{ [v.color, v.size].filter(Boolean).join(' / ') }})
                </option>
              </select>
            </div>
            <div class="form-field w-full sm:w-28">
              <label v-if="idx === 0" class="field-label">Qty <span class="required">*</span></label>
              <input v-model="item.quantity" type="number" min="1" class="field-input mono text-right" required />
            </div>
            <div class="form-field w-full sm:w-32">
              <label v-if="idx === 0" class="field-label">Unit Cost ($) <span class="required">*</span></label>
              <input v-model="item.unit_cost" type="number" step="0.01" min="0" class="field-input mono text-right" required />
            </div>
            <div class="flex items-center self-end sm:self-auto" :class="{ 'sm:mt-5': idx === 0 }">
              <AppButton
                v-if="items.length > 1"
                type="button"
                size="xs"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="removeItem(idx)"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end items-center gap-4 pt-3 mt-3 border-t border-border-subtle text-[13px] text-ink-secondary">
          <span>Order Total</span>
          <strong class="mono text-base text-ink">${{ orderTotal }}</strong>
        </div>
      </AppCard>

      <div class="flex justify-end gap-2">
        <AppButton type="button" variant="default" label="Cancel" to="/purchases" />
        <AppButton type="submit" variant="primary" label="Create Purchase Order" icon="i-heroicons-check" :loading="saving" />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'New Purchase Order — Clothing Store Admin' })

const { createPurchase } = usePurchaseApi()
const { listSuppliers } = useSupplierApi()
const branchApi = useBranchApi()
const variantApi = useVariantApi()
const { addToast } = useAppToast()

const suppliers = ref<Supplier[]>([])
const warehouses = ref<any[]>([])
const variants = ref<any[]>([])
const saving = ref(false)

const form = reactive({ supplier_id: '', warehouse_id: '', expected_at: '', notes: '' })
const items = ref([{ variant_id: '', quantity: '10', unit_cost: '5.00' }])

const supplierOptions = computed(() => [
  { label: 'Select supplier…', value: '' },
  ...suppliers.value.map(s => ({ label: `${s.name} (${s.code})`, value: s.id })),
])

const warehouseOptions = computed(() => [
  { label: 'Select warehouse…', value: '' },
  ...warehouses.value.map(w => ({ label: w.branchName ? `${w.branchName} — ${w.name}` : w.name, value: w.id })),
])

const orderTotal = computed(() =>
  items.value.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_cost) || 0), 0).toFixed(2),
)

function addItem() {
  items.value.push({ variant_id: '', quantity: '10', unit_cost: '5.00' })
}

function removeItem(idx: number) {
  items.value.splice(idx, 1)
}

function onVariantSelect(item: { variant_id: string; quantity: string; unit_cost: string }) {
  const found = variants.value.find(v => v.id === item.variant_id)
  if (found && (found.cost_price_override || found.cost_price)) {
    item.unit_cost = String(found.cost_price_override || found.cost_price)
  }
}

async function submit() {
  if (!form.supplier_id) {
    addToast({ type: 'warn', title: 'Select a supplier' })
    return
  }
  saving.value = true
  try {
    const po = await createPurchase({
      supplier_id: form.supplier_id,
      warehouse_id: form.warehouse_id || undefined,
      expected_at: form.expected_at || null,
      notes: form.notes || null,
      items: items.value.map(i => ({
        variant_id: i.variant_id.trim(),
        quantity_ordered: Number(i.quantity),
        quantity: Number(i.quantity),
        unit_cost: Number(i.unit_cost),
      })),
    })
    addToast({ type: 'success', title: 'Purchase order created' })
    await navigateTo(`/purchases/${(po as any).id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [sList, bList, vList] = await Promise.all([
    listSuppliers().catch(() => []),
    branchApi.listBranches().catch(() => []),
    variantApi.listVariants({ limit: 200 }).catch(() => []),
  ])
  suppliers.value = (sList as Supplier[]) ?? []
  variants.value = (vList as any[]) ?? []
  const whs: any[] = []
  for (const b of (bList as any[]) || []) {
    if (b.warehouses?.length) {
      for (const w of b.warehouses) whs.push({ ...w, branchName: b.name })
    } else {
      try {
        const bw = await branchApi.listWarehouses(b.id) as any[]
        for (const w of bw || []) whs.push({ ...w, branchName: b.name })
      } catch {}
    }
  }
  warehouses.value = whs
  if (suppliers.value[0]) form.supplier_id = suppliers.value[0].id
  if (warehouses.value[0]) form.warehouse_id = warehouses.value[0].id
})
</script>

