<template>
  <div class="page-root">
    <AppPageHeader
      title="Customers"
      description="Manage customer profiles, contact information, loyalty points, and purchase history."
      :breadcrumbs="[
        { label: 'Customers', to: '/customers' },
        { label: 'Customer Directory' },
      ]"
      primary-label="Add Customer"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    />

    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search customers by name, code, phone, or email..."
      :shown-count="paginatedCustomers.length"
      :total-count="customers.length"
      count-label="customers"
      @submit="fetchCustomers"
      @clear-all="search = ''; fetchCustomers()"
    />

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedCustomers"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-users',
          label: 'No customers found',
          description: 'Add customer profiles to track loyalty points and purchase history.',
        }"
      >
        <template #cell-code="{ row }">
          <code class="mono font-semibold text-gray-900">{{ row.code }}</code>
        </template>

        <template #cell-full_name="{ row }">
          <NuxtLink :to="`/customers/${row.id}`" class="font-semibold text-gray-900 hover:underline">
            {{ row.full_name }}
          </NuxtLink>
        </template>

        <template #cell-loyalty_points="{ row }">
          <AppBadge color="blue" size="sm">{{ row.loyalty_points ?? 0 }} pts</AppBadge>
        </template>

        <template #cell-total_spent="{ row }">
          <span class="mono font-semibold">${{ Number(row.total_spent || 0).toFixed(2) }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="ghost" label="View" :to="`/customers/${row.id}`" />
            <AppButton size="xs" variant="ghost" label="Edit" @click="openEditModal(row)" />
          </div>
        </template>

        <template v-if="customers.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="customers.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="editingCustomer ? 'Edit Customer' : 'Add Customer'"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="field-label">Full Name <span class="required">*</span></label>
          <input v-model="form.full_name" type="text" required placeholder="Customer full name" class="field-input" />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Phone</label>
            <input v-model="form.phone" type="tel" placeholder="+855 12 ..." class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" placeholder="email@example.com" class="field-input" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea v-model="form.notes" rows="2" placeholder="Optional customer preferences or sizing notes..." class="field-input field-textarea" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" :label="editingCustomer ? 'Save Changes' : 'Add Customer'" :loading="saving" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Customers — Clothing Store Admin' })

const customerApi = useCustomerApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const customers = ref<any[]>([])
const search = ref('')
const currentPage = ref(1)
const pageSize = 20

const showModal = ref(false)
const editingCustomer = ref<any>(null)
const form = ref({ full_name: '', phone: '', email: '', notes: '' })

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'full_name', label: 'Full Name', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'loyalty_points', label: 'Loyalty Points', sortable: true },
  { key: 'total_spent', label: 'Total Spent', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return customers.value.slice(start, start + pageSize)
})

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  currentPage.value = 1
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchCustomers, 300)
})

function openCreateModal() {
  editingCustomer.value = null
  form.value = { full_name: '', phone: '', email: '', notes: '' }
  showModal.value = true
}

function openEditModal(customer: any) {
  editingCustomer.value = customer
  form.value = {
    full_name: customer.full_name,
    phone: customer.phone || '',
    email: customer.email || '',
    notes: customer.notes || '',
  }
  showModal.value = true
}

async function fetchCustomers() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (search.value.trim()) params.search = search.value.trim()
    const data = await customerApi.listCustomers(params) as any[]
    customers.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingCustomer.value) {
      await customerApi.updateCustomer(editingCustomer.value.id, form.value)
      toast.add({ title: 'Updated', description: 'Customer updated', color: 'green' })
    } else {
      await customerApi.createCustomer(form.value)
      toast.add({ title: 'Created', description: 'Customer added', color: 'green' })
    }
    showModal.value = false
    await fetchCustomers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(fetchCustomers)
</script>
