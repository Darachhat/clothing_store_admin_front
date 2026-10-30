<template>
  <div class="page-root">
    <!-- Header -->
    <div class="page-header">
      <div class="page-header__left">
        <NuxtLink to="/customers" class="back-link">
          <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
          Customers
        </NuxtLink>
        <h2 class="page-title">{{ customer?.name ?? '…' }}</h2>
        <p class="page-subtitle">{{ customer?.customer_code }}</p>
      </div>
      <AppButton v-if="customer" variant="default" @click="openEdit">Edit</AppButton>
    </div>

    <div v-if="loading" class="state-card">Loading…</div>

    <template v-else-if="customer">
      <div class="detail-grid">
        <AppCard title="Customer Information">
          <dl class="detail-list">
            <div class="detail-row"><dt>Code</dt><dd><code class="mono">{{ customer.customer_code }}</code></dd></div>
            <div class="detail-row"><dt>Name</dt><dd>{{ customer.name }}</dd></div>
            <div class="detail-row"><dt>Phone</dt><dd>{{ customer.phone ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Email</dt><dd>{{ customer.email ?? '—' }}</dd></div>
            <div class="detail-row">
              <dt>Status</dt>
              <dd><AppBadge :color="customer.status === 'ACTIVE' ? 'green' : 'default'">{{ customer.status }}</AppBadge></dd>
            </div>
            <div class="detail-row"><dt>Joined</dt><dd>{{ fmtDate(customer.created_at) }}</dd></div>
          </dl>
        </AppCard>

        <AppCard title="Purchase History">
          <div class="empty-text">Purchase history coming soon.</div>
        </AppCard>
      </div>
    </template>

    <div v-else class="state-card">Customer not found.</div>

    <!-- Edit Modal -->
    <AppModal v-model="showEdit" title="Edit Customer">
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
        <div class="form-field">
          <label class="field-label">Address</label>
          <textarea v-model="form.address" class="field-input field-textarea" rows="2" />
        </div>
        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea v-model="form.notes" class="field-input field-textarea" rows="2" />
        </div>
        <div class="form-field">
          <label class="field-label">Status</label>
          <AppSelect v-model="form.status" :options="statusOptions" />
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" @click="showEdit = false">Cancel</AppButton>
          <AppButton type="submit" variant="primary" :loading="saving">Save</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import type { Customer } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Customer — Clothing Store' })

const { getCustomer, updateCustomer } = useCustomerApi()
const { addToast } = useAppToast()

const customer = ref<Customer | null>(null)
const loading = ref(true)
const saving = ref(false)
const showEdit = ref(false)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const form = reactive({
  name: '', phone: '', email: '', address: '', notes: '', status: 'ACTIVE',
})

function fmtDate(d: string) { return new Date(d).toLocaleDateString() }

function openEdit() {
  if (!customer.value) return
  Object.assign(form, {
    name: customer.value.name,
    phone: (customer.value as any).phone ?? '',
    email: (customer.value as any).email ?? '',
    address: (customer.value as any).address ?? '',
    notes: (customer.value as any).notes ?? '',
    status: customer.value.status,
  })
  showEdit.value = true
}

async function save() {
  saving.value = true
  try {
    await updateCustomer(id, {
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      notes: form.notes || null,
      status: form.status,
    })
    addToast({ type: 'success', title: 'Customer updated' })
    customer.value = await getCustomer(id) as Customer
    showEdit.value = false
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    customer.value = await getCustomer(id) as Customer
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-root { display: flex; flex-direction: column; gap: 16px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.page-header__left { display: flex; flex-direction: column; gap: 2px; }
.back-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-tertiary); text-decoration: none; margin-bottom: 4px; }
.back-link:hover { color: var(--text-primary); }
.page-title { font-size: 16px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
.page-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
.state-card { display: flex; align-items: center; justify-content: center; padding: 48px; background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); color: var(--text-tertiary); font-size: 13px; }
.detail-grid { display: grid; grid-template-columns: 320px 1fr; gap: 16px; align-items: start; }
@media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
.detail-list { display: flex; flex-direction: column; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); font-size: 13px; }
.detail-row:last-child { border-bottom: none; }
.detail-row dt { color: var(--text-tertiary); }
.detail-row dd { color: var(--text-primary); font-weight: 500; }
.mono { font-family: monospace; font-size: 12px; }
.empty-text { font-size: 13px; color: var(--text-tertiary); font-style: italic; }
.form-grid { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 580px) { .form-row { grid-template-columns: 1fr; } }
.form-field { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); }
.required { color: #ef4444; }
.field-input { padding: 8px 10px; font-size: 13px; background: var(--surface-inset); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color .15s; box-sizing: border-box; width: 100%; }
.field-input:focus { border-color: var(--color-primary); }
.field-textarea { resize: vertical; min-height: 60px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
</style>
