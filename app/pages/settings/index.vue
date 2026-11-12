<template>
  <div class="page-root">
    <PageHeader
      title="System Settings"
      description="Manage store configuration, branches & warehouses, tax rates, POS defaults, and security preferences."
      :breadcrumbs="[{ label: 'Administration' }, { label: 'System Settings' }]"
    />

    <!-- Language & Regional Preferences -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Language &amp; Regional Preferences</h3>
          </div>
          <NuxtLink
            to="/settings/translations"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <UIcon name="i-heroicons-language" class="w-3.5 h-3.5" />
            <span>Translations CMS</span>
          </NuxtLink>
        </div>
      </template>
      <div class="space-y-3">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          Select the active display language for the administrative console. Content is synchronized with the database translation dictionary.
        </p>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            v-for="loc in supportedLocales"
            :key="loc.code"
            type="button"
            class="flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all"
            :class="currentLocale === loc.code
              ? 'border-border-subtle bg-navy text-white shadow-xs'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
            @click="setLocale(loc.code)"
          >
            <span class="font-mono text-[11px] font-medium px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 mb-1.5">{{ loc.flag }}</span>
            <span class="font-semibold">{{ loc.native }}</span>
            <span class="text-[10px] opacity-75">({{ loc.name }})</span>
            <span v-if="currentLocale === loc.code" class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium">
              <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
              Active
            </span>
          </button>
        </div>
      </div>
    </DataCard>

    <!-- Store Information & Brand Management -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Store Information &amp; Brand Profile</h3>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              to="/labels"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
              <span>Sticker Templates</span>
            </NuxtLink>
            <NuxtLink
              to="/settings/receipts"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <UIcon name="i-heroicons-printer" class="w-3.5 h-3.5" />
              <span>Receipt Templates</span>
            </NuxtLink>
            <NuxtLink
              to="/settings/brand"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border border-border-subtle bg-navy text-white hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-2xs"
            >
              <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
              <span>Manage Logo &amp; Brand (One Stop)</span>
            </NuxtLink>
          </div>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveStoreInfo">
        <FormSection :columns="2">
          <FormField label="Store Name">
            <BaseInput v-model="storeInfo.name" placeholder="My Clothing Store" />
          </FormField>
          <FormField label="Currency">
            <BaseSelect v-model="storeInfo.currency" :options="currencyOptions" />
          </FormField>
          <FormField label="Phone">
            <BaseInput v-model="storeInfo.phone" type="tel" placeholder="+855 23 ..." />
          </FormField>
          <FormField label="Email">
            <BaseInput v-model="storeInfo.email" type="email" placeholder="store@example.com" />
          </FormField>
        </FormSection>
        <FormField label="Address">
          <BaseInput v-model="storeInfo.address" placeholder="Store address" />
        </FormField>
        <FormField label="Receipt Footer Message">
          <BaseTextarea v-model="storeInfo.receipt_footer" :rows="2" placeholder="Thank you for shopping with us!" />
        </FormField>
        <FormActions>
          <BaseButton type="submit" variant="primary" label="Save Store Info" :loading="savingStore" />
        </FormActions>
      </form>
    </DataCard>

    <!-- Branches & Warehouses Management -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Branches &amp; Warehouses</h3>
          </div>
          <BaseButton size="sm" variant="ghost" label="Refresh" icon="i-heroicons-arrow-path" @click="loadBranches" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="b in branchesList"
            :key="b.id"
            class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2"
          >
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ b.name }}</span>
                <span class="ml-2 text-xs font-mono text-gray-500">({{ b.code }})</span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                {{ b.status }}
              </span>
            </div>
            <p v-if="b.address" class="text-xs text-gray-500">{{ b.address }}</p>
            <div class="pt-1 border-t border-gray-200 dark:border-gray-700">
              <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1">Warehouses</p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="w in (b.warehouses || [])"
                  :key="w.id"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-200"
                >
                  <span>{{ w.name }} <template v-if="w.is_default">(Default)</template></span>
                  <button
                    type="button"
                    class="text-[10px] font-mono px-1 rounded border border-gray-200 hover:bg-gray-100"
                    :title="w.status === 'INACTIVE' ? 'Activate warehouse' : 'Deactivate warehouse'"
                    @click="toggleWarehouseStatus(w)"
                  >
                    {{ w.status || 'ACTIVE' }}
                  </button>
                </span>
                <span v-if="!b.warehouses || b.warehouses.length === 0" class="text-xs text-gray-400">No warehouses</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Create Branch / Warehouse Forms -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <form class="space-y-2" @submit.prevent="handleCreateBranch">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Add New Branch</p>
            <div class="grid grid-cols-3 gap-2">
              <BaseInput v-model="newBranchForm.code" size="sm" mono placeholder="Code (BR-02)" required />
              <div class="col-span-2">
                <BaseInput v-model="newBranchForm.name" size="sm" placeholder="Branch Name" required />
              </div>
            </div>
            <BaseButton type="submit" size="sm" variant="secondary" label="Create Branch" :loading="creatingBranch" />
          </form>

          <form class="space-y-2" @submit.prevent="handleCreateWarehouse">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Add New Warehouse</p>
            <div class="grid grid-cols-3 gap-2">
              <BaseSelect v-model="newWarehouseForm.branch_id" :options="branchSelectOptions" placeholder="Branch..." size="sm" required />
              <div class="col-span-2">
                <BaseInput v-model="newWarehouseForm.name" size="sm" placeholder="Warehouse Name" required />
              </div>
            </div>
            <BaseButton type="submit" size="sm" variant="secondary" label="Create Warehouse" :loading="creatingWarehouse" />
          </form>
        </div>
      </div>
    </DataCard>

    <!-- Tax & Pricing -->
    <DataCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Tax &amp; Pricing</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveTaxSettings">
        <FormSection :columns="3">
          <FormField label="Default Tax Rate (%)">
            <BaseInput v-model="taxSettings.default_tax_rate" type="number" :step="0.01" :min="0" :max="100" />
          </FormField>
          <FormField label="Tax Included in Price?">
            <div class="flex items-center gap-3 mt-2">
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input v-model="taxSettings.tax_inclusive" type="radio" :value="true" />
                Yes (inclusive)
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input v-model="taxSettings.tax_inclusive" type="radio" :value="false" />
                No (exclusive)
              </label>
            </div>
          </FormField>
          <FormField label="Rounding">
            <BaseSelect v-model="taxSettings.rounding" :options="roundingOptions" />
          </FormField>
        </FormSection>
        <FormActions>
          <BaseButton type="submit" variant="primary" label="Save Tax Settings" :loading="savingTax" />
        </FormActions>
      </form>
    </DataCard>

    <!-- POS Settings -->
    <DataCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Point of Sale</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="savePosSettings">
        <FormSection :columns="2">
          <FormField label="Low Stock Warning Threshold">
            <BaseInput v-model="posSettings.low_stock_threshold" type="number" :min="1" />
          </FormField>
          <FormField label="Default Payment Method">
            <BaseSelect v-model="posSettings.default_payment_method" :options="paymentMethodOptions" />
          </FormField>
        </FormSection>
        <div class="space-y-2">
          <Checkbox v-model="posSettings.require_customer" label="Require customer selection on POS sales" />
          <Checkbox v-model="posSettings.print_receipt_on_complete" label="Auto-print receipt on sale completion" />
        </div>
        <FormActions>
          <BaseButton type="submit" variant="primary" label="Save POS Settings" :loading="savingPos" />
        </FormActions>
      </form>
    </DataCard>

    <!-- External Integrations & Payment Gateways Hub -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-gray-500" />
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Payment Gateways &amp; Integrations Hub</h3>
              <p class="text-xs text-gray-500">Database-backed credentials for ABA PayWay, Telegram notification bots, and outbound alert channels</p>
            </div>
          </div>
          <BaseButton size="sm" variant="primary" label="Open Integrations Hub" icon="i-heroicons-arrow-top-right-on-square" to="/settings/integrations" />
        </div>
      </template>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-gray-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">ABA PayWay Gateway</p>
              <p class="text-[11px] text-gray-500">KHQR, merchant credentials, sandbox/live endpoints</p>
            </div>
          </div>
          <BaseButton size="sm" variant="ghost" label="Configure" to="/settings/integrations" />
        </div>
        <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-gray-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Telegram Notifications</p>
              <p class="text-[11px] text-gray-500">Bots, alert channels, topic threads, and test pings</p>
            </div>
          </div>
          <BaseButton size="sm" variant="ghost" label="Manage" to="/settings/integrations" />
        </div>
      </div>
    </DataCard>

    <!-- Telegram Notification Integration -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Telegram Bot Notifications</h3>
          </div>
          <BaseButton size="sm" variant="ghost" label="Refresh Bots" icon="i-heroicons-arrow-path" @click="loadTelegramAndLogs" />
        </div>
      </template>

      <div class="space-y-4">
        <div v-if="telegramBots.length > 0" class="space-y-2">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Configured Bots (Masked Tokens)</p>
          <div
            v-for="bot in telegramBots"
            :key="bot.id"
            class="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-xs"
          >
            <div>
              <span class="font-semibold text-gray-900 dark:text-white">{{ bot.name }}</span>
              <span class="ml-2 font-mono text-gray-500">({{ bot.code }})</span>
            </div>
            <span class="font-mono text-gray-500">{{ bot.token || '***' }}</span>
          </div>
        </div>

        <form class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2" @submit.prevent="handleSendTestTelegram">
          <div class="md:col-span-2">
            <FormField label="Test Alert Message">
              <BaseInput v-model="testTelegramMessage" placeholder="Store alert test message..." />
            </FormField>
          </div>
          <div class="flex items-end">
            <BaseButton
              type="submit"
              variant="secondary"
              label="Send Test Alert"
              icon="i-heroicons-paper-airplane"
              :loading="sendingTelegram"
            />
          </div>
        </form>
      </div>
    </DataCard>

    <!-- System & API Traffic Logs -->
    <DataCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-command-line" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Recent API &amp; System Traffic Logs</h3>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton size="sm" variant="ghost" label="Domain Audit Trail" to="/audit-logs" />
            <BaseButton size="sm" variant="secondary" label="Refresh" icon="i-heroicons-arrow-path" @click="loadTelegramAndLogs" />
          </div>
        </div>
      </template>

      <DataTable
        :columns="logColumns"
        :rows="systemLogs"
        row-key="id"
        empty-title="No system traffic logs recorded yet"
        empty-icon="i-heroicons-command-line"
      >
        <template #cell-method="{ row }"><span class="font-mono font-semibold">{{ row.method }}</span></template>
        <template #cell-path="{ row }"><span class="font-mono">{{ row.path }}</span></template>
        <template #cell-response_code="{ row }"><span class="font-mono">{{ row.response_code }}</span></template>
        <template #cell-process_time_ms="{ row }">
          <span class="font-mono">{{ row.process_time_ms != null ? `${Number(row.process_time_ms).toFixed(1)} ms` : '-' }}</span>
        </template>
        <template #cell-client_ip="{ row }"><span class="font-mono">{{ row.client_ip || '-' }}</span></template>
      </DataTable>
    </DataCard>

    <!-- Account Security / Change Password -->
    <DataCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Account Security — Change Password</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="handleChangePassword">
        <FormSection :columns="3">
          <FormField label="Current Password" required>
            <BaseInput v-model="passwordForm.current_password" type="password" required placeholder="Current password" autocomplete="current-password" />
          </FormField>
          <FormField label="New Password (min 8 chars)" required>
            <BaseInput v-model="passwordForm.new_password" type="password" :minlength="8" required placeholder="New password" autocomplete="new-password" />
          </FormField>
          <FormField label="Confirm New Password" required>
            <BaseInput v-model="passwordForm.confirm_password" type="password" :minlength="8" required placeholder="Confirm new password" autocomplete="new-password" />
          </FormField>
        </FormSection>
        <FormActions>
          <BaseButton type="submit" variant="primary" label="Update Password" :loading="changingPassword" />
        </FormActions>
      </form>
    </DataCard>

    <!-- Danger Zone -->
    <DataCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 class="font-semibold text-red-600 dark:text-red-400 text-sm">Danger Zone</h3>
        </div>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-surface-inset rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Clear Transaction History</p>
            <p class="text-xs text-gray-500">Permanently delete all sales records. This cannot be undone.</p>
          </div>
          <BaseButton variant="danger" size="sm" label="Clear History" @click="confirmDanger('clear_history')" />
        </div>
        <div class="flex items-center justify-between p-3 bg-surface-inset rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Reset Inventory to Zero</p>
            <p class="text-xs text-gray-500">Set all stock levels to 0 for a fresh count.</p>
          </div>
          <BaseButton variant="danger" size="sm" label="Reset Stock" @click="confirmDanger('reset_stock')" />
        </div>
      </div>
    </DataCard>

    <ConfirmDialog
      v-model="showDangerConfirm"
      :title="dangerAction === 'clear_history' ? 'Clear Transaction History' : 'Reset Inventory to Zero'"
      :description="dangerAction === 'clear_history' ? 'Are you sure you want to permanently delete ALL sales history?' : 'Are you sure you want to set ALL stock levels to zero?'"
      consequence="This is a destructive system-wide operation and cannot be undone."
      confirm-label="Confirm Action"
      variant="danger"
      @confirm="executeDangerAction"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const branchSelectOptions = computed(() => branchesList.value.map((b: any) => ({ value: b.id, label: b.name })))

const logColumns = [
  { key: 'method', label: 'Method' },
  { key: 'path', label: 'Path' },
  { key: 'response_code', label: 'Status' },
  { key: 'process_time_ms', label: 'Latency' },
  { key: 'client_ip', label: 'Client IP' },
]
const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'KHR', label: 'KHR - Cambodian Riel' },
  { value: 'EUR', label: 'EUR - Euro' },
]
const roundingOptions = [
  { value: 'none', label: 'No rounding' },
  { value: 'round', label: 'Round to nearest' },
  { value: 'ceil', label: 'Always round up' },
  { value: 'floor', label: 'Always round down' },
]
const paymentMethodOptions = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'BAKONG', label: 'Bakong' },
  { value: 'KHQR', label: 'KHQR' },
]
const toast = useAppToast()
const { apiFetch } = useApi()
const branchApi = useBranchApi()
const tgSystemApi = useTelegramSystemApi()
const primaryBranchId = ref<string | null>(null)
const branchesList = ref<any[]>([])
const creatingBranch = ref(false)
const creatingWarehouse = ref(false)
const newBranchForm = ref({ code: '', name: '' })
const newWarehouseForm = ref({ branch_id: '', name: '' })
const telegramBots = ref<any[]>([])
const systemLogs = ref<any[]>([])
const testTelegramMessage = ref('Test alert from Clothing Store Admin Portal')
const sendingTelegram = ref(false)

// Store settings synced with primary branch + localStorage
const storeInfo = ref({
  name: 'My Clothing Store',
  currency: 'USD',
  phone: '',
  email: '',
  address: '',
  receipt_footer: 'Thank you for your purchase!',
})

const taxSettings = ref({
  default_tax_rate: 10,
  tax_inclusive: false,
  rounding: 'round',
})

const posSettings = ref({
  low_stock_threshold: 5,
  default_payment_method: 'CASH',
  require_customer: false,
  print_receipt_on_complete: false,
})

const { currentLocale, supportedLocales, setLocale, t } = useAppTranslation()

const savingStore = ref(false)
const savingTax = ref(false)
const savingPos = ref(false)
const changingPassword = ref(false)
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

onMounted(async () => {
  // 1. Fetch server-side store & tax settings
  try {
    const s = await apiFetch<any>('/api/admin/v1/settings/store')
    if (s) {
      storeInfo.value = {
        name: s.name || storeInfo.value.name,
        currency: s.currency || storeInfo.value.currency,
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        receipt_footer: s.receipt_footer || 'Thank you for your purchase!',
      }
      taxSettings.value = {
        default_tax_rate: s.default_tax_rate ?? 5,
        tax_inclusive: s.tax_inclusive ?? false,
        rounding: s.rounding ?? 'round',
      }
    }
  } catch {
    // Fallback to localStorage cache
    const saved = localStorage.getItem('store_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.storeInfo) storeInfo.value = { ...storeInfo.value, ...parsed.storeInfo }
        if (parsed.taxSettings) taxSettings.value = { ...taxSettings.value, ...parsed.taxSettings }
        if (parsed.posSettings) posSettings.value = { ...posSettings.value, ...parsed.posSettings }
      } catch (e) { /* ignore */ }
    }
  }
  await loadBranches()
  await loadTelegramAndLogs()
})

async function loadBranches() {
  try {
    const branches = await branchApi.listBranches() as any[]
    branchesList.value = branches || []
    if (branches && branches.length > 0) {
      const main = branches[0]
      primaryBranchId.value = main.id
      if (!newWarehouseForm.value.branch_id) {
        newWarehouseForm.value.branch_id = main.id
      }
      storeInfo.value.name = main.name || storeInfo.value.name
      storeInfo.value.phone = main.phone || storeInfo.value.phone
      storeInfo.value.email = main.email || storeInfo.value.email
      storeInfo.value.address = main.address || storeInfo.value.address
    }
  } catch {
    // Fallback to localStorage values
  }
}

async function handleCreateBranch() {
  if (!newBranchForm.value.code.trim() || !newBranchForm.value.name.trim()) return
  creatingBranch.value = true
  try {
    await branchApi.createBranch({
      code: newBranchForm.value.code.trim(),
      name: newBranchForm.value.name.trim(),
    })
    newBranchForm.value = { code: '', name: '' }
    await loadBranches()
    toast.add({ title: 'Branch Created', description: 'New branch added', color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || 'Failed to create branch', color: 'red' })
  } finally {
    creatingBranch.value = false
  }
}

async function handleCreateWarehouse() {
  if (!newWarehouseForm.value.branch_id || !newWarehouseForm.value.name.trim()) return
  creatingWarehouse.value = true
  try {
    await branchApi.createWarehouse({
      branch_id: newWarehouseForm.value.branch_id,
      name: newWarehouseForm.value.name.trim(),
    })
    newWarehouseForm.value.name = ''
    await loadBranches()
    toast.add({ title: 'Warehouse Created', description: 'New warehouse added', color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || 'Failed to create warehouse', color: 'red' })
  } finally {
    creatingWarehouse.value = false
  }
}

async function toggleWarehouseStatus(w: any) {
  const nextStatus = w.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
  try {
    await branchApi.updateWarehouse(w.id, { status: nextStatus })
    await loadBranches()
    toast.add({ title: 'Warehouse Updated', description: `${w.name} is now ${nextStatus}`, color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || 'Failed to update warehouse', color: 'red' })
  }
}

async function handleChangePassword() {
  if (passwordForm.value.new_password.length < 8) {
    toast.add({ title: 'Validation Error', description: 'New password must be at least 8 characters', color: 'amber' })
    return
  }
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    toast.add({ title: 'Validation Error', description: 'New password and confirmation do not match', color: 'amber' })
    return
  }
  changingPassword.value = true
  try {
    await apiFetch('/api/admin/v1/auth/change-password', {
      method: 'POST',
      body: {
        current_password: passwordForm.value.current_password,
        new_password: passwordForm.value.new_password,
      },
    })
    passwordForm.value = { current_password: '', new_password: '', confirm_password: '' }
    toast.add({ title: 'Password Updated', description: 'Your password has been changed successfully', color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Password Change Failed', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    changingPassword.value = false
  }
}

async function loadTelegramAndLogs() {
  try {
    const botsRes = await tgSystemApi.listBots()
    telegramBots.value = (botsRes as any)?.data?.items || (botsRes as any)?.items || []
  } catch {
    telegramBots.value = []
  }
  try {
    const logsRes = await tgSystemApi.listSystemLogs({ limit: 10 })
    systemLogs.value = (logsRes as any)?.data?.items || (logsRes as any)?.items || []
  } catch {
    systemLogs.value = []
  }
}

async function handleSendTestTelegram() {
  if (!testTelegramMessage.value.trim()) return
  sendingTelegram.value = true
  try {
    await tgSystemApi.sendTestMessage({ message: testTelegramMessage.value.trim() })
    toast.add({ title: 'Telegram Dispatched', description: 'Test alert sent to Telegram service', color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Telegram Alert', description: err?.data?.detail || 'Unable to send Telegram alert', color: 'amber' })
  } finally {
    sendingTelegram.value = false
  }
}

function persistSettings() {
  localStorage.setItem('store_settings', JSON.stringify({
    storeInfo: storeInfo.value,
    taxSettings: taxSettings.value,
    posSettings: posSettings.value,
  }))
}

async function saveStoreInfo() {
  savingStore.value = true
  try {
    if (primaryBranchId.value) {
      await branchApi.updateBranch(primaryBranchId.value, {
        name: storeInfo.value.name,
        phone: storeInfo.value.phone || undefined,
        email: storeInfo.value.email || undefined,
        address: storeInfo.value.address || undefined,
      })
    }
    // Persist server-side
    await apiFetch('/api/admin/v1/settings/store', {
      method: 'PUT',
      body: {
        name: storeInfo.value.name,
        currency: storeInfo.value.currency,
        phone: storeInfo.value.phone,
        email: storeInfo.value.email,
        address: storeInfo.value.address,
        receipt_footer: storeInfo.value.receipt_footer,
        default_tax_rate: taxSettings.value.default_tax_rate,
        tax_inclusive: taxSettings.value.tax_inclusive,
        rounding: taxSettings.value.rounding,
      },
    })
    persistSettings()
    toast.add({ title: 'Saved', description: 'Store information persisted to database', color: 'green' })
  } catch (err: any) {
    persistSettings()
    toast.add({ title: 'Saved Locally', description: err?.data?.detail || 'Updated in local store', color: 'amber' })
  } finally {
    savingStore.value = false
  }
}

async function saveTaxSettings() {
  savingTax.value = true
  try {
    await apiFetch('/api/admin/v1/settings/store', {
      method: 'PUT',
      body: {
        name: storeInfo.value.name,
        currency: storeInfo.value.currency,
        phone: storeInfo.value.phone,
        email: storeInfo.value.email,
        address: storeInfo.value.address,
        receipt_footer: storeInfo.value.receipt_footer,
        default_tax_rate: taxSettings.value.default_tax_rate,
        tax_inclusive: taxSettings.value.tax_inclusive,
        rounding: taxSettings.value.rounding,
      },
    })
    persistSettings()
    toast.add({ title: 'Saved', description: 'Tax settings persisted to database', color: 'green' })
  } catch (err: any) {
    persistSettings()
    toast.add({ title: 'Saved Locally', description: err?.data?.detail || 'Updated in local store', color: 'amber' })
  } finally {
    savingTax.value = false
  }
}

async function savePosSettings() {
  savingPos.value = true
  await new Promise(r => setTimeout(r, 400))
  persistSettings()
  toast.add({ title: 'Saved', description: 'POS settings updated', color: 'green' })
  savingPos.value = false
}

const showDangerConfirm = ref(false)
const dangerAction = ref('')

function confirmDanger(action: string) {
  dangerAction.value = action
  showDangerConfirm.value = true
}

function executeDangerAction() {
  showDangerConfirm.value = false
  toast.add({ title: 'Action Blocked', description: 'Danger zone actions are disabled in demo mode.', color: 'amber' })
}
</script>