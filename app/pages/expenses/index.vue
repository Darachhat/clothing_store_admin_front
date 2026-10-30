<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Business Expenses</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Track and manage operational expenditures</p>
      </div>
      <AppButton
        label="Record Expense"
        variant="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Summary KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Total Approved</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              ${{ totalApproved.toFixed(2) }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
            
          </div>
        </div>
      </AppCard>
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Pending Review</p>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {{ pendingCount }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
            
          </div>
        </div>
      </AppCard>
      <AppCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500">Total Records</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ expenses.length }}
            </p>
          </div>
          <div class="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center">
            
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap">
        <AppSelect
          v-model="statusFilter"
          :options="statusOptions"
          placeholder="All Statuses"
          class="w-48"
          @update:model-value="fetchExpenses"
        />
        <AppButton variant="ghost" @click="fetchExpenses">
          Refresh
        </AppButton>
      </div>
    </AppCard>

    <!-- Expenses Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="expenses"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-banknotes', label: 'No expenses recorded yet' }"
      >
        <template #cell-expense_number="{ row }">
          <span class="font-mono font-medium text-primary-600 dark:text-primary-400">
            {{ row.expense_number }}
          </span>
        </template>

        <template #cell-category="{ row }">
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ row.category?.name || 'General' }}
          </span>
        </template>

        <template #cell-amount="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">
            ${{ Number(row.amount).toFixed(2) }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="getStatusColor(row.status)"
            :label="row.status"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-receipt="{ row }">
          <a
            v-if="row.receipt_url"
            :href="row.receipt_url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline font-mono"
          >
            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
            Receipt
          </a>
          <span v-else class="text-xs text-gray-400">—</span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              v-if="row.status === 'PENDING'"
              size="sm"
              color="emerald"
              variant="default"
              label="Approve"
              @click="approveExpense(row)"
            />
            <AppButton
              v-if="row.status === 'PENDING'"
              size="sm"
              variant="danger"
              label="Reject"
              @click="rejectExpense(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Record Expense Modal -->
    <AppModal v-model="showCreateModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Record New Expense</h3>
            <AppButton variant="ghost" size="sm" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateExpense">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Category *</label>
            <select
              v-model="createForm.category_id"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="" disabled>Select category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($) *</label>
              <input
                v-model.number="createForm.amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method *</label>
              <select
                v-model="createForm.payment_method"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="CASH">Cash</option>
                <option value="KHQR">KHQR</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Date *</label>
            <input
              v-model="createForm.expense_date"
              type="date"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              v-model="createForm.description"
              type="text"
              placeholder="e.g. Electricity bill for September"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <AppFileUpload
            v-model="createForm.receipt_url"
            folder="expenses"
            label="Receipt Attachment"
            hint="Upload receipt slip, photo, or invoice PDF"
          />

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Save Expense" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
const expenseApi = useExpenseApi()
const invApi = useInventoryApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const expenses = ref<any[]>([])
const categories = ref<any[]>([])
const defaultBranchId = ref<string>('')

const statusFilter = ref('')
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

const columns = [
  { key: 'expense_number', label: 'Number' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'payment_method', label: 'Method' },
  { key: 'expense_date', label: 'Date' },
  { key: 'receipt', label: 'Receipt' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const createForm = ref({
  category_id: '',
  amount: 0,
  payment_method: 'CASH',
  expense_date: new Date().toISOString().split('T')[0],
  description: '',
  receipt_url: '',
})

const totalApproved = computed(() => {
  return expenses.value
    .filter((e) => e.status === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount), 0)
})

const pendingCount = computed(() => {
  return expenses.value.filter((e) => e.status === 'PENDING').length
})

function getStatusColor(status: string) {
  switch (status) {
    case 'APPROVED': return 'emerald'
    case 'PENDING': return 'amber'
    case 'REJECTED': return 'red'
    default: return 'gray'
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
    const data = await expenseApi.listExpenses(params) as any[]
    expenses.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  try {
    const [cats, stocks] = await Promise.all([
      expenseApi.listCategories() as Promise<any[]>,
      invApi.listStocks() as Promise<any[]>,
    ])
    categories.value = cats
    if (stocks.length > 0 && stocks[0].warehouse) {
      defaultBranchId.value = stocks[0].warehouse.branch_id
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
    toast.add({ title: 'Error', description: err.message, color: 'red' })
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
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

async function rejectExpense(row: any) {
  try {
    await expenseApi.rejectExpense(row.id)
    toast.add({ title: 'Notice', description: `Expense ${row.expense_number} rejected`, color: 'amber' })
    await fetchExpenses()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

onMounted(async () => {
  await fetchCategories()
  await fetchExpenses()
})
</script>
