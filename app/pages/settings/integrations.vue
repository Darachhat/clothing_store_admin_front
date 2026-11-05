<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Integrations &amp; Gateways</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage database-stored ABA PayWay payment gateway credentials and Telegram notification bots
        </p>
      </div>

      <!-- Tab Switcher -->
      <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          :class="activeTab === 'payway' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
          @click="activeTab = 'payway'"
        >
          <UIcon name="i-heroicons-credit-card" class="w-4 h-4" />
          <span>ABA PayWay Gateway</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          :class="activeTab === 'telegram' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'"
          @click="activeTab = 'telegram'"
        >
          <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
          <span>Telegram Notifications</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: ABA PAYWAY GATEWAY CONFIGURATION                                 -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'payway'" class="space-y-6">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">ABA PayWay Payment Gateway</h3>
                <p class="text-xs text-gray-500">Configured in auth.system and auth.credential_api_key</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <AppBadge :variant="paywayForm.status_code === 'active' ? 'success' : 'default'">
                {{ paywayForm.status_code === 'active' ? 'Active' : 'Inactive' }}
              </AppBadge>
              <AppButton size="sm" variant="ghost" icon="i-heroicons-arrow-path" :loading="loadingPayway" @click="loadPaywayConfig" />
            </div>
          </div>
        </template>

        <form class="space-y-5" @submit.prevent="savePaywayConfig">
          <!-- Gateway Status & Mode -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gateway Status</label>
              <select
                v-model="paywayForm.status_code"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="active">Active (Processing Transactions)</option>
                <option value="inactive">Inactive (Disabled)</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gateway Environment</label>
              <select
                v-model="paywayForm.base_url"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="https://checkout-sandbox.payway.com.kh">Sandbox (https://checkout-sandbox.payway.com.kh)</option>
                <option value="https://checkout.payway.com.kh">Production / Live (https://checkout.payway.com.kh)</option>
              </select>
            </div>
          </div>

          <!-- Merchant & Secret Keys -->
          <div class="space-y-4">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Gateway API Credentials</h4>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">PayWay Merchant ID</label>
                <input
                  v-model="paywayForm.merchant_id"
                  type="text"
                  placeholder="e.g. ec479700"
                  class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  required
                >
              </div>

              <div>
                <div class="flex items-center justify-between mb-1">
                  <label class="text-xs font-medium text-gray-700 dark:text-gray-300">Public HMAC Signing Key</label>
                  <button
                    type="button"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1"
                    @click="showPublicKey = !showPublicKey"
                  >
                    <UIcon :name="showPublicKey ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-3.5 h-3.5" />
                    <span>{{ showPublicKey ? 'Hide' : 'Reveal' }}</span>
                  </button>
                </div>
                <input
                  v-model="paywayForm.public_key"
                  :type="showPublicKey ? 'text' : 'password'"
                  placeholder="3F3C50388E2F0236777CC5E9BB90D47C35447D5B"
                  class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                  required
                >
              </div>
            </div>

            <!-- RSA Keys Section (Collapsible) -->
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3.5 space-y-3">
              <div class="flex items-center justify-between cursor-pointer" @click="showRsaKeys = !showRsaKeys">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-key" class="w-4 h-4 text-gray-500" />
                  <span class="text-xs font-medium text-gray-900 dark:text-white">PayWay RSA Cryptographic Keys (Optional for standard KHQR)</span>
                </div>
                <UIcon :name="showRsaKeys ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 text-gray-500" />
              </div>

              <div v-show="showRsaKeys" class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">RSA Public Key</label>
                  <textarea
                    v-model="paywayForm.rsa_public_key"
                    rows="3"
                    placeholder="MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ..."
                    class="w-full font-mono text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">RSA Private Key</label>
                  <textarea
                    v-model="paywayForm.rsa_private_key"
                    rows="3"
                    placeholder="MIICXAIBAAKBgQDCt4VrCyJJ9hYhA..."
                    class="w-full font-mono text-xs rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Webhook & Checkout Endpoints -->
          <div class="space-y-4 pt-2">
            <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">Endpoints &amp; Timers</h4>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Pushback Webhook Domain (Callback Base URL)</label>
                <input
                  v-model="paywayForm.callback_base_url"
                  type="url"
                  placeholder="https://api.kimvannak.store"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                <p class="text-[11px] text-gray-400 mt-1">ABA sends instant payment IPN callbacks to /api/payments/aba/pushback under this domain.</p>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">QR Expiration (Minutes)</label>
                <input
                  v-model.number="paywayForm.qr_lifetime_minutes"
                  type="number"
                  min="1"
                  max="120"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
              </div>

              <div class="md:col-span-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Checkout Script Plugin URL</label>
                <input
                  v-model="paywayForm.checkout_script_url"
                  type="text"
                  placeholder="https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-white"
                >
              </div>
            </div>
          </div>

          <!-- Test Results Display -->
          <div
            v-if="testResult"
            class="p-3.5 rounded-lg border text-xs space-y-1.5"
            :class="testResult.is_valid ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'"
          >
            <div class="flex items-center gap-2 font-semibold" :class="testResult.is_valid ? 'text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'">
              <UIcon :name="testResult.is_valid ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-triangle'" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span>{{ testResult.message }}</span>
            </div>
            <pre v-if="testResult.details" class="p-2 rounded bg-white dark:bg-gray-900 font-mono text-[11px] overflow-x-auto text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">{{ JSON.stringify(testResult.details, null, 2) }}</pre>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButton
              type="button"
              variant="secondary"
              label="Test Gateway Connectivity"
              icon="i-heroicons-signal"
              :loading="testingPayway"
              @click="handleTestPayway"
            />
            <AppButton
              type="submit"
              variant="primary"
              label="Save Gateway Configuration"
              icon="i-heroicons-check"
              :loading="savingPayway"
            />
          </div>
        </form>
      </AppCard>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: TELEGRAM NOTIFICATIONS & BOT INTEGRATION                         -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-show="activeTab === 'telegram'" class="space-y-6">
      <!-- Active Bots Card -->
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Configured Telegram Bots</h3>
                <p class="text-xs text-gray-500">Stored in auth.telegram_bot table</p>
              </div>
            </div>
            <AppButton size="sm" variant="ghost" icon="i-heroicons-arrow-path" :loading="loadingTelegram" @click="loadTelegramData" />
          </div>
        </template>

        <div class="space-y-4">
          <div v-if="telegramBots.length === 0 && !loadingTelegram" class="py-6 text-center text-xs text-gray-500">
            No Telegram bots configured.
          </div>

          <div
            v-for="bot in telegramBots"
            :key="bot.id"
            class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 space-y-3"
          >
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ bot.name }}</span>
                <span class="ml-2 font-mono text-xs text-gray-500">({{ bot.code }})</span>
                <span v-if="bot.username" class="ml-2 font-mono text-xs text-gray-600 dark:text-gray-300">@{{ bot.username }}</span>
              </div>
              <div class="flex items-center gap-2">
                <AppBadge :variant="bot.status_code === 'active' ? 'success' : 'default'">
                  {{ bot.status_code || 'active' }}
                </AppBadge>
                <AppButton size="sm" variant="secondary" label="Edit Token" icon="i-heroicons-pencil-square" @click="openEditBotModal(bot)" />
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700 font-mono">
              <span>Token: {{ bot.token ? bot.token.slice(0, 8) + '...' + bot.token.slice(-6) : 'Not configured' }}</span>
              <span>Updated: {{ bot.updated_datetime ? new Date(bot.updated_datetime).toLocaleDateString() : 'N/A' }}</span>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Alert Channels & Groups Card -->
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Operational Alert Channels</h3>
                <p class="text-xs text-gray-500">Configured Telegram chat groups stored in auth.telegram_chat</p>
              </div>
            </div>
            <AppButton size="sm" variant="primary" label="Add Channel" icon="i-heroicons-plus" @click="openCreateChatModal" />
          </div>
        </template>

        <div class="space-y-4">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500 font-medium">
                  <th class="py-2.5 px-3">Code</th>
                  <th class="py-2.5 px-3">Channel Name</th>
                  <th class="py-2.5 px-3">Chat ID</th>
                  <th class="py-2.5 px-3">Thread / Topic</th>
                  <th class="py-2.5 px-3">Type</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-if="telegramChats.length === 0 && !loadingTelegram">
                  <td colspan="7" class="py-6 text-center text-gray-400">No alert channels found.</td>
                </tr>
                <tr v-for="chat in telegramChats" :key="chat.id" class="text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td class="py-2.5 px-3 font-mono font-semibold">{{ chat.code }}</td>
                  <td class="py-2.5 px-3 font-medium text-gray-900 dark:text-white">{{ chat.name }}</td>
                  <td class="py-2.5 px-3 font-mono text-gray-500">{{ chat.chat_id || 'N/A' }}</td>
                  <td class="py-2.5 px-3 font-mono text-gray-500">{{ chat.thread_id || 'General' }}</td>
                  <td class="py-2.5 px-3 uppercase text-[11px]">{{ chat.type || 'group' }}</td>
                  <td class="py-2.5 px-3">
                    <AppBadge :variant="chat.status_code === 'active' ? 'success' : 'default'">
                      {{ chat.status_code || 'active' }}
                    </AppBadge>
                  </td>
                  <td class="py-2.5 px-3 text-right">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                        title="Edit Channel"
                        @click="openEditChatModal(chat)"
                      >
                        <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        title="Delete Channel"
                        @click="handleDeleteChat(chat.id)"
                      >
                        <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppCard>

      <!-- Test Telegram Dispatcher Card -->
      <AppCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-signal" class="w-5 h-5 text-gray-500" />
            <h3 class="font-semibold text-gray-900 dark:text-white text-sm">Send Operational Test Notification</h3>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSendTestTelegram">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Channel</label>
              <select
                v-model="testTelegramTarget"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                required
              >
                <option v-for="c in telegramChats" :key="c.id" :value="c.code">
                  {{ c.name }} ({{ c.code }})
                </option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Message Body (Markdown / HTML)</label>
              <input
                v-model="testTelegramMessage"
                type="text"
                placeholder="Operational status test: Systems online and verified."
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                required
              >
            </div>
          </div>
          <div class="flex justify-end">
            <AppButton
              type="submit"
              variant="secondary"
              label="Dispatch Test Message"
              icon="i-heroicons-paper-airplane"
              :loading="sendingTelegram"
            />
          </div>
        </form>
      </AppCard>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: EDIT TELEGRAM BOT TOKEN                                          -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppModal v-model="editBotModalOpen" title="Update Telegram Bot">
      <form class="space-y-4" @submit.prevent="handleSaveBot">
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bot Name</label>
          <input
            v-model="selectedBotForm.name"
            type="text"
            class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            required
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Public Bot Username (@username)</label>
          <input
            v-model="selectedBotForm.username"
            type="text"
            placeholder="clothing_store_kvm_bot"
            class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram Bot API Token</label>
          <input
            v-model="selectedBotForm.token"
            type="text"
            placeholder="8453886789:AAEYlrepnR..."
            class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            required
          >
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
          <select
            v-model="selectedBotForm.status_code"
            class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <AppButton type="button" variant="ghost" label="Cancel" @click="editBotModalOpen = false" />
          <AppButton type="submit" variant="primary" label="Save Bot" :loading="savingBot" />
        </div>
      </form>
    </AppModal>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- MODAL: ADD / EDIT ALERT CHANNEL                                         -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <AppModal v-model="chatModalOpen" :title="isEditingChat ? 'Edit Alert Channel' : 'Add Alert Channel'">
      <form class="space-y-4" @submit.prevent="handleSaveChat">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Channel Code</label>
            <input
              v-model="chatForm.code"
              type="text"
              placeholder="e.g. clothing_store_alerts"
              class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              :disabled="isEditingChat"
              required
            >
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Channel Name</label>
            <input
              v-model="chatForm.name"
              type="text"
              placeholder="Store Operational Alerts"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              required
            >
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chat ID (Group or Channel)</label>
            <input
              v-model="chatForm.chat_id"
              type="text"
              placeholder="-5195769348"
              class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              required
            >
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thread / Topic ID (Optional)</label>
            <input
              v-model="chatForm.thread_id"
              type="text"
              placeholder="e.g. 12"
              class="w-full font-mono rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bot Association</label>
            <select
              v-model="chatForm.telegram_bot_code"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
              required
            >
              <option v-for="b in telegramBots" :key="b.id" :value="b.code">
                {{ b.name }} ({{ b.code }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              v-model="chatForm.status_code"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <AppButton type="button" variant="ghost" label="Cancel" @click="chatModalOpen = false" />
          <AppButton type="submit" variant="primary" :label="isEditingChat ? 'Save Channel' : 'Create Channel'" :loading="savingChat" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

const toast = useToast()
const gatewayApi = usePaymentGatewayApi()
const tgApi = useTelegramSystemApi()

const activeTab = ref<'payway' | 'telegram'>('payway')

// ── PayWay State ─────────────────────────────────────────────────────────────
const loadingPayway = ref(false)
const savingPayway = ref(false)
const testingPayway = ref(false)
const showPublicKey = ref(false)
const showRsaKeys = ref(false)
const testResult = ref<any>(null)

const paywayForm = reactive({
  system_code: 'payway',
  name: 'ABA PayWay',
  status_code: 'active',
  base_url: 'https://checkout-sandbox.payway.com.kh',
  merchant_id: '',
  public_key: '',
  rsa_public_key: '',
  rsa_private_key: '',
  callback_base_url: '',
  qr_lifetime_minutes: 10,
  checkout_script_url: 'https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2',
})

async function loadPaywayConfig() {
  loadingPayway.value = true
  try {
    const res = await gatewayApi.getConfig()
    const data = res?.data || res
    if (data) {
      Object.assign(paywayForm, data)
    }
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to load PayWay configuration', color: 'red' })
  } finally {
    loadingPayway.value = false
  }
}

async function savePaywayConfig() {
  savingPayway.value = true
  try {
    await gatewayApi.updateConfig(paywayForm)
    toast.add({ title: 'Success', description: 'PayWay configuration updated successfully', color: 'green' })
    await loadPaywayConfig()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to update PayWay configuration', color: 'red' })
  } finally {
    savingPayway.value = false
  }
}

async function handleTestPayway() {
  testingPayway.value = true
  testResult.value = null
  try {
    const res = await gatewayApi.testConnection()
    testResult.value = res?.data || res
    if (testResult.value?.is_valid) {
      toast.add({ title: 'Verified', description: 'PayWay gateway responds properly.', color: 'green' })
    } else {
      toast.add({ title: 'Validation Warning', description: testResult.value?.message || 'PayWay rejected request', color: 'yellow' })
    }
  } catch (err: any) {
    testResult.value = { is_valid: false, message: err.message || 'Connection failed' }
    toast.add({ title: 'Connection Error', description: err.message || 'Failed to test PayWay connection', color: 'red' })
  } finally {
    testingPayway.value = false
  }
}

// ── Telegram State ───────────────────────────────────────────────────────────
const loadingTelegram = ref(false)
const telegramBots = ref<any[]>([])
const telegramChats = ref<any[]>([])
const sendingTelegram = ref(false)
const testTelegramTarget = ref('clothing_store_alerts')
const testTelegramMessage = ref('Operational status test: Systems online and verified.')

// Bot Modal
const editBotModalOpen = ref(false)
const savingBot = ref(false)
const selectedBotId = ref('')
const selectedBotForm = reactive({
  name: '',
  username: '',
  token: '',
  status_code: 'active',
})

// Chat Modal
const chatModalOpen = ref(false)
const isEditingChat = ref(false)
const savingChat = ref(false)
const selectedChatId = ref('')
const chatForm = reactive({
  code: '',
  name: '',
  telegram_bot_code: 'clothing_store_bot',
  chat_id: '',
  thread_id: '',
  status_code: 'active',
})

async function loadTelegramData() {
  loadingTelegram.value = true
  try {
    const [botsRes, chatsRes] = await Promise.all([
      tgApi.listBots(),
      tgApi.listChats({ size: 100 }),
    ])
    telegramBots.value = botsRes?.data?.items || botsRes?.items || []
    telegramChats.value = chatsRes?.data?.items || chatsRes?.items || []
    if (telegramChats.value.length > 0 && !testTelegramTarget.value) {
      testTelegramTarget.value = telegramChats.value[0].code
    }
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to load Telegram settings', color: 'red' })
  } finally {
    loadingTelegram.value = false
  }
}

function openEditBotModal(bot: any) {
  selectedBotId.value = bot.id
  selectedBotForm.name = bot.name || ''
  selectedBotForm.username = bot.username || ''
  selectedBotForm.token = bot.token || ''
  selectedBotForm.status_code = bot.status_code || 'active'
  editBotModalOpen.value = true
}

async function handleSaveBot() {
  savingBot.value = true
  try {
    await tgApi.updateBot(selectedBotId.value, selectedBotForm)
    toast.add({ title: 'Success', description: 'Bot configuration updated', color: 'green' })
    editBotModalOpen.value = false
    await loadTelegramData()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to update bot', color: 'red' })
  } finally {
    savingBot.value = false
  }
}

function openCreateChatModal() {
  isEditingChat.value = false
  selectedChatId.value = ''
  chatForm.code = ''
  chatForm.name = ''
  chatForm.telegram_bot_code = telegramBots.value[0]?.code || 'clothing_store_bot'
  chatForm.chat_id = ''
  chatForm.thread_id = ''
  chatForm.status_code = 'active'
  chatModalOpen.value = true
}

function openEditChatModal(chat: any) {
  isEditingChat.value = true
  selectedChatId.value = chat.id
  chatForm.code = chat.code
  chatForm.name = chat.name
  chatForm.telegram_bot_code = chat.telegram_bot_code
  chatForm.chat_id = chat.chat_id
  chatForm.thread_id = chat.thread_id || ''
  chatForm.status_code = chat.status_code || 'active'
  chatModalOpen.value = true
}

async function handleSaveChat() {
  savingChat.value = true
  try {
    if (isEditingChat.value) {
      await tgApi.updateChat(selectedChatId.value, chatForm)
      toast.add({ title: 'Success', description: 'Alert channel updated', color: 'green' })
    } else {
      await tgApi.createChat(chatForm)
      toast.add({ title: 'Success', description: 'Alert channel created', color: 'green' })
    }
    chatModalOpen.value = false
    await loadTelegramData()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to save alert channel', color: 'red' })
  } finally {
    savingChat.value = false
  }
}

async function handleDeleteChat(id: string) {
  if (!confirm('Are you sure you want to remove this alert channel?')) return
  try {
    await tgApi.deleteChat(id)
    toast.add({ title: 'Deleted', description: 'Alert channel removed', color: 'green' })
    await loadTelegramData()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to delete alert channel', color: 'red' })
  }
}

async function handleSendTestTelegram() {
  if (!testTelegramTarget.value || !testTelegramMessage.value.trim()) return
  sendingTelegram.value = true
  try {
    const res = await tgApi.sendTestMessage({
      chat_code: testTelegramTarget.value,
      text: testTelegramMessage.value.trim(),
    })
    const isOk = res?.data?.ok ?? res?.ok
    if (isOk) {
      toast.add({ title: 'Dispatched', description: 'Telegram notification delivered successfully.', color: 'green' })
    } else {
      toast.add({ title: 'Delivery Issue', description: res?.data?.description || 'Telegram reported delivery problem', color: 'yellow' })
    }
  } catch (err: any) {
    toast.add({ title: 'Failed', description: err.message || 'Could not dispatch message', color: 'red' })
  } finally {
    sendingTelegram.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    loadPaywayConfig(),
    loadTelegramData(),
  ])
})
</script>

