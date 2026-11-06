<template>
  <div class="page-root">
    <AppPageHeader
      title="Expenses"
      description="Track store operating expenses, rent, utilities, payroll, and approve or reject expense claims."
      :breadcrumbs="[
        { label: 'Finance', to: '/expenses' },
        { label: 'Expenses' },
      ]"
      primary-label="Record Expense"
      primary-icon="i-heroicons-plus"
      @primary-click="openModal"
    >
      <template #secondary>
        <AppButton size="sm" variant="default" icon="i-heroicons-chart-bar" label="Profit & Loss" to="/reports/profit" />
        <AppButton size="sm" variant="default" icon="i-heroicons-arrow-path" label="Refresh" :loading="loading" @click="fetchExpenses" />
      </template>
    </AppPageHeader>

    <!-- KPI Summary Cards with Semantic Heroicons -->
    <div class="kpi-grid-3">
      <AppStatCard
        label="Total Expenses"
        :value="`$${totalExpenses.toFixed(2)}`"
        icon="i-heroicons-banknotes"
        tone="red"
        :loading="loading"
        :sublabel="`Across ${filteredExpenses.length} expense records`"
      />
      <AppStatCard
        label="Pending Approval"
        :value="pendingCount"
        icon="i-heroicons-clock"
        :tone="pendingCount > 0 ? 'amber' : 'neutral'"
        :loading="loading"
        sublabel="Awaiting manager or admin review"
      />
      <AppStatCard
        label="Approved Expenses"
        :value="`$${approvedTotal.toFixed(2)}`"
        icon="i-heroicons-check-badge"
        tone="green"
        :loading="loading"
        :sublabel="`${approvedCount} approved records`"
      />
    </div>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search expenses by title, category, or notes..."
      :chips="activeChips"
      :shown-count="filteredExpenses.length"
      :total-count="expenses.length"
      count-label="expenses"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="categoryFilter"
        :options="[
          { label: 'All Categories', value: '' },
          { label: 'Rent', value: 'RENT' },
          { label: 'Utilities', value: 'UTILITIES' },
          { label: 'Salaries / Wages', value: 'SALARIES' },
          { label: 'Supplies & Packaging', value: 'SUPPLIES' },
          { label: 'Marketing', value: 'MARKETING' },
          { label: 'Maintenance', value: 'MAINTENANCE' },
          { label: 'Other', value: 'OTHER' },
        ]"
        style="min-width: 165px;"
      />
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Rejected', value: 'REJECTED' },
        ]"
        style="min-width: 145px;"
      />
    </AppFilterBar>

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
        <template #cell-category="{ row }">
          <AppBadge color="blue" size="sm">{{ row.category }}</AppBadge>
        </template>

        <template #cell-amount="{ row }">
          <span class="mono font-bold text-red-700">${{ Number(row.amount).toFixed(2) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status === 'APPROVED' ? 'green' : row.status === 'REJECTED' ? 'red' : 'yellow'"
            size="sm"
          >
            {{ row.status }}
          </AppBadge>
        </template>

        <template #cell-expense_date="{ row }">
          <span class="text-xs text-gray-500">{{ new Date(row.expense_date || row.created_at).toLocaleDateString() }}</span>
        </template>

        <template #cell-actions="{ row }">
          <div v-if="row.status === 'PENDING'" class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="primary" label="Approve" @click="approveExpense(row)" />
            <AppButton size="xs" variant="danger" label="Reject" @click="promptReject(row)" />
          </div>
          <span v-else class="text-xs text-gray-400">Processed</span>
        </template>
      </AppTable>
    </AppCard>

    <!-- Record Expense Modal -->
    <AppModal
      v-model="showModal"
      title="Record Expense"
      size="sm"
    >
      <form class="form-grid" @submit.prevent="submitExpense">
        <div class="form-field">
          <label class="field-label">Description / Title <span class="required">*</span></label>
          <input v-model="form.title" type="text" required placeholder="e.g. Monthly electricity bill" class="field-input" />
        </div>

        <div class="form-row">
          <div class="form-field">
            <label class="field-label">Category <span class="required">*</span></label>
            <select v-model="form.category" required class="field-input">
              <option value="RENT">Rent</option>
              <option value="UTILITIES">Utilities</option>
              <option value="SALARIES">Salaries / Wages</option>
              <option value="SUPPLIES">Supplies &amp; Packaging</option>
              <option value="MARKETING">Marketing</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Amount ($) <span class="required">*</span></label>
            <input v-model.number="form.amount" type="number" step="0.01" min="0.01" required class="field-input mono" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">Expense Date <span class="required">*</span></label>
          <input v-model="form.expense_date" type="date" required class="field-input" />
        </div>

        <div class="form-field">
          <label class="field-label">Notes</label>
          <textarea v-model="form.notes" rows="2" placeholder="Optional receipt reference or vendor..." class="field-input field-textarea" />
        </div>

        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
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
      :message="`Are you sure you want to reject expense &quot;${rejectTarget?.title}&quot; ($${Number(rejectTarget?.amount || 0).toFixed(2)})?`"
      consequence="Rejected expenses are excluded from approved P&L expense totals."
      @confirm="executeRejectExpense"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Expenses — Clothing Store Admin' })

const expenseApi = useExpenseApi()
const branchApi = useBranchApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const rejecting = ref(false)
const showModal = ref(false)
const expenses = ref<any[]>([])
const defaultBranchId = ref('')

const searchQuery = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')

const showRejectConfirm = ref(false)
const rejectTarget = ref<any>(null)

const form = ref({
  branch_id: '',
  title: '',
  category: 'UTILITIES',
  amount: 0,
  expense_date: new Date().toISOString().slice(0, 10),
  notes: '',
})

const filteredExpenses = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return expenses.value.filter((e) => {
    if (categoryFilter.value && e.category !== categoryFilter.value) return false
    if (statusFilter.value && e.status !== statusFilter.value) return false
    if (q) {
      const hay = [e.title, e.category, e.notes].filter(Boolean).join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const totalExpenses = computed(() =>
  filteredExpenses.value.reduce((sum, e) => sum + Number(e.amount || 0), 0),
)
const pendingCount = computed(() =>
  filteredExpenses.value.filter(e => e.status === 'PENDING').length,
)
const approvedCount = computed(() =>
  filteredExpenses.value.filter(e => e.status === 'APPROVED').length,
)
const approvedTotal = computed(() =>
  filteredExpenses.value.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + Number(e.amount || 0), 0),
)

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (categoryFilter.value) chips.push({ key: 'category', label: 'Category', value: categoryFilter.value })
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  return chips
})

function removeChip(key: string) {
  if (key === 'category') categoryFilter.value = ''
  if (key === 'status') statusFilter.value = ''
}

function resetFilters() {
  searchQuery.value = ''
  categoryFilter.value = ''
  statusFilter.value = ''
}

const columns = [
  { key: 'title', label: 'Description', sortable: true },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'expense_date', label: 'Date', sortable: true },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

function openModal() {
  form.value = {
    branch_id: defaultBranchId.value,
    title: '',
    category: 'UTILITIES',
    amount: 0,
    expense_date: new Date().toISOString().slice(0, 10),
    notes: '',
  }
  showModal.value = true
}

async function fetchExpenses() {
  loading.value = true
  try {
    if (!defaultBranchId.value) {
      const branches = await branchApi.listBranches().catch(() => []) as any[]
      if (branches?.[0]?.id) defaultBranchId.value = branches[0].id
    }
    const data = await expenseApi.listExpenses() as any[]
    expenses.value = data || []
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function submitExpense() {
  saving.value = true
  try {
    await expenseApi.createExpense({
      ...form.value,
      branch_id: form.value.branch_id || defaultBranchId.value || undefined,
    })
    toast.add({ title: 'Recorded', description: 'Expense recorded', color: 'green' })
    showModal.value = false
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
    toast.add({ title: 'Approved', description: 'Expense approved', color: 'green' })
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
    toast.add({ title: 'Rejected', description: 'Expense rejected', color: 'amber' })
    showRejectConfirm.value = false
    await fetchExpenses()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    rejecting.value = false
  }
}

onMounted(fetchExpenses)
</script>
