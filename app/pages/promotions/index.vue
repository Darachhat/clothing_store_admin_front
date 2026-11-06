<template>
  <div class="page-root">
    <AppPageHeader
      title="Promotions"
      description="Create and manage promotional discount codes, percentage/fixed offers, and validity dates."
      :breadcrumbs="[
        { label: 'Customers', to: '/customers' },
        { label: 'Promotions' },
      ]"
      primary-label="Create Promotion"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    />

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search promotions by name or promo code..."
      :chips="statusFilter ? [{ key: 'status', label: 'Status', value: statusFilter }] : []"
      :shown-count="filteredPromotions.length"
      :total-count="promotions.length"
      count-label="promotions"
      @remove-chip="statusFilter = ''"
      @clear-all="searchQuery = ''; statusFilter = ''"
    >
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]"
        style="min-width: 145px;"
      />
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredPromotions"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-receipt-percent',
          label: 'No promotions created yet',
          description: 'Create percentage or fixed-amount promotions for POS checkout.',
        }"
      >
        <template #cell-code="{ row }">
          <code class="mono font-semibold text-gray-900">{{ row.code || '—' }}</code>
        </template>

        <template #cell-discount_type="{ row }">
          <AppBadge :color="row.discount_type === 'PERCENTAGE' ? 'blue' : 'green'" size="sm">
            {{ row.discount_type }}
          </AppBadge>
        </template>

        <template #cell-discount_value="{ row }">
          <span class="mono font-bold text-gray-900">
            {{ row.discount_type === 'PERCENTAGE' ? `${row.discount_value}%` : `$${Number(row.discount_value).toFixed(2)}` }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="ghost" label="Edit" @click="openEditModal(row)" />
            <AppButton
              v-if="(row.status_code || row.status) === 'ACTIVE'"
              size="xs"
              variant="danger"
              label="Deactivate"
              @click="promptDeactivate(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingPromo ? 'Edit Promotion' : 'New Promotion'"
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Promotion Name <span class="required">*</span></label>
            <input v-model="form.name" type="text" required placeholder="Summer Sale 20%" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Promo Code</label>
            <input v-model="form.code" type="text" placeholder="SUMMER20" class="field-input mono uppercase" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Discount Type <span class="required">*</span></label>
            <select v-model="form.discount_type" required class="field-input">
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount ($)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Discount Value <span class="required">*</span></label>
            <input v-model.number="form.discount_value" type="number" step="0.01" min="0" required class="field-input mono" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Min Order Amount ($)</label>
            <input v-model.number="form.min_order_amount" type="number" step="0.01" min="0" class="field-input mono" />
          </div>
          <div class="form-field">
            <label class="field-label">Usage Limit</label>
            <input v-model.number="form.usage_limit" type="number" min="1" placeholder="Unlimited" class="field-input mono" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Valid From <span class="required">*</span></label>
            <input v-model="form.valid_from" type="date" required class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Valid Until</label>
            <input v-model="form.valid_until" type="date" class="field-input" />
          </div>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" :label="editingPromo ? 'Save Changes' : 'Create Promotion'" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showDeactivateConfirm"
      title="Deactivate Promotion"
      variant="danger"
      confirm-label="Deactivate Promotion"
      :loading="deactivating"
      :message="`Are you sure you want to deactivate promotion &quot;${deactivateTarget?.name}&quot;?`"
      consequence="Cashiers will no longer be able to apply this promotion code at checkout."
      @confirm="executeDeactivatePromo"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Promotions — Clothing Store Admin' })

const promoApi = usePromotionApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const deactivating = ref(false)
const promotions = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const editingPromo = ref<any>(null)
const showDeactivateConfirm = ref(false)
const deactivateTarget = ref<any>(null)

const form = ref({
  name: '',
  code: '',
  discount_type: 'PERCENTAGE',
  discount_value: 10,
  min_order_amount: 0,
  usage_limit: null as number | null,
  valid_from: new Date().toISOString().slice(0, 10),
  valid_until: '',
})

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'code', label: 'Code', sortable: true },
  { key: 'discount_type', label: 'Type', sortable: true },
  { key: 'discount_value', label: 'Value', sortable: true },
  { key: 'valid_from', label: 'Valid From', sortable: true },
  { key: 'valid_until', label: 'Valid Until', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const filteredPromotions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return promotions.value.filter((p) => {
    const st = p.status_code || p.status || 'ACTIVE'
    if (statusFilter.value && st !== statusFilter.value) return false
    if (q) {
      const hay = [p.name, p.code, p.discount_type].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function openCreateModal() {
  editingPromo.value = null
  form.value = {
    name: '',
    code: '',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    min_order_amount: 0,
    usage_limit: null,
    valid_from: new Date().toISOString().slice(0, 10),
    valid_until: '',
  }
  showModal.value = true
}

function openEditModal(promo: any) {
  editingPromo.value = promo
  form.value = {
    name: promo.name,
    code: promo.code || '',
    discount_type: promo.discount_type,
    discount_value: Number(promo.discount_value),
    min_order_amount: Number(promo.min_order_amount || 0),
    usage_limit: promo.usage_limit || null,
    valid_from: promo.valid_from?.slice(0, 10) || '',
    valid_until: promo.valid_until?.slice(0, 10) || '',
  }
  showModal.value = true
}

async function fetchPromotions() {
  loading.value = true
  try {
    const data = await promoApi.listPromotions() as any[]
    promotions.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      code: form.value.code ? form.value.code.toUpperCase() : undefined,
      valid_until: form.value.valid_until || undefined,
    }
    if (editingPromo.value) {
      await promoApi.updatePromotion(editingPromo.value.id, payload)
      toast.add({ title: 'Updated', description: 'Promotion updated', color: 'green' })
    } else {
      await promoApi.createPromotion(payload)
      toast.add({ title: 'Created', description: 'Promotion created', color: 'green' })
    }
    showModal.value = false
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function promptDeactivate(promo: any) {
  deactivateTarget.value = promo
  showDeactivateConfirm.value = true
}

async function executeDeactivatePromo() {
  if (!deactivateTarget.value) return
  deactivating.value = true
  try {
    await promoApi.deletePromotion(deactivateTarget.value.id)
    toast.add({ title: 'Deactivated', description: `${deactivateTarget.value.name} deactivated`, color: 'amber' })
    showDeactivateConfirm.value = false
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    deactivating.value = false
  }
}

onMounted(fetchPromotions)
</script>
