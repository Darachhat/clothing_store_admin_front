<template>
  <div class="page-root">
    <AppPageHeader
      title="Business Expenses"
      description="Track and manage operational expenditures, receipt attachments, and expense approvals."
      :breadcrumbs="[
        { label: 'Finance', to: '/expenses' },
        { label: 'Expenses' },
      ]"
      primary-label="Record Expense"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-chart-bar" label="Profit & Loss" to="/reports/profit" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchExpenses" />
      </template>
    </AppPageHeader>

    <!-- Summary KPI cards -->
    <div class="kpi-grid-3">
      <AppStatCard
        label="Total Approved"
        :value="`$${totalApproved.toFixed(2)}`"
        icon="i-heroicons-check-badge"
        tone="green"
        :loading="loading"
        sublabel="Approved operating expenditures"
      />
      <AppStatCard
        label="Pending Review"
        :value="pendingCount"
        icon="i-heroicons-clock"
        :tone="pendingCount > 0 ? 'amber' : 'neutral'"
        :loading="loading"
        sublabel="Awaiting manager or admin approval"
      />
      <AppStatCard
        label="Total Records"
        :value="filteredExpenses.length"
        icon="i-heroicons-banknotes"
        tone="neutral"
        :loading="loading"
        :sublabel="`Total value: $${totalAll.toFixed(2)}`"
      />
    </div>

    <!-- Filters -->
    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search expenses by number, category, description, or method..."
      :chips="activeChips"
      :shown-count="filteredExpenses.length"
      :total-count="expenses.length"
      count-label="expenses"
      @remove-chip="statusFilter = ''; fetchExpenses()"
      @clear-all="searchQuery = ''; statusFilter = ''; fetchExpenses()"
    >
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        placeholder="All Statuses"
        style="min-width: 160px;"
        @change="fetchExpenses"
      />
    </AppFilterBar>

    <!-- Expenses Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredExpenses"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-banknotes',
          label: 'No expenses recorded yet',
          description: 'Record operating expenses to track net store profitability.',
        }"
      >
        <template #cell-expense_number="{ row }">
          <span class="mono font-semibold text-gray-900">
            {{ row.expense_number || '—' }}
          </span>
        </template>

        <template #cell-category="{ row }">
          <span class="text-sm font-medium text-gray-900">
            {{ row.category?.name || row.category || 'General' }}
          </span>
        </template>

        <template #cell-description="{ row }">
          <span class="text-sm text-gray-700">{{ row.description || row.title || '—' }}</span>
        </template>

        <template #cell-amount="{ row }">
          <span class="mono font-semibold text-gray-900">
            ${{ Number(row.amount || 0).toFixed(2) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="getStatusColor(row.status_code || row.status)"
            :label="row.status_code || row.status"
            size="sm"
          />
        </template>

        <template #cell-receipt="{ row }">
          <a
            v-if="row.receipt_url"
            :href="row.receipt_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-gray-900 hover:underline font-mono"
          >
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
            Receipt
          </a>
          <span v-else class="text-xs text-gray-400">—</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton
              v-if="(row.status_code || row.status) === 'PENDING'"
              size="xs"
              variant="primary"
              label="Approve"
              @click="approveExpense(row)"
            />
            <AppButton
              v-if="(row.status_code || row.status) === 'PENDING'"
              size="xs"
              variant="danger"
              label="Reject"
              @click="promptReject(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Record Expense Modal -->
    <AppModal v-model="showCreateModal" title="Record New Expense" size="md">
      <form class="form-grid" @submit.prevent="handleCreateExpense">
        <div class="form-field">
          <label class="field-label">Expense Category <span class="required">*</span></label>
          <select
            v-model="createForm.category_id"
            required
            class="field-input"
          >
            <option value="" disabled>Select category</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Amount ($) <span class="required">*</span></label>
            <input
              v-model.number="createForm.amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              class="field-input mono"
            />
          </div>
          <div class="form-field">
            <label class="field-label">Payment Method <span class="required">*</span></label>
            <select
              v-model="createForm.payment_method"
              required
              class="field-input"
            >
              <option value="CASH">Cash</option>
              <option value="KHQR">KHQR</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Expense Date <span class="required">*</span></label>
          <input
            v-model="createForm.expense_date"
            type="date"
            required
            class="field-input"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Description</label>
          <input
            v-model="createForm.description"
            type="text"
            placeholder="e.g. Electricity bill for September"
            class="field-input"
          />
        </div>

        <div class="form-field">
          <AppFileUpload
            v-model="createForm.receipt_url"
            folder="expenses"
            label="Receipt Attachment"
            hint="Upload receipt slip, photo, or invoice PDF"
          />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showCreateModal = false" />
          <AppButton type="submit" variant="primary" label="Save Expense" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showRejectConfirm"
      title="Reject Expense Claim"
      variant="danger"
      confirm-label="Reject Expense"
      :loading="rejecting"
      :message="`Are you sure you want to reject expense ${rejectTarget?.expense_number || ''} ($${Number(rejectTarget?.amount || 0).toFixed(2)})?`"
      consequence="Rejected expenses are excluded from approved P&L expense totals."
      @confirm="executeRejectExpense"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Business Expenses — Clothing Store Admin' })

const expenseApi = useExpenseApi()
const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const rejecting = ref(false)
const expenses = ref<any[]>([])
const categories = ref<any[]>([])
const defaultBranchId = ref<string>('')

const searchQuery = ref('')
const statusFilter = ref('')
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

const columns = [
  { key: 'expense_number', label: 'Number', sortable: true },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'payment_method', label: 'Method' },
  { key: 'expense_date', label: 'Date', sortable: true },
  { key: 'receipt', label: 'Receipt' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const showCreateModal = ref(false)
const showRejectConfirm = ref(false)
const rejectTarget = ref<any>(null)

const createForm = ref({
  category_id: '',
  amount: 50,
  payment_method: 'CASH',
  expense_date: new Date().toISOString().split('T')[0],
  description: '',
  receipt_url: '' as string | null,
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  return chips
})

const filteredExpenses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return expenses.value.filter((e) => {
    if (q) {
      const hay = [e.expense_number, e.category?.name, e.description, e.payment_method]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const totalApproved = computed(() =>
  expenses.value
    .filter(e => (e.status_code || e.status) === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount || 0), 0),
)

const totalAll = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0),
)

const pendingCount = computed(() =>
  expenses.value.filter(e => (e.status_code || e.status) === 'PENDING').length,
)

function getStatusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'green'
    case 'PENDING': return 'yellow'
    case 'REJECTED': return 'red'
    default: return 'default'
  }
}

function openCreateModal() {
  createForm.value = {
    category_id: categories.value[0]?.id || '',
    amount: 50,
    payment_method: 'CASH',
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    receipt_url: '',
  }
  showCreateModal.value = true
}

async function fetchExpenses() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (statusFilter.value) params.status = statusFilter.value
    const data = await expenseApi.listExpenses(params) as any
    expenses.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const [cats, stocks] = await Promise.all([
      expenseApi.listCategories().catch(() => []) as Promise<any>,
      invApi.listStocks().catch(() => []) as Promise<any>,
    ])
    categories.value = Array.isArray(cats) ? cats : (cats?.items || [])
    const stockArr = Array.isArray(stocks) ? stocks : (stocks?.items || [])
    if (stockArr.length > 0 && stockArr[0].warehouse?.branch_id) {
      defaultBranchId.value = stockArr[0].warehouse.branch_id
    }
  } catch (e) {
    console.error('Failed to fetch categories:', e)
  }
}

async function handleCreateExpense() {
  saving.value = true
  try {
    await expenseApi.createExpense({
      category_id: createForm.value.category_id,
      branch_id: defaultBranchId.value || '00000000-0000-0000-0000-000000000000',
      amount: createForm.value.amount,
      payment_method: createForm.value.payment_method,
      expense_date: createForm.value.expense_date,
      description: createForm.value.description,
      receipt_url: createForm.value.receipt_url || null,
    })

    toast.add({ title: 'Success', description: 'Expense recorded successfully', color: 'green' })
    showCreateModal.value = false
    await fetchExpenses()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function approveExpense(row: any) {
  try {
    await expenseApi.approveExpense(row.id)
    toast.add({ title: 'Success', description: `Expense ${row.expense_number} approved`, color: 'green' })
    await fetchExpenses()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  }
}

function promptReject(row: any) {
  rejectTarget.value = row
  showRejectConfirm.value = true
}

async function executeRejectExpense() {
  if (!rejectTarget.value) return
  rejecting.value = true
  try {
    await expenseApi.rejectExpense(rejectTarget.value.id)
    toast.add({ title: 'Notice', description: `Expense ${rejectTarget.value.expense_number} rejected`, color: 'amber' })
    showRejectConfirm.value = false
    await fetchExpenses()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    rejecting.value = false
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchExpenses()
})
</script>
