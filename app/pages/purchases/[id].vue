<template>
  <div class="page-root">
    <AppPageHeader
      :title="po?.po_number || 'Purchase Order Detail'"
      :description="po?.supplier_name ? `Supplier: ${po.supplier_name}` : 'Purchase Order Detail'"
      :breadcrumbs="[
        { label: 'Purchasing', to: '/purchases' },
        { label: 'Purchase Orders', to: '/purchases' },
        { label: po?.po_number || 'Detail' },
      ]"
    >
      <template v-if="po" #badge>
        <AppBadge :color="poStatusColor((po as any).status_code || po.status)" size="sm">
          {{ (po as any).status_code || po.status }}
        </AppBadge>
      </template>
      <template v-if="po" #actions>
        <AppButton
          v-if="['DRAFT', 'ORDERED', 'PARTIAL'].includes((po as any).status_code || po.status)"
          variant="primary"
          size="sm"
          icon="i-heroicons-archive-box-arrow-down"
          label="Receive Goods"
          @click="openReceiveModal"
        />
        <AppButton
          v-if="['DRAFT', 'ORDERED'].includes((po as any).status_code || po.status)"
          variant="danger"
          size="sm"
          label="Cancel PO"
          @click="showCancelConfirm = true"
        />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading purchase order…</div>

    <template v-else-if="po">
      <div class="detail-grid">
        <AppCard title="Line Items" :no-pad="true">
          <AppTable :columns="itemCols" :rows="enrichedItems" :loading="false" empty-text="No line items.">
            <template #cell-sku_display="{ row }">
              <div>
                <code class="mono font-semibold">{{ row.sku_display }}</code>
                <div v-if="row.product_display" class="text-xs text-gray-500">{{ row.product_display }}</div>
              </div>
            </template>
            <template #cell-unit_cost="{ value }">
              <span class="mono">${{ Number(value || 0).toFixed(2) }}</span>
            </template>
            <template #cell-subtotal="{ row }">
              <strong class="mono">${{ (Number(row.quantity_ordered ?? row.quantity ?? 0) * Number(row.unit_cost || 0)).toFixed(2) }}</strong>
            </template>
          </AppTable>
        </AppCard>

        <AppCard title="Order Summary">
          <dl class="detail-list">
            <div class="detail-row"><dt>PO Number</dt><dd><code class="mono font-semibold">{{ po.po_number }}</code></dd></div>
            <div class="detail-row"><dt>Supplier</dt><dd>{{ po.supplier_name ?? po.supplier_id }}</dd></div>
            <div class="detail-row">
              <dt>Status</dt>
              <dd><AppBadge :color="poStatusColor((po as any).status_code || po.status)" size="sm">{{ (po as any).status_code || po.status }}</AppBadge></dd>
            </div>
            <div class="detail-row total-row">
              <dt>Total Cost</dt>
              <dd class="mono font-bold text-base">${{ Number((po as any).total_cost ?? po.total ?? 0).toFixed(2) }}</dd>
            </div>
            <div class="detail-row">
              <dt>Expected</dt>
              <dd>{{ po.expected_at ? new Date(po.expected_at).toLocaleDateString() : '—' }}</dd>
            </div>
            <div v-if="po.received_at" class="detail-row">
              <dt>Received</dt>
              <dd>{{ new Date(po.received_at).toLocaleDateString() }}</dd>
            </div>
            <div v-if="po.notes" class="detail-row">
              <dt>Notes</dt>
              <dd>{{ po.notes }}</dd>
            </div>
          </dl>
        </AppCard>
      </div>
    </template>

    <AppErrorState v-else title="Purchase order not found" @retry="loadPo" />

    <!-- Receive Modal (Pre-populated with PO line items) -->
    <AppModal
      v-model="showReceive"
      title="Receive Purchase Order Goods"
      description="Confirm the quantities received into warehouse stock for each ordered SKU."
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleReceive">
        <div v-for="(item, idx) in receiveItems" :key="idx" class="flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <div class="min-w-0 flex-1">
            <div class="font-mono text-xs font-semibold text-gray-900">{{ item.sku_display }}</div>
            <div class="text-xs text-gray-500">
              {{ item.product_display }} · Ordered: {{ item.ordered_qty }} (Received so far: {{ item.already_received }})
            </div>
          </div>
          <div class="w-28">
            <input
              v-model.number="item.quantity_received"
              type="number"
              min="0"
              :max="Math.max(1, item.ordered_qty)"
              class="field-input mono text-right"
              required
            />
          </div>
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showReceive = false" />
          <AppButton type="submit" variant="primary" label="Confirm Receipt" :loading="receiving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showCancelConfirm"
      title="Cancel Purchase Order"
      variant="danger"
      confirm-label="Cancel PO"
      :loading="cancelling"
      :message="`Are you sure you want to cancel purchase order ${po?.po_number}?`"
      consequence="Cancelled purchase orders cannot receive stock."
      @confirm="handleCancel"
    />
  </div>
</template>

<script setup lang="ts">
import type { PurchaseOrder } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'PO Detail — Clothing Store Admin' })

const { getPurchase, receivePurchase, cancelPurchase } = usePurchaseApi()
const variantApi = useVariantApi()
const { addToast } = useAppToast()

const po = ref<PurchaseOrder | null>(null)
const variants = ref<any[]>([])
const loading = ref(true)
const showReceive = ref(false)
const receiving = ref(false)
const showCancelConfirm = ref(false)
const cancelling = ref(false)

const receiveItems = ref<Array<{
  variant_id: string
  sku_display: string
  product_display: string
  ordered_qty: number
  already_received: number
  quantity_received: number
}>>([])

const itemCols = [
  { key: 'sku_display', label: 'SKU / Product' },
  { key: 'ordered_qty', label: 'Ordered' },
  { key: 'received_quantity', label: 'Received' },
  { key: 'unit_cost', label: 'Unit Cost' },
  { key: 'subtotal', label: 'Subtotal' },
]

const variantMap = computed<Record<string, any>>(() => {
  const m: Record<string, any> = {}
  for (const v of variants.value) {
    if (v?.id) m[v.id] = v
  }
  return m
})

const enrichedItems = computed(() => {
  const raw = (po.value as any)?.items || []
  return raw.map((it: any) => {
    const v = variantMap.value[it.variant_id]
    const orderedQty = Number(it.quantity_ordered ?? it.quantity ?? 0)
    return {
      ...it,
      sku_display: it.sku || v?.sku || String(it.variant_id || '').slice(0, 8),
      product_display: it.product_name || v?.product_name || '',
      ordered_qty: orderedQty,
      received_quantity: Number(it.quantity_received ?? it.received_quantity ?? 0),
    }
  })
})

function poStatusColor(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'default', ORDERED: 'blue', PARTIAL: 'yellow', RECEIVED: 'green', CANCELLED: 'red',
  }
  return map[s] ?? 'default'
}

function openReceiveModal() {
  receiveItems.value = enrichedItems.value.map((it: any) => ({
    variant_id: it.variant_id,
    sku_display: it.sku_display,
    product_display: it.product_display,
    ordered_qty: it.ordered_qty,
    already_received: it.received_quantity,
    quantity_received: Math.max(0, it.ordered_qty - it.received_quantity),
  }))
  showReceive.value = true
}

async function handleReceive() {
  receiving.value = true
  try {
    await receivePurchase(id, {
      items: receiveItems.value
        .filter(i => i.quantity_received > 0)
        .map(i => ({ variant_id: i.variant_id, quantity_received: Number(i.quantity_received) })),
    })
    addToast({ type: 'success', title: 'Stock received' })
    showReceive.value = false
    po.value = await getPurchase(id) as PurchaseOrder
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    receiving.value = false
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    await cancelPurchase(id)
    addToast({ type: 'success', title: 'PO cancelled' })
    showCancelConfirm.value = false
    po.value = await getPurchase(id) as PurchaseOrder
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    cancelling.value = false
  }
}

async function loadPo() {
  loading.value = true
  try {
    const [poRes, vRes] = await Promise.all([
      getPurchase(id),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    po.value = poRes as PurchaseOrder
    variants.value = (vRes as any[]) || []
  } finally {
    loading.value = false
  }
}

onMounted(loadPo)
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 860px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
