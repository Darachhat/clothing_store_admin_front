<template>
  <div class="page-root">
    <AppPageHeader
      title="Promotions & Coupons"
      description="Create discount campaigns and manage coupon codes for POS and online checkout."
      :breadcrumbs="[
        { label: 'Customers', to: '/customers' },
        { label: 'Promotions' },
      ]"
      primary-label="New Promotion"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchPromotions" />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search promotions by campaign name or coupon code..."
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

    <!-- Promotions Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredPromotions"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-gift',
          label: 'No promotions active',
          description: 'Create discount campaigns and coupon codes for POS checkout.',
        }"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-semibold text-gray-900">{{ row.name }}</p>
            <p v-if="row.code" class="text-xs font-mono text-gray-600">
              Code: {{ row.code }}
            </p>
          </div>
        </template>

        <template #cell-type="{ row }">
          <AppBadge :color="(row.type || row.discount_type) === 'PERCENTAGE' ? 'blue' : 'green'" size="sm">
            {{ row.type || row.discount_type }}
          </AppBadge>
        </template>

        <template #cell-discount="{ row }">
          <span class="font-medium mono text-gray-900">
            {{ (row.type || row.discount_type) === 'PERCENTAGE' ? `${row.value ?? row.discount_value}% OFF` : `$${Number(row.value ?? row.discount_value ?? 0).toFixed(2)} OFF` }}
          </span>
        </template>

        <template #cell-validity="{ row }">
          <div class="text-xs text-gray-500">
            {{ fmtDate(row.start_datetime || row.valid_from) }} – {{ fmtDate(row.end_datetime || row.valid_until) }}
          </div>
        </template>

        <template #cell-usage="{ row }">
          <span class="text-xs mono">
            {{ row.usage_count ?? 0 }} / {{ row.usage_limit || 'Unlimited' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'"
            :label="row.status_code || row.status || 'ACTIVE'"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-pencil-square"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              variant="danger"
              size="xs"
              icon="i-heroicons-trash"
              label="Delete"
              @click="promptDelete(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Promotion Modal -->
    <AppModal
      v-model="showCreateModal"
      :title="editingPromotionId ? 'Edit Promotion' : 'Create Promotion'"
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleCreatePromotion">
        <div class="form-field">
          <label class="field-label">Campaign Name <span class="required">*</span></label>
          <input
            v-model="createForm.name"
            type="text"
            required
            placeholder="e.g. Summer Special 15%"
            class="field-input"
          />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Discount Type <span class="required">*</span></label>
            <select
              v-model="createForm.type"
              required
              class="field-input"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount ($)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Discount Value <span class="required">*</span></label>
            <input
              v-model.number="createForm.value"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 10"
              class="field-input mono"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Coupon Code (optional)</label>
            <input
              v-model="createForm.code"
              type="text"
              placeholder="e.g. SUMMER10"
              class="field-input uppercase font-mono"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Min. Order Total ($)</label>
            <input
              v-model.number="createForm.min_purchase_amount"
              type="number"
              step="0.01"
              min="0"
              class="field-input mono"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Start Date <span class="required">*</span></label>
            <input
              v-model="createForm.start_datetime"
              type="date"
              required
              class="field-input"
            />
          </div>
          <div class="form-field">
            <label class="field-label">End Date <span class="required">*</span></label>
            <input
              v-model="createForm.end_datetime"
              type="date"
              required
              class="field-input"
            />
          </div>
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showCreateModal = false" />
          <AppButton type="submit" variant="primary" label="Save Campaign" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Promotion"
      variant="danger"
      confirm-label="Delete Promotion"
      :loading="deleting"
      :message="`Are you sure you want to delete promotion &quot;${deleteTarget?.name}&quot;?`"
      consequence="Cashiers and customers will no longer be able to apply this promotion code."
      @confirm="executeDeletePromotion"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Promotions & Coupons — Clothing Store Admin' })

const promotionApi = usePromotionApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const promotions = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

const columns = [
  { key: 'name', label: 'Promotion', sortable: true },
  { key: 'type', label: 'Type' },
  { key: 'discount', label: 'Discount' },
  { key: 'validity', label: 'Validity Period' },
  { key: 'usage', label: 'Usage' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const showCreateModal = ref(false)
const editingPromotionId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const deleteTarget = ref<any>(null)

const createForm = ref({
  name: '',
  type: 'PERCENTAGE',
  value: 10,
  code: '',
  min_purchase_amount: 0,
  start_datetime: new Date().toISOString().split('T')[0] ?? '',
  end_datetime: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] ?? '',
})

const filteredPromotions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return promotions.value.filter((p) => {
    const st = p.status_code || p.status || 'ACTIVE'
    if (statusFilter.value && st !== statusFilter.value) return false
    if (q) {
      const hay = [p.name, p.code, p.type].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

function openCreateModal() {
  editingPromotionId.value = null
  createForm.value = {
    name: '',
    type: 'PERCENTAGE',
    value: 10,
    code: '',
    min_purchase_amount: 0,
    start_datetime: new Date().toISOString().split('T')[0] ?? '',
    end_datetime: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] ?? '',
  }
  showCreateModal.value = true
}

function openEditModal(promo: any) {
  editingPromotionId.value = promo.id
  createForm.value = {
    name: promo.name || '',
    type: promo.type || promo.discount_type || 'PERCENTAGE',
    value: Number(promo.value ?? promo.discount_value ?? 10),
    code: promo.code || '',
    min_purchase_amount: Number(promo.min_purchase_amount ?? promo.min_order_amount ?? 0),
    start_datetime: promo.start_datetime ? new Date(promo.start_datetime).toISOString().split('T')[0] ?? '' : '',
    end_datetime: promo.end_datetime ? new Date(promo.end_datetime).toISOString().split('T')[0] ?? '' : '',
  }
  showCreateModal.value = true
}

async function fetchPromotions() {
  loading.value = true
  try {
    const data = await promotionApi.listPromotions() as any
    promotions.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleCreatePromotion() {
  saving.value = true
  try {
    const payload = {
      name: createForm.value.name,
      type: createForm.value.type,
      value: createForm.value.value,
      code: createForm.value.code ? createForm.value.code.toUpperCase() : null,
      min_purchase_amount: createForm.value.min_purchase_amount,
      start_datetime: new Date(createForm.value.start_datetime).toISOString(),
      end_datetime: new Date(createForm.value.end_datetime).toISOString(),
      status: 'ACTIVE',
      status_code: 'ACTIVE',
    }
    if (editingPromotionId.value) {
      await promotionApi.updatePromotion(editingPromotionId.value, payload)
      toast.add({ title: 'Success', description: 'Promotion updated successfully', color: 'green' })
    } else {
      await promotionApi.createPromotion(payload)
      toast.add({ title: 'Success', description: 'Promotion created successfully', color: 'green' })
    }
    showCreateModal.value = false
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function promptDelete(row: any) {
  deleteTarget.value = row
  showDeleteConfirm.value = true
}

async function executeDeletePromotion() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await promotionApi.deletePromotion(deleteTarget.value.id)
    toast.add({ title: 'Success', description: 'Promotion deleted', color: 'green' })
    showDeleteConfirm.value = false
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await fetchPromotions()
})
</script>
