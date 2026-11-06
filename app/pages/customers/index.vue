<template>
  <div class="page-root">
    <AppPageHeader
      title="Customers & Loyalty"
      description="Manage client profiles, loyalty tiers, reward points, and purchase history."
      :breadcrumbs="[
        { label: 'Customers', to: '/customers' },
        { label: 'Customers & Loyalty' },
      ]"
      primary-label="New Customer"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchCustomers"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search by name, phone, code, or email..."
      :chips="activeChips"
      :shown-count="customers.length"
      :total-count="total"
      count-label="customers"
      @submit="fetchCustomers"
      @remove-chip="statusFilter = ''; fetchCustomers()"
      @clear-all="clearFilters"
    >
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="All Statuses"
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
          label: 'No customers found',
          description: 'Add customer profiles to track loyalty points and purchase history.',
        }"
      >
        <template #cell-customer_code="{ row }">
          <code class="mono font-semibold text-gray-900">{{ row.customer_code || row.code || '—' }}</code>
        </template>

        <template #cell-name="{ row }">
          <NuxtLink :to="`/customers/${row.id}`" class="font-semibold text-gray-900 hover:underline">
            {{ row.name || row.full_name }}
          </NuxtLink>
        </template>

        <template #cell-tier="{ row }">
          <AppBadge
            :color="getTierColor(row.loyalty_account?.tier)"
            :label="row.loyalty_account?.tier || 'BRONZE'"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-points="{ row }">
          <div class="font-semibold mono text-gray-900">
            {{ (row.loyalty_account?.points_balance ?? row.loyalty_points ?? 0).toLocaleString() }} pts
          </div>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="(row.status_code || row.status || 'ACTIVE') === 'ACTIVE' ? 'green' : 'default'"
            :label="row.status_code || row.status || 'ACTIVE'"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton
              size="xs"
              variant="ghost"
              label="View"
              :to="`/customers/${row.id}`"
            />
            <AppButton
              size="xs"
              variant="ghost"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              size="xs"
              variant="primary"
              icon="i-heroicons-sparkles"
              label="Points"
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
      :title="editingCustomer ? 'Edit Customer' : 'Add New Customer'"
      size="md"
    >
      <form class="form-grid" @submit.prevent="submitCreate">
        <div class="form-field">
          <label class="field-label">Full Name <span class="required">*</span></label>
          <AppInput v-model="createForm.name" placeholder="John Doe" required />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Phone</label>
            <AppInput v-model="createForm.phone" placeholder="012345678" />
          </div>

          <div class="form-field">
            <label class="field-label">Email</label>
            <AppInput v-model="createForm.email" type="email" placeholder="john@example.com" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Address</label>
          <AppInput v-model="createForm.address" placeholder="Street, City" />
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea
            v-model="createForm.notes"
            rows="2"
            placeholder="Customer preferences..."
            class="field-input field-textarea"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isCreateModalOpen = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">
            {{ editingCustomer ? 'Save Changes' : 'Save Customer' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Adjust Points Modal -->
    <AppModal
      v-model="isPointsModalOpen"
      :title="`Adjust Points: ${selectedCustomer?.name || selectedCustomer?.full_name || ''}`"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="submitAdjustPoints">
        <div class="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
          <span class="text-gray-600">Current Balance:</span>
          <strong class="mono text-sm text-gray-900">
            {{ selectedCustomer?.loyalty_account?.points_balance ?? selectedCustomer?.loyalty_points ?? 0 }} pts
          </strong>
        </div>

        <div class="form-field">
          <label class="field-label">Points Adjustment (+ to add, - to deduct) <span class="required">*</span></label>
          <AppInput v-model.number="pointsDelta" type="number" placeholder="e.g. 100 or -50" required />
        </div>

        <div class="form-field">
          <label class="field-label">Reason / Note</label>
          <AppInput v-model="pointsNote" placeholder="e.g. VIP birthday bonus" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="isPointsModalOpen = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="isSubmitting">Update Points</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({
  middleware: ['auth'],
})
useHead({ title: 'Customers & Loyalty — Clothing Store Admin' })

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

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const columns = [
  { key: 'customer_code', label: 'Code', sortable: true },
  { key: 'name', label: 'Customer Name', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'tier', label: 'Tier' },
  { key: 'points', label: 'Loyalty Points', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
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
