<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Promotions & Coupons</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Create discount campaigns and manage coupon codes</p>
      </div>
      <AppButton
        label="New Promotion"
        variant="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Promotions Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="promotions"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-gift', label: 'No promotions active' }"
      >
        <template #cell-name="{ row }">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ row.name }}</p>
            <p v-if="row.code" class="text-xs font-mono text-primary-600 dark:text-primary-400">
              Code: {{ row.code }}
            </p>
          </div>
        </template>

        <template #cell-type="{ row }">
          <AppBadge variant="default" :label="row.type" size="sm" />
        </template>

        <template #cell-discount="{ row }">
          <span class="font-bold text-gray-900 dark:text-white">
            {{ row.type === 'PERCENTAGE' ? `${row.value}% OFF` : `$${row.value} OFF` }}
          </span>
        </template>

        <template #cell-validity="{ row }">
          <div class="text-xs text-gray-500">
            {{ new Date(row.start_datetime).toLocaleDateString() }} - {{ new Date(row.end_datetime).toLocaleDateString() }}
          </div>
        </template>

        <template #cell-usage="{ row }">
          <span class="text-xs">
            {{ row.usage_count }} / {{ row.usage_limit || '∞' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status === 'ACTIVE' ? 'emerald' : 'gray'"
            :label="row.status"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            variant="danger"
            size="sm"
            @click="deletePromotion(row)"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create Promotion Modal -->
    <AppModal v-model="showCreateModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Create Promotion</h3>
            <AppButton variant="ghost" size="sm" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreatePromotion">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name *</label>
            <input
              v-model="createForm.name"
              type="text"
              required
              placeholder="e.g. Summer Special 15%"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type *</label>
              <select
                v-model="createForm.type"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Value *</label>
              <input
                v-model.number="createForm.value"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 10"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Code (optional)</label>
              <input
                v-model="createForm.code"
                type="text"
                placeholder="e.g. SUMMER10"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm uppercase font-mono"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min. Order Total ($)</label>
              <input
                v-model.number="createForm.min_purchase_amount"
                type="number"
                step="0.01"
                min="0"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date *</label>
              <input
                v-model="createForm.start_datetime"
                type="date"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date *</label>
              <input
                v-model="createForm.end_datetime"
                type="date"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Save Campaign" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
const promotionApi = usePromotionApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const promotions = ref<any[]>([])

const columns = [
  { key: 'name', label: 'Promotion' },
  { key: 'type', label: 'Type' },
  { key: 'discount', label: 'Discount' },
  { key: 'validity', label: 'Validity Period' },
  { key: 'usage', label: 'Usage' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  type: 'PERCENTAGE',
  value: 10,
  code: '',
  min_purchase_amount: 0,
  start_datetime: new Date().toISOString().split('T')[0],
  end_datetime: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
})

function openCreateModal() {
  createForm.value = {
    name: '',
    type: 'PERCENTAGE',
    value: 10,
    code: '',
    min_purchase_amount: 0,
    start_datetime: new Date().toISOString().split('T')[0],
    end_datetime: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  }
  showCreateModal.value = true
}

async function fetchPromotions() {
  loading.value = true
  try {
    const data = await promotionApi.listPromotions() as any[]
    promotions.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleCreatePromotion() {
  saving.value = true
  try {
    await promotionApi.createPromotion({
      name: createForm.value.name,
      type: createForm.value.type,
      value: createForm.value.value,
      code: createForm.value.code || null,
      min_purchase_amount: createForm.value.min_purchase_amount,
      start_datetime: new Date(createForm.value.start_datetime).toISOString(),
      end_datetime: new Date(createForm.value.end_datetime).toISOString(),
      status: 'ACTIVE',
    })
    toast.add({ title: 'Success', description: 'Promotion created successfully', color: 'green' })
    showCreateModal.value = false
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function deletePromotion(row: any) {
  if (!confirm(`Delete promotion "${row.name}"?`)) return
  try {
    await promotionApi.deletePromotion(row.id)
    toast.add({ title: 'Success', description: 'Promotion deleted', color: 'green' })
    await fetchPromotions()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

onMounted(async () => {
  await fetchPromotions()
})
</script>
