<template>
  <div class="page-root">
    <!-- Page Header -->
    <PageHeader
      title="Integrations &amp; Gateways"
      description="Manage database-stored ABA PayWay payment gateway credentials and Telegram notification bots."
      :breadcrumbs="[{ label: 'System Settings', to: '/settings' }, { label: 'Integrations &amp; Gateways' }]"
      back-to="/settings"
    >
      <template #actions>
        <BaseTabs v-model="activeTab" :tabs="integrationTabs" />
      </template>
    </PageHeader>

    <!-- TAB 1: ABA PAYWAY GATEWAY CONFIGURATION -->
    <div v-show="activeTab === 'payway'" class="space-y-6">
      <DataCard>
        <template #header>
          <div class="int-card-header">
            <div class="int-card-header__title">
              <UIcon name="i-heroicons-credit-card" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="int-card-header__h">ABA PayWay Payment Gateway</h3>
                <p class="int-card-header__sub">Configured in auth.system and auth.credential_api_key</p>
              </div>
            </div>
            <div class="int-card-header__actions">
              <StatusBadge
                :status="paywayForm.status_code === 'active' ? 'ACTIVE' : 'INACTIVE'"
                :label="paywayForm.status_code === 'active' ? 'Active' : 'Inactive'"
              />
              <IconButton icon="i-heroicons-arrow-path" label="Reload configuration" :loading="loadingPayway" @click="loadPaywayConfig" />
            </div>
          </div>
        </template>

        <form class="space-y-5" @submit.prevent="savePaywayConfig">
          <!-- Gateway Status & Mode -->
          <div class="int-panel">
            <FormSection :columns="2">
              <FormField label="Gateway Status">
                <BaseSelect v-model="paywayForm.status_code" :options="paywayStatusOptions" />
              </FormField>
              <FormField label="Gateway Environment">
                <BaseSelect v-model="paywayForm.base_url" :options="paywayEnvOptions" />
              </FormField>
            </FormSection>
          </div>

          <!-- Merchant & Secret Keys -->
          <FormSection title="Gateway API Credentials" :columns="2">
            <FormField label="PayWay Merchant ID" required>
              <BaseInput v-model="paywayForm.merchant_id" mono required placeholder="e.g. ec479700" />
            </FormField>

            <FormField label="Public HMAC Signing Key" required>
              <BaseInput
                v-model="paywayForm.public_key"
                mono
                required
                :type="showPublicKey ? 'text' : 'password'"
                placeholder="3F3C50388E2F0236777CC5E9BB90D47C35447D5B"
              >
                <template #trailing>
                  <button type="button" class="int-reveal" :aria-label="showPublicKey ? 'Hide key' : 'Reveal key'" @click="showPublicKey = !showPublicKey">
                    <UIcon :name="showPublicKey ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
                  </button>
                </template>
              </BaseInput>
            </FormField>
          </FormSection>

          <!-- RSA Keys Section (Collapsible) -->
          <div class="int-panel int-panel--plain">
            <button type="button" class="int-collapse" :aria-expanded="showRsaKeys" @click="showRsaKeys = !showRsaKeys">
              <span class="int-collapse__title">
                <UIcon name="i-heroicons-key" class="w-4 h-4 text-gray-500" />
                <span>PayWay RSA Cryptographic Keys (Optional for standard KHQR)</span>
              </span>
              <UIcon :name="showRsaKeys ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="w-4 h-4 text-gray-500" />
            </button>

            <div v-show="showRsaKeys" class="int-collapse__body">
              <FormField label="RSA Public Key">
                <BaseTextarea v-model="paywayForm.rsa_public_key" mono :rows="3" placeholder="MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ..." />
              </FormField>
              <FormField label="RSA Private Key">
                <BaseTextarea v-model="paywayForm.rsa_private_key" mono :rows="3" placeholder="MIICXAIBAAKBgQDCt4VrCyJJ9hYhA..." />
              </FormField>
            </div>
          </div>

          <!-- Webhook & Checkout Endpoints -->
          <FormSection title="Endpoints &amp; Timers">
            <div class="int-endpoints">
              <div class="int-endpoints__wide">
                <FormField
                  label="Pushback Webhook Domain (Callback Base URL)"
                  hint="ABA sends instant payment IPN callbacks to /api/payments/aba/pushback under this domain."
                >
                  <BaseInput v-model="paywayForm.callback_base_url" type="url" placeholder="https://api.kimvannak.store" />
                </FormField>
              </div>
              <FormField label="QR Expiration (Minutes)">
                <BaseInput v-model="paywayForm.qr_lifetime_minutes" type="number" :min="1" :max="120" />
              </FormField>
            </div>
            <FormField label="Checkout Script Plugin URL">
              <BaseInput
                v-model="paywayForm.checkout_script_url"
                mono
                placeholder="https://checkout.payway.com.kh/plugins/checkout2-0.js?hide-close=2"
              />
            </FormField>
          </FormSection>

          <!-- Test Results Display -->
          <InlineAlert
            v-if="testResult"
            :variant="testResult.is_valid ? 'success' : 'warning'"
            :title="testResult.message"
          >
            <pre v-if="testResult.details" class="int-pre">{{ JSON.stringify(testResult.details, null, 2) }}</pre>
          </InlineAlert>

          <!-- Action Buttons -->
          <FormActions>
            <BaseButton
              type="button"
              variant="secondary"
              label="Test Gateway Connectivity"
              icon="i-heroicons-signal"
              :loading="testingPayway"
              @click="handleTestPayway"
            />
            <BaseButton
              type="submit"
              variant="primary"
              label="Save Gateway Configuration"
              icon="i-heroicons-check"
              :loading="savingPayway"
            />
          </FormActions>
        </form>
      </DataCard>
    </div>

    <!-- TAB 2: TELEGRAM NOTIFICATIONS & BOT INTEGRATION -->
    <div v-show="activeTab === 'telegram'" class="space-y-6">
      <!-- Active Bots Card -->
      <DataCard>
        <template #header>
          <div class="int-card-header">
            <div class="int-card-header__title">
              <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="int-card-header__h">Configured Telegram Bots</h3>
                <p class="int-card-header__sub">Stored in auth.telegram_bot table</p>
              </div>
            </div>
            <IconButton icon="i-heroicons-arrow-path" label="Reload Telegram data" :loading="loadingTelegram" @click="loadTelegramData" />
          </div>
        </template>

        <div class="space-y-4">
          <EmptyState
            v-if="telegramBots.length === 0 && !loadingTelegram"
            icon="i-heroicons-paper-airplane"
            title="No Telegram bots configured."
          />

          <div v-for="bot in telegramBots" :key="bot.id" class="int-panel int-bot">
            <div class="int-bot__top">
              <div class="int-bot__name">
                <span class="int-bot__title">{{ bot.name }}</span>
                <span class="int-bot__code">({{ bot.code }})</span>
                <span v-if="bot.username" class="int-bot__user">@{{ bot.username }}</span>
              </div>
              <div class="int-card-header__actions">
                <StatusBadge :status="(bot.status_code || 'active').toUpperCase()" :label="bot.status_code || 'active'" />
                <BaseButton size="sm" variant="secondary" label="Edit Token" icon="i-heroicons-pencil-square" @click="openEditBotModal(bot)" />
              </div>
            </div>
            <div class="int-bot__meta">
              <span>Token: {{ bot.token ? bot.token.slice(0, 8) + '...' + bot.token.slice(-6) : 'Not configured' }}</span>
              <span>Updated: {{ bot.updated_datetime ? new Date(bot.updated_datetime).toLocaleDateString() : 'N/A' }}</span>
            </div>
          </div>
        </div>
      </DataCard>

      <!-- Alert Channels & Groups Card -->
      <DataCard no-pad>
        <template #header>
          <div class="int-card-header">
            <div class="int-card-header__title">
              <UIcon name="i-heroicons-chat-bubble-left-right" class="w-5 h-5 text-gray-500" />
              <div>
                <h3 class="int-card-header__h">Operational Alert Channels</h3>
                <p class="int-card-header__sub">Configured Telegram chat groups stored in auth.telegram_chat</p>
              </div>
            </div>
            <BaseButton size="sm" variant="primary" label="Add Channel" icon="i-heroicons-plus" @click="openCreateChatModal" />
          </div>
        </template>

        <DataTable
          :columns="chatColumns"
          :rows="telegramChats"
          row-key="id"
          :loading="loadingTelegram"
          empty-title="No alert channels found."
          empty-icon="i-heroicons-chat-bubble-left-right"
        >
          <template #cell-code="{ row }"><span class="int-mono-strong">{{ row.code }}</span></template>
          <template #cell-chat_id="{ row }"><span class="int-mono">{{ row.chat_id || 'N/A' }}</span></template>
          <template #cell-thread_id="{ row }"><span class="int-mono">{{ row.thread_id || 'General' }}</span></template>
          <template #cell-type="{ row }"><span class="int-upper">{{ row.type || 'group' }}</span></template>
          <template #cell-status_code="{ row }">
            <StatusBadge :status="(row.status_code || 'active').toUpperCase()" :label="row.status_code || 'active'" />
          </template>
          <template #cell-actions="{ row }">
            <div class="int-row-actions">
              <IconButton icon="i-heroicons-pencil-square" label="Edit Channel" @click="openEditChatModal(row)" />
              <IconButton icon="i-heroicons-trash" label="Delete Channel" variant="danger" @click="handleDeleteChat(row.id)" />
            </div>
          </template>
        </DataTable>
      </DataCard>

      <!-- Test Telegram Dispatcher Card -->
      <DataCard>
        <template #header>
          <div class="int-card-header__title">
            <UIcon name="i-heroicons-signal" class="w-5 h-5 text-gray-500" />
            <h3 class="int-card-header__h">Send Operational Test Notification</h3>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleSendTestTelegram">
          <div class="int-endpoints">
            <FormField label="Target Channel" required>
              <BaseSelect v-model="testTelegramTarget" :options="chatTargetOptions" required />
            </FormField>
            <div class="int-endpoints__wide">
              <FormField label="Message Body (Markdown / HTML)" required>
                <BaseInput v-model="testTelegramMessage" required placeholder="Operational status test: Systems online and verified." />
              </FormField>
            </div>
          </div>
          <FormActions>
            <BaseButton
              type="submit"
              variant="secondary"
              label="Dispatch Test Message"
              icon="i-heroicons-paper-airplane"
              :loading="sendingTelegram"
            />
          </FormActions>
        </form>
      </DataCard>
    </div>

    <!-- MODAL: EDIT TELEGRAM BOT TOKEN -->
    <BaseModal v-model="editBotModalOpen" title="Update Telegram Bot">
      <form class="space-y-4" @submit.prevent="handleSaveBot">
        <FormField label="Bot Name" required>
          <BaseInput v-model="selectedBotForm.name" required />
        </FormField>
        <FormField label="Public Bot Username (@username)">
          <BaseInput v-model="selectedBotForm.username" mono placeholder="clothing_store_kvm_bot" />
        </FormField>
        <FormField label="Telegram Bot API Token" required>
          <BaseInput v-model="selectedBotForm.token" mono required placeholder="8453886789:AAEYlrepnR..." />
        </FormField>
        <FormField label="Status">
          <BaseSelect v-model="selectedBotForm.status_code" :options="activeInactiveOptions" />
        </FormField>
        <FormActions>
          <BaseButton type="button" variant="ghost" label="Cancel" @click="editBotModalOpen = false" />
          <BaseButton type="submit" variant="primary" label="Save Bot" :loading="savingBot" />
        </FormActions>
      </form>
    </BaseModal>

    <!-- MODAL: ADD / EDIT ALERT CHANNEL -->
    <BaseModal v-model="chatModalOpen" :title="isEditingChat ? 'Edit Alert Channel' : 'Add Alert Channel'">
      <form class="space-y-4" @submit.prevent="handleSaveChat">
        <FormSection :columns="2">
          <FormField label="Channel Code" required>
            <BaseInput v-model="chatForm.code" mono required :disabled="isEditingChat" placeholder="e.g. clothing_store_alerts" />
          </FormField>
          <FormField label="Channel Name" required>
            <BaseInput v-model="chatForm.name" required placeholder="Store Operational Alerts" />
          </FormField>
          <FormField label="Chat ID (Group or Channel)" required>
            <BaseInput v-model="chatForm.chat_id" mono required placeholder="-5195769348" />
          </FormField>
          <FormField label="Thread / Topic ID (Optional)">
            <BaseInput v-model="chatForm.thread_id" mono placeholder="e.g. 12" />
          </FormField>
          <FormField label="Bot Association" required>
            <BaseSelect v-model="chatForm.telegram_bot_code" :options="botOptions" required />
          </FormField>
          <FormField label="Status">
            <BaseSelect v-model="chatForm.status_code" :options="activeInactiveOptions" />
          </FormField>
        </FormSection>

        <FormActions>
          <BaseButton type="button" variant="ghost" label="Cancel" @click="chatModalOpen = false" />
          <BaseButton type="submit" variant="primary" :label="isEditingChat ? 'Save Channel' : 'Create Channel'" :loading="savingChat" />
        </FormActions>
      </form>
    </BaseModal>

    <ConfirmDialog
      v-model="showDeleteChatConfirm"
      title="Remove Alert Channel"
      description="Are you sure you want to remove this Telegram alert channel?"
      consequence="Outbound store notifications routed to this channel code will no longer be delivered."
      confirm-label="Remove Channel"
      variant="danger"
      :loading="deletingChat"
      @confirm="confirmDeleteChat"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Integrations & Gateways — Clothing Store' })

const toast = useAppToast()
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

const paywayForm = ref({
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
      Object.assign(paywayForm.value, data)
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
    await gatewayApi.updateConfig(paywayForm.value)
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
const selectedBotForm = ref({
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
const chatForm = ref({
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
  selectedBotForm.value.name = bot.name || ''
  selectedBotForm.value.username = bot.username || ''
  selectedBotForm.value.token = bot.token || ''
  selectedBotForm.value.status_code = bot.status_code || 'active'
  editBotModalOpen.value = true
}

async function handleSaveBot() {
  savingBot.value = true
  try {
    await tgApi.updateBot(selectedBotId.value, selectedBotForm.value)
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
  chatForm.value.code = ''
  chatForm.value.name = ''
  chatForm.value.telegram_bot_code = telegramBots.value[0]?.code || 'clothing_store_bot'
  chatForm.value.chat_id = ''
  chatForm.value.thread_id = ''
  chatForm.value.status_code = 'active'
  chatModalOpen.value = true
}

function openEditChatModal(chat: any) {
  isEditingChat.value = true
  selectedChatId.value = chat.id
  chatForm.value.code = chat.code
  chatForm.value.name = chat.name
  chatForm.value.telegram_bot_code = chat.telegram_bot_code
  chatForm.value.chat_id = chat.chat_id
  chatForm.value.thread_id = chat.thread_id || ''
  chatForm.value.status_code = chat.status_code || 'active'
  chatModalOpen.value = true
}

async function handleSaveChat() {
  savingChat.value = true
  try {
    if (isEditingChat.value) {
      await tgApi.updateChat(selectedChatId.value, chatForm.value)
      toast.add({ title: 'Success', description: 'Alert channel updated', color: 'green' })
    } else {
      await tgApi.createChat(chatForm.value)
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

const showDeleteChatConfirm = ref(false)
const chatIdToDelete = ref('')
const deletingChat = ref(false)

function handleDeleteChat(id: string) {
  chatIdToDelete.value = id
  showDeleteChatConfirm.value = true
}

async function confirmDeleteChat() {
  if (!chatIdToDelete.value) return
  deletingChat.value = true
  try {
    await tgApi.deleteChat(chatIdToDelete.value)
    toast.add({ title: 'Deleted', description: 'Alert channel removed', color: 'green' })
    showDeleteChatConfirm.value = false
    chatIdToDelete.value = ''
    await loadTelegramData()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to delete alert channel', color: 'red' })
  } finally {
    deletingChat.value = false
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

const integrationTabs = [
  { key: 'payway', label: 'ABA PayWay Gateway', icon: 'i-heroicons-credit-card' },
  { key: 'telegram', label: 'Telegram Notifications', icon: 'i-heroicons-paper-airplane' },
]

const paywayStatusOptions = [
  { value: 'active', label: 'Active (Processing Transactions)' },
  { value: 'inactive', label: 'Inactive (Disabled)' },
]
const paywayEnvOptions = [
  { value: 'https://checkout-sandbox.payway.com.kh', label: 'Sandbox (https://checkout-sandbox.payway.com.kh)' },
  { value: 'https://checkout.payway.com.kh', label: 'Production / Live (https://checkout.payway.com.kh)' },
]
const activeInactiveOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const chatColumns = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Channel Name' },
  { key: 'chat_id', label: 'Chat ID' },
  { key: 'thread_id', label: 'Thread / Topic' },
  { key: 'type', label: 'Type' },
  { key: 'status_code', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const botOptions = computed(() => telegramBots.value.map((b: any) => ({ value: b.code, label: `${b.name} (${b.code})` })))
const chatTargetOptions = computed(() => telegramChats.value.map((c: any) => ({ value: c.code, label: `${c.name} (${c.code})` })))
</script>

<style scoped>
.int-card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; width: 100%; }
.int-card-header__title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.int-card-header__h { margin: 0; font-size: 13.5px; font-weight: 600; color: var(--text-primary, #0f172a); }
.int-card-header__sub { margin: 0; font-size: 12px; color: var(--text-tertiary, #64748b); }
.int-card-header__actions { display: flex; align-items: center; gap: 8px; }
.int-panel { padding: 14px; border-radius: var(--radius-lg, 8px); border: 1px solid var(--border-subtle, #e5e7eb); background: var(--surface-inset, #f8fafc); }
.int-panel--plain { background: var(--surface-card, #ffffff); }
.int-collapse { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; background: none; border: none; padding: 0; cursor: pointer; text-align: left; }
.int-collapse__title { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: var(--text-primary, #0f172a); }
.int-collapse__body { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle, #e5e7eb); }
.int-reveal { background: none; border: none; cursor: pointer; color: var(--text-tertiary, #64748b); display: inline-flex; padding: 2px; }
.int-endpoints { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.int-endpoints__wide { grid-column: span 2; }
.int-pre { margin: 8px 0 0; padding: 8px; font-family: var(--font-mono); font-size: 11px; overflow-x: auto; background: var(--surface-card, #ffffff); border: 1px solid var(--border-subtle, #e5e7eb); border-radius: var(--radius-md, 6px); color: var(--text-secondary, #475569); }
.int-bot { display: flex; flex-direction: column; gap: 10px; }
.int-bot__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.int-bot__title { font-size: 13px; font-weight: 600; color: var(--text-primary, #0f172a); }
.int-bot__code, .int-bot__user { margin-left: 8px; font-family: var(--font-mono); font-size: 12px; color: var(--text-tertiary, #64748b); }
.int-bot__meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid var(--border-subtle, #e5e7eb); font-family: var(--font-mono); font-size: 12px; color: var(--text-tertiary, #64748b); }
.int-mono { font-family: var(--font-mono); color: var(--text-tertiary, #64748b); }
.int-mono-strong { font-family: var(--font-mono); font-weight: 600; }
.int-upper { text-transform: uppercase; font-size: 11px; }
.int-row-actions { display: flex; justify-content: flex-end; gap: 4px; }

@media (max-width: 767px) {
  .int-endpoints { grid-template-columns: 1fr; }
  .int-endpoints__wide { grid-column: auto; }
}
</style>