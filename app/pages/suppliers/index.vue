<template>
  <div class="page-root">
    <AppPageHeader
      title="Suppliers"
      description="Manage garment vendors, procurement contacts, and lead-time notes."
      :breadcrumbs="[
        { label: 'Purchasing', to: '/purchases' },
        { label: 'Suppliers' },
      ]"
      primary-label="Add Supplier"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    />

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search suppliers by company name, code, contact person, or phone..."
      :chips="statusFilter ? [{ key: 'status', label: 'Status', value: statusFilter }] : []"
      :shown-count="filteredSuppliers.length"
      :total-count="suppliers.length"
      count-label="suppliers"
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
        :rows="filteredSuppliers"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-building-office-2',
          label: 'No suppliers found',
          description: 'Add your first garment vendor to start creating purchase orders.',
        }"
      >
        <template #cell-code="{ row }">
          <code class="mono font-semibold text-gray-900">{{ row.code }}</code>
        </template>

        <template #cell-name="{ row }">
          <NuxtLink :to="`/suppliers/${row.id}`" class="font-semibold text-gray-900 hover:underline">
            {{ row.name }}
          </NuxtLink>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="ghost" label="View" :to="`/suppliers/${row.id}`" />
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
      :title="editingSupplier ? 'Edit Supplier' : 'Add Supplier'"
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="field-label">Company Name <span class="required">*</span></label>
          <AppInput v-model="form.name" type="text" required placeholder="e.g. Alpha Garment Co." />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Contact Person</label>
            <AppInput v-model="form.contact_person" type="text" placeholder="Sales representative name" />
          </div>
          <div class="form-field">
            <label class="field-label">Phone</label>
            <AppInput v-model="form.phone" type="tel" placeholder="+855 23 ..." />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Email</label>
          <AppInput v-model="form.email" type="email" placeholder="supplier@example.com" />
        </div>

        <div class="form-field">
          <label class="field-label">Address</label>
          <AppTextarea v-model="form.address" rows="2" placeholder="Full address" />
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <AppInput v-model="form.notes" type="text" placeholder="Payment terms, lead times, etc." />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" :label="editingSupplier ? 'Save Changes' : 'Add Supplier'" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showDeactivateConfirm"
      title="Deactivate Supplier"
      variant="danger"
      confirm-label="Deactivate Supplier"
      :loading="deactivating"
      :message="`Are you sure you want to deactivate supplier &quot;${deactivateTarget?.name}&quot;?`"
      consequence="Inactive suppliers cannot be selected on new purchase orders."
      @confirm="executeDeactivateSupplier"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Suppliers — Clothing Store Admin' })

const supplierApi = useSupplierApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const deactivating = ref(false)
const suppliers = ref<any[]>([])
const searchQuery = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const editingSupplier = ref<any>(null)
const showDeactivateConfirm = ref(false)
const deactivateTarget = ref<any>(null)

const form = ref({
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
})

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Company Name', sortable: true },
  { key: 'contact_person', label: 'Contact', sortable: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const filteredSuppliers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return suppliers.value.filter((s) => {
    const st = s.status_code || s.status || 'ACTIVE'
    if (statusFilter.value && st !== statusFilter.value) return false
    if (q) {
      const hay = [s.code, s.name, s.contact_person, s.phone, s.email].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

function openCreateModal() {
  editingSupplier.value = null
  form.value = { name: '', contact_person: '', phone: '', email: '', address: '', notes: '' }
  showModal.value = true
}

function openEditModal(supplier: any) {
  editingSupplier.value = supplier
  form.value = {
    name: supplier.name,
    contact_person: supplier.contact_person || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    notes: supplier.notes || '',
  }
  showModal.value = true
}

async function fetchSuppliers() {
  loading.value = true
  try {
    const data = await supplierApi.listSuppliers() as any[]
    suppliers.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editingSupplier.value) {
      await supplierApi.updateSupplier(editingSupplier.value.id, form.value)
      toast.add({ title: 'Updated', description: 'Supplier updated successfully', color: 'green' })
    } else {
      await supplierApi.createSupplier(form.value)
      toast.add({ title: 'Added', description: 'Supplier added successfully', color: 'green' })
    }
    showModal.value = false
    await fetchSuppliers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

function promptDeactivate(supplier: any) {
  deactivateTarget.value = supplier
  showDeactivateConfirm.value = true
}

async function executeDeactivateSupplier() {
  if (!deactivateTarget.value) return
  deactivating.value = true
  try {
    await supplierApi.updateSupplier(deactivateTarget.value.id, { status: 'INACTIVE', status_code: 'INACTIVE' })
    toast.add({ title: 'Deactivated', description: `${deactivateTarget.value.name} deactivated`, color: 'amber' })
    showDeactivateConfirm.value = false
    await fetchSuppliers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    deactivating.value = false
  }
}

onMounted(fetchSuppliers)
</script>
