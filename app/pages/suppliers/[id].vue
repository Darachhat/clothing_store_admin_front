<template>
  <div class="page-root">
    <AppPageHeader
      :title="supplier?.name || 'Supplier Detail'"
      :description="supplier ? `Vendor Code: ${supplier.code}` : 'Loading supplier...'"
      :breadcrumbs="[
        { label: 'Purchasing', to: '/purchases' },
        { label: 'Suppliers', to: '/suppliers' },
        { label: supplier?.name || 'Detail' },
      ]"
    >
      <template v-if="supplier" #badge>
        <AppBadge :color="((supplier as any).status_code || supplier.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
          {{ (supplier as any).status_code || supplier.status || 'ACTIVE' }}
        </AppBadge>
      </template>
      <template v-if="supplier" #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-pencil-square" label="Edit Supplier" @click="openEdit" />
        <AppButton variant="primary" size="sm" icon="i-heroicons-plus" label="New Purchase Order" to="/purchases/new" />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading supplier details…</div>

    <template v-else-if="supplier">
      <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        <AppCard title="Supplier Information">
          <dl class="detail-list">
            <div class="detail-row"><dt>Code</dt><dd><code class="mono font-semibold">{{ supplier.code }}</code></dd></div>
            <div class="detail-row"><dt>Name</dt><dd>{{ supplier.name }}</dd></div>
            <div class="detail-row"><dt>Contact Person</dt><dd>{{ supplier.contact_person ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Phone</dt><dd>{{ supplier.phone ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Email</dt><dd>{{ supplier.email ?? '—' }}</dd></div>
            <div v-if="(supplier as any).address" class="detail-row"><dt>Address</dt><dd>{{ (supplier as any).address }}</dd></div>
            <div class="detail-row">
              <dt>Status</dt>
              <dd><AppBadge :color="((supplier as any).status_code || supplier.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">{{ (supplier as any).status_code || supplier.status }}</AppBadge></dd>
            </div>
          </dl>
        </AppCard>

        <AppCard :title="`Purchase Orders (${supplierPos.length})`" :no-pad="true">
          <AppTable
            :columns="poCols"
            :rows="supplierPos"
            :loading="false"
            empty-text="No purchase orders recorded for this supplier yet."
          >
            <template #cell-po_number="{ row }">
              <NuxtLink :to="`/purchases/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
                {{ row.po_number }}
              </NuxtLink>
            </template>
            <template #cell-total="{ row }">
              <span class="mono font-semibold">${{ Number(row.total_cost ?? row.total ?? 0).toFixed(2) }}</span>
            </template>
            <template #cell-status="{ row }">
              <AppBadge :color="(row.status_code || row.status) === 'RECEIVED' ? 'green' : 'blue'" size="sm">
                {{ row.status_code || row.status }}
              </AppBadge>
            </template>
            <template #cell-created_at="{ value }">
              <span class="text-xs text-gray-500">{{ value ? new Date(value).toLocaleDateString() : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>
      </div>
    </template>

    <AppErrorState v-else title="Supplier not found" @retry="loadData" />

    <!-- Edit Modal -->
    <AppModal v-model="showEdit" title="Edit Supplier">
      <form class="form-grid" @submit.prevent="save">
        <div class="form-field">
          <label class="field-label">Name <span class="required">*</span></label>
          <input v-model="form.name" class="field-input" required />
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Phone</label>
            <input v-model="form.phone" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" class="field-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Contact Person</label>
            <input v-model="form.contact_person" class="field-input" />
          </div>
          <div class="form-field">
            <label class="field-label">Status</label>
            <AppSelect v-model="form.status" :options="statusOptions" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">Address</label>
          <textarea v-model="form.address" class="field-input field-textarea" rows="2" />
        </div>
        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea v-model="form.notes" class="field-input field-textarea" rows="2" />
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showEdit = false" />
          <AppButton type="submit" variant="primary" label="Save Changes" :loading="saving" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Supplier — Clothing Store Admin' })

const { getSupplier, updateSupplier } = useSupplierApi()
const { listPurchases } = usePurchaseApi()
const { addToast } = useAppToast()

const supplier = ref<Supplier | null>(null)
const supplierPos = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showEdit = ref(false)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const poCols = [
  { key: 'po_number', label: 'PO #' },
  { key: 'total', label: 'Total Cost' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created' },
]

const form = reactive({
  name: '', phone: '', email: '', contact_person: '', address: '', notes: '', status: 'ACTIVE',
})

function openEdit() {
  if (!supplier.value) return
  Object.assign(form, {
    name: supplier.value.name,
    phone: supplier.value.phone ?? '',
    email: supplier.value.email ?? '',
    contact_person: supplier.value.contact_person ?? '',
    address: (supplier.value as any).address ?? '',
    notes: (supplier.value as any).notes ?? '',
    status: (supplier.value as any).status_code || supplier.value.status || 'ACTIVE',
  })
  showEdit.value = true
}

async function save() {
  saving.value = true
  try {
    await updateSupplier(id, {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      contact_person: form.contact_person || null,
      address: form.address || null,
      notes: form.notes || null,
      status: form.status,
      status_code: form.status,
    })
    addToast({ type: 'success', title: 'Supplier updated' })
    supplier.value = await getSupplier(id) as Supplier
    showEdit.value = false
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [s, pos] = await Promise.all([
      getSupplier(id),
      listPurchases({ supplier_id: id }).catch(() => []),
    ])
    supplier.value = s as Supplier
    supplierPos.value = ((pos as any[]) || []).filter((p: any) => !p.supplier_id || p.supplier_id === id)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

