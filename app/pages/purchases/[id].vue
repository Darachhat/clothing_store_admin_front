<template>
  <div class="page-root">
    <AppPageHeader
      :title="po?.po_number || 'Purchase Order Detail'"
      :description="poSupplierName ? `Supplier: ${poSupplierName}` : 'Purchase Order Detail'"
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
          v-if="((po as any).status_code || po.status) === 'DRAFT'"
          variant="default"
          size="sm"
          icon="i-heroicons-check"
          label="Approve"
          :loading="approving"
          @click="handleApprove"
        />
        <AppButton
          v-if="['DRAFT', 'APPROVED', 'ORDERED', 'PARTIAL', 'PARTIALLY_RECEIVED'].includes((po as any).status_code || po.status)"
          variant="primary"
          size="sm"
          icon="i-heroicons-archive-box-arrow-down"
          label="Receive Goods"
          @click="openReceiveModal"
        />
        <AppButton
          v-if="['DRAFT', 'APPROVED', 'ORDERED'].includes((po as any).status_code || po.status)"
          variant="danger"
          size="sm"
          label="Cancel PO"
          @click="showCancelConfirm = true"
        />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading purchase order…</div>

    <template v-else-if="po">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start">
        <div class="space-y-4">
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
                <strong class="mono">${{ Number(row.subtotal ?? row.total_cost ?? (Number(row.quantity_ordered ?? row.quantity ?? 0) * Number(row.unit_cost || 0))).toFixed(2) }}</strong>
              </template>
            </AppTable>
          </AppCard>

          <AppCard title="Goods Receipts" :no-pad="true">
            <AppTable :columns="receiptCols" :rows="receipts" :loading="loadingReceipts" empty-text="No goods receipts recorded yet.">
              <template #cell-gr_number="{ row }">
                <code class="mono font-semibold">{{ row.gr_number || row.receipt_number || '—' }}</code>
              </template>
              <template #cell-created_at="{ row }">
                <span class="text-xs text-gray-500">{{ fmtDate(row.received_at || row.created_at || row.created_datetime || '') }}</span>
              </template>
              <template #cell-notes="{ row }">
                <span>{{ row.notes || row.note || '—' }}</span>
              </template>
            </AppTable>
          </AppCard>
        </div>

        <AppCard title="Order Summary">
          <dl class="detail-list">
            <div class="detail-row"><dt>PO Number</dt><dd><code class="mono font-semibold">{{ po.po_number }}</code></dd></div>
            <div class="detail-row"><dt>Supplier</dt><dd>{{ poSupplierName || po.supplier_id }}</dd></div>
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
              <dd>{{ (po as any).expected_date || (po as any).expected_delivery_date || po.expected_at || '—' }}</dd>
            </div>
            <div class="detail-row">
              <dt>Created</dt>
              <dd>{{ fmtDate(po.created_at || po.created_datetime || '') }}</dd>
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
      title="Record Goods Receipt"
      description="Confirm the quantities received into warehouse stock for each ordered SKU."
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleReceive">
        <div v-for="(item, idx) in receiveItems" :key="idx" class="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
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
        <div class="form-field">
          <label class="field-label">Receipt Note</label>
          <textarea v-model="receiveNote" class="field-input field-textarea" rows="2" placeholder="Optional delivery note..." />
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

const { getOrder, approveOrder, cancelOrder, listReceipts, createReceipt } = usePurchaseApi()
const variantApi = useVariantApi()
const { addToast } = useAppToast()

const po = ref<PurchaseOrder | null>(null)
const receipts = ref<any[]>([])
const variants = ref<any[]>([])
const loading = ref(true)
const loadingReceipts = ref(false)
const approving = ref(false)
const showReceive = ref(false)
const receiving = ref(false)
const showCancelConfirm = ref(false)
const cancelling = ref(false)
const receiveNote = ref('')

const receiveItems = ref<Array<{
  purchase_item_id?: string
  variant_id: string
  sku_display: string
  product_display: string
  ordered_qty: number
  already_received: number
  quantity_received: number
  unit_cost?: number
}>>([])

const itemCols = [
  { key: 'sku_display', label: 'SKU / Product' },
  { key: 'ordered_qty', label: 'Ordered' },
  { key: 'received_quantity', label: 'Received' },
  { key: 'unit_cost', label: 'Unit Cost' },
  { key: 'subtotal', label: 'Subtotal' },
]

const receiptCols = [
  { key: 'gr_number', label: 'Receipt #' },
  { key: 'created_at', label: 'Date' },
  { key: 'notes', label: 'Note' },
]

const poSupplierName = computed(() =>
  (po.value as any)?.supplier?.name || po.value?.supplier_name || '',
)

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
      product_display: it.product_name || v?.product?.name || v?.product_name || '',
      ordered_qty: orderedQty,
      received_quantity: Number(it.quantity_received ?? it.received_quantity ?? 0),
    }
  })
})

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

function poStatusColor(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'default',
    APPROVED: 'yellow',
    ORDERED: 'blue',
    PARTIAL: 'yellow',
    PARTIALLY_RECEIVED: 'yellow',
    RECEIVED: 'green',
    CANCELLED: 'red',
  }
  return map[s] ?? 'default'
}

function openReceiveModal() {
  receiveNote.value = ''
  receiveItems.value = enrichedItems.value.map((it: any) => ({
    purchase_item_id: it.id,
    variant_id: it.variant_id,
    sku_display: it.sku_display,
    product_display: it.product_display,
    ordered_qty: it.ordered_qty,
    already_received: it.received_quantity,
    quantity_received: Math.max(0, it.ordered_qty - it.received_quantity),
    unit_cost: Number(it.unit_cost || 0),
  }))
  showReceive.value = true
}

async function handleApprove() {
  approving.value = true
  try {
    await approveOrder(id)
    addToast({ type: 'success', title: 'Order approved' })
    await loadPo()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    approving.value = false
  }
}

async function handleReceive() {
  receiving.value = true
  try {
    await createReceipt({
      purchase_order_id: id,
      notes: receiveNote.value || null,
      note: receiveNote.value || null,
      items: receiveItems.value
        .filter(i => i.quantity_received > 0)
        .map(i => ({
          purchase_item_id: i.purchase_item_id,
          variant_id: i.variant_id,
          quantity_received: Number(i.quantity_received),
          unit_cost: i.unit_cost,
        })),
    })
    addToast({ type: 'success', title: 'Stock received' })
    showReceive.value = false
    await loadPo()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    receiving.value = false
  }
}

async function handleCancel() {
  cancelling.value = true
  try {
    await cancelOrder(id)
    addToast({ type: 'success', title: 'PO cancelled' })
    showCancelConfirm.value = false
    await loadPo()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    cancelling.value = false
  }
}

async function loadPo() {
  loading.value = true
  loadingReceipts.value = true
  try {
    const [poRes, recRes, vRes] = await Promise.all([
      getOrder(id),
      listReceipts(id).catch(() => []),
      variantApi.listVariants({ limit: 200 }).catch(() => []),
    ])
    po.value = poRes as PurchaseOrder
    receipts.value = Array.isArray(recRes) ? recRes : ((recRes as any)?.items || [])
    variants.value = Array.isArray(vRes) ? vRes : ((vRes as any)?.items || [])
  } finally {
    loading.value = false
    loadingReceipts.value = false
  }
}

onMounted(loadPo)
</script>

