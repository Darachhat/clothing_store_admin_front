<template>
  <div class="page-root">
    <AppPageHeader
      title="System Settings"
      description="Manage store configuration, branches & warehouses, tax rates, POS defaults, and security preferences."
      :breadcrumbs="[{ label: 'Administration' }, { label: 'System Settings' }]"
    />

    <!-- Language & Regional Preferences -->
    <AppCard>
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
              ? 'border-gray-900 dark:border-white bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
            @click="setLocale(loc.code)"
          >
            <span class="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 mb-1.5">{{ loc.flag }}</span>
            <span class="font-semibold">{{ loc.native }}</span>
            <span class="text-[10px] opacity-75">({{ loc.name }})</span>
            <span v-if="currentLocale === loc.code" class="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium">
              <UIcon name="i-heroicons-check-circle" class="w-3.5 h-3.5" />
              Active
            </span>
          </button>
        </div>
      </div>
    </AppCard>

    <!-- Store Information -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-building-office-2" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Store Information</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveStoreInfo">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
            <input v-model="storeInfo.name" type="text" placeholder="My Clothing Store"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select v-model="storeInfo.currency" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="USD">USD - US Dollar</option>
              <option value="KHR">KHR - Cambodian Riel</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input v-model="storeInfo.phone" type="tel" placeholder="+855 23 ..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input v-model="storeInfo.email" type="email" placeholder="store@example.com"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input v-model="storeInfo.address" type="text" placeholder="Store address"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt Footer Message</label>
            <textarea v-model="storeInfo.receipt_footer" rows="2" placeholder="Thank you for shopping with us!"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save Store Info" :loading="savingStore" />
        </div>
      </form>
    </AppCard>

    <!-- Branches & Warehouses Management -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Branches &amp; Warehouses</h3>
          </div>
          <AppButton size="sm" variant="ghost" label="Refresh" icon="i-heroicons-arrow-path" @click="loadBranches" />
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
              <input
                v-model="newBranchForm.code"
                type="text"
                placeholder="Code (BR-02)"
                required
                class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs font-mono"
              >
              <input
                v-model="newBranchForm.name"
                type="text"
                placeholder="Branch Name"
                required
                class="col-span-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs"
              >
            </div>
            <AppButton type="submit" size="sm" variant="secondary" label="Create Branch" :loading="creatingBranch" />
          </form>

          <form class="space-y-2" @submit.prevent="handleCreateWarehouse">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Add New Warehouse</p>
            <div class="grid grid-cols-3 gap-2">
              <select
                v-model="newWarehouseForm.branch_id"
                required
                class="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs"
              >
                <option value="" disabled>Branch...</option>
                <option v-for="b in branchesList" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
              <input
                v-model="newWarehouseForm.name"
                type="text"
                placeholder="Warehouse Name"
                required
                class="col-span-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 text-xs"
              >
            </div>
            <AppButton type="submit" size="sm" variant="secondary" label="Create Warehouse" :loading="creatingWarehouse" />
          </form>
        </div>
      </div>
    </AppCard>

    <!-- Tax & Pricing -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-calculator" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Tax &amp; Pricing</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="saveTaxSettings">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tax Rate (%)</label>
            <input v-model.number="taxSettings.default_tax_rate" type="number" step="0.01" min="0" max="100"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Included in Price?</label>
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
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rounding</label>
            <select v-model="taxSettings.rounding" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="none">No rounding</option>
              <option value="round">Round to nearest</option>
              <option value="ceil">Always round up</option>
              <option value="floor">Always round down</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save Tax Settings" :loading="savingTax" />
        </div>
      </form>
    </AppCard>

    <!-- POS Settings -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Point of Sale</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="savePosSettings">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Low Stock Warning Threshold</label>
            <input v-model.number="posSettings.low_stock_threshold" type="number" min="1"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Default Payment Method</label>
            <select v-model="posSettings.default_payment_method" class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BAKONG">Bakong</option>
              <option value="KHQR">KHQR</option>
            </select>
          </div>
          <div class="md:col-span-2 flex items-center gap-2">
            <input v-model="posSettings.require_customer" type="checkbox" id="req-customer" class="rounded" />
            <label for="req-customer" class="text-sm text-gray-700 dark:text-gray-300">Require customer selection on POS sales</label>
          </div>
          <div class="md:col-span-2 flex items-center gap-2">
            <input v-model="posSettings.print_receipt_on_complete" type="checkbox" id="auto-receipt" class="rounded" />
            <label for="auto-receipt" class="text-sm text-gray-700 dark:text-gray-300">Auto-print receipt on sale completion</label>
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Save POS Settings" :loading="savingPos" />
        </div>
      </form>
    </AppCard>

    <!-- External Integrations & Payment Gateways Hub -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cpu-chip" class="w-5 h-5 text-gray-500" />
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Payment Gateways &amp; Integrations Hub</h3>
              <p class="text-xs text-gray-500">Database-backed credentials for ABA PayWay, Telegram notification bots, and outbound alert channels</p>
            </div>
          </div>
          <AppButton size="sm" variant="primary" label="Open Integrations Hub" icon="i-heroicons-arrow-top-right-on-square" to="/settings/integrations" />
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
          <AppButton size="sm" variant="ghost" label="Configure" to="/settings/integrations" />
        </div>
        <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-gray-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Telegram Notifications</p>
              <p class="text-[11px] text-gray-500">Bots, alert channels, topic threads, and test pings</p>
            </div>
          </div>
          <AppButton size="sm" variant="ghost" label="Manage" to="/settings/integrations" />
        </div>
      </div>
    </AppCard>

    <!-- Telegram Notification Integration -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Telegram Bot Notifications</h3>
          </div>
          <AppButton size="sm" variant="ghost" label="Refresh Bots" icon="i-heroicons-arrow-path" @click="loadTelegramAndLogs" />
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
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Test Alert Message</label>
            <input
              v-model="testTelegramMessage"
              type="text"
              placeholder="Store alert test message..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
          </div>
          <div class="flex items-end">
            <AppButton
              type="submit"
              variant="secondary"
              label="Send Test Alert"
              icon="i-heroicons-paper-airplane"
              :loading="sendingTelegram"
            />
          </div>
        </form>
      </div>
    </AppCard>

    <!-- System & API Traffic Logs -->
    <AppCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-command-line" class="w-4 h-4 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Recent API &amp; System Traffic Logs</h3>
          </div>
          <div class="flex items-center gap-2">
            <AppButton size="sm" variant="ghost" label="Domain Audit Trail" to="/audit-logs" />
            <AppButton size="sm" variant="secondary" label="Refresh" icon="i-heroicons-arrow-path" @click="loadTelegramAndLogs" />
          </div>
        </div>
      </template>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500">
              <th class="py-2 px-2">Method</th>
              <th class="py-2 px-2">Path</th>
              <th class="py-2 px-2">Status</th>
              <th class="py-2 px-2">Latency</th>
              <th class="py-2 px-2">Client IP</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="log in systemLogs" :key="log.id" class="text-gray-700 dark:text-gray-300">
              <td class="py-2 px-2 font-mono font-semibold">{{ log.method }}</td>
              <td class="py-2 px-2 font-mono">{{ log.path }}</td>
              <td class="py-2 px-2 font-mono">{{ log.response_code }}</td>
              <td class="py-2 px-2 font-mono">{{ log.process_time_ms != null ? `${Number(log.process_time_ms).toFixed(1)} ms` : '-' }}</td>
              <td class="py-2 px-2 font-mono text-gray-500">{{ log.client_ip || '-' }}</td>
            </tr>
            <tr v-if="systemLogs.length === 0">
              <td colspan="5" class="py-4 text-center text-gray-400">No system traffic logs recorded yet</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- Account Security / Change Password -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-lock-closed" class="w-4 h-4 text-gray-500" />
          <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Account Security — Change Password</h3>
        </div>
      </template>
      <form class="space-y-4" @submit.prevent="handleChangePassword">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Current Password *</label>
            <input
              v-model="passwordForm.current_password"
              type="password"
              required
              placeholder="Current password"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">New Password (min 8 chars) *</label>
            <input
              v-model="passwordForm.new_password"
              type="password"
              minlength="8"
              required
              placeholder="New password"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Confirm New Password *</label>
            <input
              v-model="passwordForm.confirm_password"
              type="password"
              minlength="8"
              required
              placeholder="Confirm new password"
              class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <AppButton type="submit" variant="primary" label="Update Password" :loading="changingPassword" />
        </div>
      </form>
    </AppCard>

    <!-- Danger Zone -->
    <AppCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 class="font-semibold text-red-600 dark:text-red-400 text-sm">Danger Zone</h3>
        </div>
      </template>
      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Clear Transaction History</p>
            <p class="text-xs text-gray-500">Permanently delete all sales records. This cannot be undone.</p>
          </div>
          <AppButton variant="danger" size="sm" label="Clear History" @click="confirmDanger('clear_history')" />
        </div>
        <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">Reset Inventory to Zero</p>
            <p class="text-xs text-gray-500">Set all stock levels to 0 for a fresh count.</p>
          </div>
          <AppButton variant="danger" size="sm" label="Reset Stock" @click="confirmDanger('reset_stock')" />
        </div>
      </div>
    </AppCard>

    <AppConfirmDialog
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
