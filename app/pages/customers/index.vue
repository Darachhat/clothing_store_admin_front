<template>
  <div class="page-root">
    <AppPageHeader
      :title="t('customers.title', 'Customers & Loyalty')"
      :description="t('customers.description', 'Manage client profiles, loyalty tiers, reward points, and purchase history.')"
      :breadcrumbs="[
        { label: t('nav_section.customers', 'Customers'), to: '/customers' },
        { label: t('customers.title', 'Customers & Loyalty') },
      ]"
      :primary-label="t('customers.new_customer', 'New Customer')"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          :label="t('common.refresh', 'Refresh')"
          :loading="loading"
          @click="fetchCustomers"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="search"
      :search-placeholder="t('customers.search_placeholder', 'Search by name, phone, code, or email...')"
      :chips="activeChips"
      :shown-count="customers.length"
      :total-count="total"
      :summary-items="[
        { label: t('customers.total_customers', 'Total Customers'), value: total },
        { label: t('customers.loyalty_points', 'Total Loyalty Points'), value: totalPointsBalance },
      ]"
      :count-label="t('nav.customers', 'customers')"
      @submit="fetchCustomers"
      @remove-chip="statusFilter = ''; fetchCustomers()"
      @clear-all="clearFilters"
    >
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        :placeholder="t('products.all_statuses', 'All Statuses')"
        style="min-width: 155px;"
        @change="fetchCustomers"
      />
    </AppFilterBar>

    <!-- Customers table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="customers"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-user-group',
          label: t('customers.empty_title', 'No customers found'),
          description: t('customers.empty_desc', 'Add customer profiles to track loyalty points and purchase history.'),
        }"
      >
        <template #cell-customer_code="{ row }">
          <code class="mono font-medium text-ink">{{ row.customer_code || row.code || '—' }}</code>
        </template>

        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-surface-inset border border-border-subtle flex items-center justify-center text-ink-secondary shrink-0">
              <UIcon name="i-heroicons-user" class="w-5 h-5" />
            </div>
            <div class="min-w-0">
              <NuxtLink :to="`/customers/${row.id}`" class="block text-sm font-medium text-ink hover:underline truncate">
                {{ row.name || row.full_name }}
              </NuxtLink>
              <span class="text-xs text-ink-secondary mono">{{ row.customer_code || row.code || 'Client' }}</span>
            </div>
          </div>
        </template>

        <template #cell-tier="{ row }">
          <AppBadge
            :color="getTierColor(row.loyalty_account?.tier)"
            :label="row.loyalty_account?.tier || 'BRONZE'"
            size="sm"
          />
        </template>

        <template #cell-points="{ row }">
          <div class="font-medium mono text-ink text-right">
            {{ (row.loyalty_account?.points_balance ?? row.loyalty_points ?? 0).toLocaleString() }} pts
          </div>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="(row.status_code || row.status || 'ACTIVE') === 'ACTIVE' ? 'green' : 'default'"
            :label="(row.status_code || row.status || 'ACTIVE') === 'ACTIVE' ? t('status.active', 'Active') : t('status.inactive', 'Inactive')"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton
              size="xs"
              variant="ghost"
              :label="t('common.view', 'View')"
              :to="`/customers/${row.id}`"
            />
            <AppButton
              size="xs"
              variant="ghost"
              :label="t('common.edit', 'Edit')"
              @click="openEditModal(row)"
            />
            <AppButton
              size="xs"
              variant="primary"
              icon="i-heroicons-sparkles"
              :label="t('customers.points', 'Points')"
              @click="openPointsModal(row)"
            />
          </div>
        </template>

        <template v-if="total > limit" #footer>
          <AppPagination
            v-model:page="page"
            :page-size="limit"
            :total="total"
            @update:page="fetchCustomers"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Customer Modal -->
    <AppModal
      v-model="isCreateModalOpen"
      :title="editingCustomer ? t('common.edit', 'Edit Customer') : t('customers.new_customer', 'Add New Customer')"
      size="md"
    >
      <form class="form-grid" @submit.prevent="submitCreate">
        <div class="form-field">
          <label class="field-label">{{ t('fields.name', 'Full Name') }} <span class="required">*</span></label>
          <AppInput v-model="createForm.name" placeholder="John Doe" required />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">{{ t('fields.phone', 'Phone') }}</label>
            <AppInput v-model="createForm.phone" placeholder="012345678" />
          </div>

          <div class="form-field">
            <label class="field-label">{{ t('fields.email', 'Email') }}</label>
            <AppInput v-model="createForm.email" type="email" placeholder="john@example.com" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('fields.address', 'Address') }}</label>
          <AppInput v-model="createForm.address" placeholder="Street, City" />
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('fields.notes', 'Notes') }}</label>
          <textarea
            v-model="createForm.notes"
            rows="2"
            placeholder="Customer preferences..."
            class="field-input field-textarea"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isCreateModalOpen = false">{{ t('common.cancel', 'Cancel') }}</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">
            {{ t('common.save', 'Save') }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Adjust Points Modal -->
    <AppModal
      v-model="isPointsModalOpen"
      :title="`${t('customers.points', 'Points')}: ${selectedCustomer?.name || selectedCustomer?.full_name || ''}`"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="submitAdjustPoints">
        <div class="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
          <span class="text-gray-600">{{ t('customers.loyalty_points', 'Current Balance') }}:</span>
          <strong class="mono text-sm text-gray-900">
            {{ selectedCustomer?.loyalty_account?.points_balance ?? selectedCustomer?.loyalty_points ?? 0 }} pts
          </strong>
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('inventory.qty_delta', 'Points Adjustment (+ to add, - to deduct)') }} <span class="required">*</span></label>
          <AppInput v-model.number="pointsDelta" type="number" placeholder="e.g. 100 or -50" required />
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('fields.notes', 'Reason / Note') }}</label>
          <AppInput v-model="pointsNote" placeholder="e.g. VIP birthday bonus" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isPointsModalOpen = false">{{ t('common.cancel', 'Cancel') }}</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">{{ t('common.save', 'Update Points') }}</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

definePageMeta({
  middleware: ['auth'],
})

const { t } = useAppTranslation()
useHead({ title: computed(() => `${t('customers.title', 'Customers & Loyalty')} — Clothing Store Admin`) })

const customerApi = useCustomerApi()
const toast = useAppToast()

const search = ref('')
const statusFilter = ref('')
const loading = ref(false)
const isSubmitting = ref(false)
const page = ref(1)
const limit = ref(20)
const total = ref(0)
const customers = ref<any[]>([])

const isCreateModalOpen = ref(false)
const editingCustomer = ref<any>(null)
const createForm = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const isPointsModalOpen = ref(false)
const selectedCustomer = ref<any>(null)
const pointsDelta = ref<number>(0)
const pointsNote = ref('')

const statusOptions = computed(() => [
  { label: t('products.all_statuses', 'All Statuses'), value: '' },
  { label: t('status.active', 'Active'), value: 'ACTIVE' },
  { label: t('status.inactive', 'Inactive'), value: 'INACTIVE' },
])

const columns = computed(() => [
  { key: 'name', label: t('fields.customer', 'Customer Representative'), sortable: true },
  { key: 'customer_code', label: t('products.col_code', 'Code'), sortable: true },
  { key: 'phone', label: t('fields.phone', 'Phone') },
  { key: 'email', label: t('fields.email', 'Email') },
  { key: 'tier', label: t('customers.col_tier', 'Tier') },
  { key: 'points', label: t('customers.loyalty_points', 'Loyalty Points'), sortable: true, align: 'right' as const },
  { key: 'status', label: t('common.status', 'Status') },
  { key: 'actions', label: t('common.actions', 'Actions'), align: 'right' as const },
])

const totalPointsBalance = computed(() =>
  customers.value.reduce((sum, c) => sum + Number(c.loyalty_account?.points_balance ?? c.loyalty_points ?? 0), 0).toLocaleString(),
)

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: t('common.status', 'Status'), value: statusFilter.value })
  return chips
})

function getTierColor(tier?: string) {
  switch (tier) {
    case 'PLATINUM': return 'purple'
    case 'GOLD': return 'amber'
    case 'SILVER': return 'gray'
    default: return 'orange'
  }
}

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    fetchCustomers()
  }, 350)
})

function clearFilters() {
  search.value = ''
  statusFilter.value = ''
  page.value = 1
  fetchCustomers()
}

async function fetchCustomers() {
  loading.value = true
  try {
    const skip = (page.value - 1) * limit.value
    const params: Record<string, any> = { skip, limit: limit.value }
    if (search.value.trim()) params.q = search.value.trim()
    if (statusFilter.value) params.status = statusFilter.value

    const res: any = await customerApi.listCustomers(params)
    if (Array.isArray(res)) {
      customers.value = res
      total.value = res.length
    } else {
      customers.value = res?.items || []
      total.value = res?.total ?? customers.value.length
    }
  } catch (err: any) {
    toast.add({
      title: 'Failed to load customers',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingCustomer.value = null
  createForm.name = ''
  createForm.phone = ''
  createForm.email = ''
  createForm.address = ''
  createForm.notes = ''
  isCreateModalOpen.value = true
}

function openEditModal(cust: any) {
  editingCustomer.value = cust
  createForm.name = cust.name || cust.full_name || ''
  createForm.phone = cust.phone || ''
  createForm.email = cust.email || ''
  createForm.address = cust.address || ''
  createForm.notes = cust.notes || ''
  isCreateModalOpen.value = true
}

async function submitCreate() {
  isSubmitting.value = true
  try {
    const payload = {
      name: createForm.name.trim(),
      phone: createForm.phone || undefined,
      email: createForm.email || undefined,
      address: createForm.address || undefined,
      notes: createForm.notes || undefined,
    }
    if (editingCustomer.value) {
      await customerApi.updateCustomer(editingCustomer.value.id, payload)
      toast.add({ title: 'Customer updated successfully', color: 'green' })
    } else {
      await customerApi.createCustomer(payload)
      toast.add({ title: 'Customer created successfully', color: 'green' })
    }
    isCreateModalOpen.value = false
    await fetchCustomers()
  } catch (err: any) {
    toast.add({
      title: 'Error saving customer',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

function openPointsModal(cust: any) {
  selectedCustomer.value = cust
  pointsDelta.value = 0
  pointsNote.value = ''
  isPointsModalOpen.value = true
}

async function submitAdjustPoints() {
  if (!selectedCustomer.value || !pointsDelta.value) return
  isSubmitting.value = true
  try {
    await customerApi.adjustPoints(selectedCustomer.value.id, {
      points: Number(pointsDelta.value),
      note: pointsNote.value || undefined,
    })
    toast.add({ title: 'Loyalty points updated', color: 'green' })
    isPointsModalOpen.value = false
    await fetchCustomers()
  } catch (err: any) {
    toast.add({
      title: 'Failed to adjust points',
      description: err?.data?.detail || err.message,
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>
