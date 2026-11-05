<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Customers & Loyalty</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage client profiles and reward program</p>
      </div>
      <AppButton
        label="New Customer"
        variant="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppInput
          v-model="search"
          placeholder="Search by name, phone, code..."
          class="flex-1 min-w-48"
          @update:model-value="onSearchChange"
        />
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="w-40"
          @update:model-value="fetchCustomers"
        />
        <AppButton variant="ghost" @click="clearFilters">
          Clear
        </AppButton>
      </div>
    </AppCard>

    <!-- Customers table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="customers"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-user-group', label: 'No customers found' }"
      >
        <template #cell-tier="{ row }">
          <AppBadge
            :color="getTierColor(row.loyalty_account?.tier)"
            :label="row.loyalty_account?.tier || 'BRONZE'"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-points="{ row }">
          <div class="font-semibold text-primary-600 dark:text-primary-400">
            {{ row.loyalty_account?.points_balance?.toLocaleString() || 0 }} pts
          </div>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status === 'ACTIVE' ? 'green' : row.status === 'INACTIVE' ? 'gray' : 'red'"
            :label="row.status"
            size="sm"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              label="View"
              :to="`/customers/${row.id}`"
            />
            <AppButton
              size="sm"
              variant="primary" 
              label="Points"
              @click="openPointsModal(row)"
            />
          </div>
        </template>
      </AppTable>

      <div v-if="total > limit" class="flex justify-end p-4 border-t border-gray-200 dark:border-gray-800">
        <UPagination
          v-model="page"
          :page-count="limit"
          :total="total"
          @update:model-value="fetchCustomers"
        />
      </div>
    </AppCard>

    <!-- Create Customer Modal -->
    <AppModal v-model="isCreateModalOpen">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Add New Customer</h3>
            <AppButton variant="ghost" icon="i-heroicons-x-mark" @click="isCreateModalOpen = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitCreate">
          <div class="form-field"><label class="form-label">Full Name</label>
            <AppInput v-model="createForm.name" placeholder="John Doe" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-field"><label class="form-label">Phone</label>
              <AppInput v-model="createForm.phone" placeholder="012345678" />
            </div>

            <div class="form-field"><label class="form-label">Email</label>
              <AppInput v-model="createForm.email" type="email" placeholder="john@example.com" />
            </div>
          </div>

          <div class="form-field"><label class="form-label">Address</label>
            <AppInput v-model="createForm.address" placeholder="Street, City" />
          </div>

          <div class="form-field"><label class="form-label">Notes</label>
            <textarea v-model="createForm.notes" placeholder="Customer preferences..." />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" @click="isCreateModalOpen = false">Cancel</AppButton>
            <AppButton type="submit" variant="primary" :loading="isSubmitting">Save Customer</AppButton>
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Adjust Points Modal -->
    <AppModal v-model="isPointsModalOpen">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Adjust Points: {{ selectedCustomer?.name }}</h3>
            <AppButton variant="ghost" icon="i-heroicons-x-mark" @click="isPointsModalOpen = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submitAdjustPoints">
          <p class="text-sm text-gray-500">
            Current balance: <strong>{{ selectedCustomer?.loyalty_account?.points_balance || 0 }} pts</strong>
          </p>

          <div class="form-field"><label class="form-label">Points Adjustment (+ to add, - to deduct)</label>
            <AppInput v-model.number="pointsDelta" type="number" placeholder="e.g. 100 or -50" required />
          </div>

          <div class="form-field"><label class="form-label">Reason / Note</label>
            <AppInput v-model="pointsNote" placeholder="e.g. VIP birthday bonus" />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" @click="isPointsModalOpen = false">Cancel</AppButton>
            <AppButton type="submit" variant="primary" :loading="isSubmitting">Update Points</AppButton>
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

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
  { key: 'points', label: 'Loyalty Points' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

function getTierColor(tier?: string) {
  switch (tier) {
    case 'PLATINUM': return 'purple'
    case 'GOLD': return 'amber'
    case 'SILVER': return 'gray'
    default: return 'orange'
  }
}

let searchDebounce: NodeJS.Timeout
function onSearchChange() {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    page.value = 1
    fetchCustomers()
  }, 350)
}

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
    if (search.value) params.q = search.value
    if (statusFilter.value) params.status = statusFilter.value

    const res: any = await customerApi.listCustomers(params)
    customers.value = res.items || []
    total.value = res.total || 0
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
  createForm.name = ''
  createForm.phone = ''
  createForm.email = ''
  createForm.address = ''
  createForm.notes = ''
  isCreateModalOpen.value = true
}

async function submitCreate() {
  isSubmitting.value = true
  try {
    await customerApi.createCustomer({
      name: createForm.name,
      phone: createForm.phone || undefined,
      email: createForm.email || undefined,
      address: createForm.address || undefined,
      notes: createForm.notes || undefined,
    })
    toast.add({ title: 'Customer created successfully', color: 'green' })
    isCreateModalOpen.value = false
    fetchCustomers()
  } catch (err: any) {
    toast.add({
      title: 'Error creating customer',
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
      points: pointsDelta.value,
      note: pointsNote.value || undefined,
    })
    toast.add({ title: 'Loyalty points updated', color: 'green' })
    isPointsModalOpen.value = false
    fetchCustomers()
  } catch (err: any) {
    toast.add({
      title: 'Error adjusting points',
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
