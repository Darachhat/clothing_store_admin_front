<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Sales Returns</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">View processed refunds and return requests</p>
      </div>
      <AppButton to="/pos" label="Open POS" variant="primary" target="_blank" />
    </div>

    <!-- Filters -->
    <AppCard>
      <div class="flex gap-3 flex-wrap items-end">
        <div class="flex-1 min-w-48">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
          <input v-model="fromDate" type="date" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" @change="fetchReturns" />
        </div>
        <div class="flex-1 min-w-48">
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
          <input v-model="toDate" type="date" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" @change="fetchReturns" />
        </div>
        <AppButton variant="ghost" @click="fetchReturns">Refresh</AppButton>
      </div>
    </AppCard>

    <!-- Returns Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="returns"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-arrow-uturn-left', label: 'No returns found' }"
      >
        <template #cell-return_number="{ row }">
          <span class="font-mono font-medium text-amber-600 dark:text-amber-400">{{ row.return_number }}</span>
        </template>

        <template #cell-return_type="{ row }">
          <AppBadge :color="row.return_type === 'FULL' ? 'red' : 'amber'" :label="row.return_type" size="sm" variant="subtle" />
        </template>

        <template #cell-total_refund="{ row }">
          <span class="font-bold text-red-600 dark:text-red-400">-${{ Number(row.total_refund).toFixed(2) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="row.status === 'COMPLETED' ? 'emerald' : 'gray'" :label="row.status" size="sm" variant="subtle" />
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-sm text-gray-500">{{ new Date(row.created_at).toLocaleDateString() }}</span>
        </template>
      </AppTable>
    </AppCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const saleApi = useSaleApi()
const toast = useAppToast()

const loading = ref(false)
const returns = ref<any[]>([])
const fromDate = ref('')
const toDate = ref('')

const columns = [
  { key: 'return_number', label: 'Return #' },
  { key: 'return_type', label: 'Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'total_refund', label: 'Refund' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Date' },
]

async function fetchReturns() {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (fromDate.value) params.from_date = fromDate.value
    if (toDate.value) params.to_date = toDate.value
    const data = await saleApi.listReturns(params) as any[]
    returns.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

onMounted(fetchReturns)
</script>
