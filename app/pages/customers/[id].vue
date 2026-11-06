<template>
  <div class="page-root">
    <AppPageHeader
      :title="customer?.name || customer?.full_name || 'Customer Detail'"
      :description="customer ? `Customer Code: ${customer.customer_code || customer.code}` : 'Loading customer profile...'"
      :breadcrumbs="[
        { label: 'Customers', to: '/customers' },
        { label: customer?.name || customer?.full_name || 'Detail' },
      ]"
    >
      <template v-if="customer" #badge>
        <AppBadge :color="(customer.status_code || customer.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
          {{ customer.status_code || customer.status || 'ACTIVE' }}
        </AppBadge>
      </template>
      <template v-if="customer" #actions>
        <AppButton variant="default" size="sm" icon="i-heroicons-pencil-square" label="Edit Profile" @click="openEdit" />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading customer profile…</div>

    <template v-else-if="customer">
      <div class="kpi-grid-3">
        <AppStatCard
          label="Loyalty Points Balance"
          :value="`${customer.loyalty_account?.points_balance ?? customer.loyalty_points ?? 0} pts`"
          icon="i-heroicons-sparkles"
          tone="blue"
          :sublabel="`Tier: ${customer.loyalty_account?.tier || 'BRONZE'}`"
        />
        <AppStatCard
          label="Total Lifetime Spend"
          :value="`$${Number(customer.total_spent ?? totalSpentFromSales).toFixed(2)}`"
          icon="i-heroicons-banknotes"
          tone="green"
          :sublabel="`Across ${customerSales.length} recorded orders`"
        />
        <AppStatCard
          label="Member Since"
          :value="(customer.created_at || customer.created_datetime) ? new Date((customer.created_at || customer.created_datetime) as string).toLocaleDateString() : '—'"
          icon="i-heroicons-calendar"
          tone="neutral"
          :sublabel="customer.phone || customer.email || 'Registered Customer'"
        />
      </div>

      <div class="detail-grid">
        <AppCard title="Customer Information">
          <dl class="detail-list">
            <div class="detail-row"><dt>Code</dt><dd><code class="mono font-semibold">{{ customer.customer_code || customer.code }}</code></dd></div>
            <div class="detail-row"><dt>Name</dt><dd>{{ customer.name || customer.full_name }}</dd></div>
            <div class="detail-row"><dt>Phone</dt><dd>{{ customer.phone ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Email</dt><dd>{{ customer.email ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Address</dt><dd>{{ customer.address ?? '—' }}</dd></div>
            <div class="detail-row"><dt>Notes</dt><dd>{{ customer.notes ?? '—' }}</dd></div>
            <div class="detail-row">
              <dt>Status</dt>
              <dd>
                <AppBadge :color="(customer.status_code || customer.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
                  {{ customer.status_code || customer.status || 'ACTIVE' }}
                </AppBadge>
              </dd>
            </div>
            <div class="detail-row">
              <dt>Joined</dt>
              <dd>{{ (customer.created_at || customer.created_datetime) ? new Date((customer.created_at || customer.created_datetime) as string).toLocaleDateString() : '—' }}</dd>
            </div>
          </dl>
        </AppCard>

        <AppCard :title="`Purchase History (${customerSales.length})`" :no-pad="true">
          <AppTable
            :columns="saleCols"
            :rows="customerSales"
            :loading="false"
            empty-text="No recorded sales transactions for this customer yet."
          >
            <template #cell-invoice="{ row }">
              <NuxtLink :to="`/sales/${row.id}`" class="mono font-semibold text-gray-900 hover:underline">
                {{ row.invoice_number || row.sale_number }}
              </NuxtLink>
            </template>
            <template #cell-total="{ row }">
              <span class="mono font-semibold">${{ Number(row.total ?? row.total_amount ?? 0).toFixed(2) }}</span>
            </template>
            <template #cell-status="{ row }">
              <AppBadge :color="(row.sale_status || row.status) === 'COMPLETED' ? 'green' : 'yellow'" size="sm">
                {{ row.sale_status || row.status || 'COMPLETED' }}
              </AppBadge>
            </template>
            <template #cell-created_at="{ value }">
              <span class="text-xs text-gray-500">{{ value ? new Date(value).toLocaleDateString() : '—' }}</span>
            </template>
          </AppTable>
        </AppCard>
      </div>
    </template>

    <AppErrorState v-else title="Customer not found" @retry="loadData" />

    <!-- Edit Modal -->
    <AppModal v-model="showEdit" title="Edit Customer" size="sm">
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
          <AppButton type="button" variant="ghost" label="Cancel" @click="showEdit = false" />
          <AppButton type="submit" variant="primary" label="Save" :loading="saving" />
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
useHead({ title: 'Customer — Clothing Store Admin' })

const { getCustomer, updateCustomer } = useCustomerApi()
const { listSales } = useSaleApi()
const { addToast } = useAppToast()

const customer = ref<Customer | null>(null)
const customerSales = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showEdit = ref(false)

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

const form = reactive({
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  status: 'ACTIVE',
})

const saleCols = [
  { key: 'invoice', label: 'Invoice #' },
  { key: 'total', label: 'Amount' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
]

const totalSpentFromSales = computed(() =>
  customerSales.value.reduce((sum, s) => sum + Number(s.total ?? s.total_amount ?? 0), 0),
)

function openEdit() {
  if (!customer.value) return
  Object.assign(form, {
    name: customer.value.name || customer.value.full_name || '',
    phone: customer.value.phone ?? '',
    email: customer.value.email ?? '',
    address: customer.value.address ?? '',
    notes: customer.value.notes ?? '',
    status: customer.value.status_code || customer.value.status || 'ACTIVE',
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
      status_code: form.status,
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

async function loadData() {
  loading.value = true
  try {
    const [c, salesRes] = await Promise.all([
      getCustomer(id),
      listSales({ customer_id: id, limit: 50 }).catch(() => []),
    ])
    customer.value = c as Customer
    customerSales.value = ((salesRes as any[]) || []).filter((s: any) => !s.customer_id || s.customer_id === id)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 860px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
