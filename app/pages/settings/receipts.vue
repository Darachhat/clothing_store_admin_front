<template>
  <div class="page-root">
    <!-- Header -->
    <AppPageHeader
      title="Thermal Receipt Customizer"
      description="Design 80mm and 58mm thermal receipt layouts, header info, tax breakdowns, and footer return policies."
      :breadcrumbs="[{ label: 'Store' }, { label: 'Receipt Templates' }]"
    >
      <template #actions>
        <AppButton
          variant="ghost"
          size="sm"
          icon="i-heroicons-arrow-path"
          label="Reset Defaults"
          @click="showResetConfirm = true"
        />
        <AppButton
          variant="default"
          size="sm"
          icon="i-heroicons-printer"
          label="Test Print"
          @click="handleTestPrint"
        />
        <AppButton
          variant="primary"
          size="sm"
          icon="i-heroicons-check"
          label="Save Template"
          :loading="saving"
          @click="saveTemplate"
        />
      </template>
    </AppPageHeader>

    <!-- Main 2-Column Layout: Controls (Left) + Live Thermal Preview (Right) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- ─── Left: Editor Controls (7 cols) ────────────────────────── -->
      <div class="lg:col-span-7 space-y-5">
        <!-- Paper Format & Dimensions -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-document" class="w-4 h-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Printer Format</h3>
            </div>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <button
                type="button"
                class="flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors"
                :class="form.paper_width === '80mm'
                  ? 'border-gray-900 dark:border-white bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                @click="form.paper_width = '80mm'"
              >
                <UIcon name="i-heroicons-printer" class="w-4 h-4" />
                <span>Standard 80mm (Wide)</span>
              </button>
              <button
                type="button"
                class="flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors"
                :class="form.paper_width === '58mm'
                  ? 'border-gray-900 dark:border-white bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                @click="form.paper_width = '58mm'"
              >
                <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
                <span>Compact 58mm (Narrow)</span>
              </button>
            </div>
          </div>
        </AppCard>

        <!-- Store Header Settings -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Store Header</h3>
            </div>
          </template>
          <div class="space-y-3.5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name (Khmer) *</label>
                <input
                  v-model="form.store_name_kh"
                  type="text"
                  placeholder="e.g. គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name (English) *</label>
                <input
                  v-model="form.store_name"
                  type="text"
                  required
                  placeholder="e.g. KIM VANNAK CLOTHING"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline / Slogan</label>
                <input
                  v-model="form.tagline"
                  type="text"
                  placeholder="e.g. Premium Streetwear & Modern Fashion"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="e.g. +855 23 888 999"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tax / VAT ID</label>
                <input
                  v-model="form.tax_id"
                  type="text"
                  placeholder="e.g. K001-902348572"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Address</label>
              <input
                v-model="form.address"
                type="text"
                placeholder="e.g. #123 Preah Norodom Blvd, Daun Penh, Phnom Penh"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </AppCard>

        <!-- Body & Line Items Customization -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-list-bullet" class="w-4 h-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Line Items &amp; Calculations</h3>
            </div>
          </template>
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_item_sku" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Print Item SKU / Barcode</span>
              </label>

              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_variant_attrs" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Print Size &amp; Color details</span>
              </label>

              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_khr_conversion" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Include KHR Riel conversion (4,100 KHR)</span>
              </label>

              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_tax_breakdown" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Show VAT / Tax Breakdown</span>
              </label>

              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_cashier_name" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Show Cashier Name &amp; Terminal</span>
              </label>

              <label class="flex items-center gap-2.5 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer">
                <input v-model="form.show_customer_info" type="checkbox" class="rounded border-gray-300 text-gray-900 focus:ring-0" />
                <span class="text-xs text-gray-800 dark:text-gray-200">Show Customer Name &amp; Loyalty Pts</span>
              </label>
            </div>
          </div>
        </AppCard>

        <!-- Footer & Return Policy -->
        <AppCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-4 h-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Footer &amp; Policies</h3>
            </div>
          </template>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thank You Message</label>
              <input
                v-model="form.footer_message"
                type="text"
                placeholder="e.g. Thank you for shopping with us! Please come again."
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Return &amp; Exchange Policy</label>
              <textarea
                v-model="form.return_policy"
                rows="2"
                placeholder="e.g. Items can be exchanged within 7 days with original tags and receipt. No cash refunds."
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Wi-Fi Info</label>
                <input
                  v-model="form.wifi_info"
                  type="text"
                  placeholder="e.g. Wi-Fi: Vannak_Guest | Pass: fashion2026"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback / Social URL</label>
                <input
                  v-model="form.qr_content"
                  type="text"
                  placeholder="e.g. https://t.me/vannakstore"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- ─── Right: Live Thermal Receipt Preview (5 cols) ─────────── -->
      <div class="lg:col-span-5 flex flex-col items-center">
        <div class="sticky top-6 w-full flex flex-col items-center">
          <div class="flex items-center justify-between w-full max-w-[340px] mb-2 px-1 text-xs text-gray-500">
            <span class="font-medium uppercase tracking-wider">Live Slip Preview</span>
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
              {{ form.paper_width }}
            </span>
          </div>

          <!-- Physical Thermal Paper Simulation -->
          <div
            id="thermal-receipt-preview"
            class="khmer-print-surface bg-white text-gray-900 shadow-xl border border-gray-200 p-4 transition-all duration-300 rounded-lg select-none"
            :class="form.paper_width === '58mm' ? 'w-[248px] text-[10px]' : 'w-[336px] text-[11px]'"
          >
            <!-- Double Rule Top Header -->
            <div class="kh-receipt-double-rule py-2 text-center flex flex-col items-center gap-0.5">
              <div class="kh-receipt-store-kh">{{ form.store_name_kh || form.store_name || 'គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់' }}</div>
              <div v-if="form.store_name && form.store_name_kh" class="text-[11px] font-bold tracking-wider text-gray-800 uppercase">{{ form.store_name }}</div>
              <div v-if="form.tagline" class="text-[10px] text-gray-600 font-normal leading-tight">{{ form.tagline }}</div>
              <div class="kh-receipt-branch">សាខា មេមត់</div>
              <div v-if="form.address" class="text-[9.5px] text-gray-500 font-normal leading-tight mt-0.5">{{ form.address }}</div>
              <div v-if="form.phone" class="text-[9.5px] text-gray-500 font-mono">Tel: {{ form.phone }}</div>
              <div v-if="form.tax_id" class="text-[9px] text-gray-500 font-mono">VAT TIN: {{ form.tax_id }}</div>
            </div>

            <!-- Receipt Metadata -->
            <div class="py-2.5 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">វិក្កយបត្រ:</span>
                <strong class="font-mono font-bold text-gray-900">INV-2026-0089</strong>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">កាលបរិច្ឆេទ:</span>
                <span class="font-mono text-gray-900">{{ formatReceiptCompactDate(new Date()) }}</span>
              </div>
              <div v-if="form.show_cashier_name" class="flex justify-between gap-2">
                <span class="text-gray-600">អ្នកគិតលុយ:</span>
                <span class="text-gray-900 text-right">Sophea N. (POS-01)</span>
              </div>
              <div v-if="form.show_customer_info" class="flex justify-between gap-2">
                <span class="text-gray-600">អតិថិជន:</span>
                <span class="text-gray-900 text-right">គឹម វណ្ណាក់ (Gold Tier)</span>
              </div>
            </div>

            <!-- Line Items (Dashed Rule) -->
            <div class="kh-receipt-dashed-rule py-2.5 flex flex-col gap-2.5">
              <!-- Item 1 -->
              <div class="flex flex-col gap-0.5">
                <div class="kh-receipt-item-title">
                  <span>អាវសាច់ក្រណាត់កប្បាស Classic Linen Shirt</span>
                  <span v-if="form.show_variant_attrs" class="text-gray-700 font-normal">
                    (White / L)
                  </span>
                </div>
                <div class="flex items-baseline justify-between pl-3 text-[11px] font-mono">
                  <span class="text-gray-600">1 x $28.00</span>
                  <strong class="font-bold text-gray-900">$28.00</strong>
                </div>
                <div v-if="form.show_item_sku" class="pl-3 text-[9.5px] text-gray-500 font-mono">
                  SKU: CLS-WHT-L
                </div>
              </div>

              <!-- Item 2 -->
              <div class="flex flex-col gap-0.5">
                <div class="kh-receipt-item-title">
                  <span>ខោស្លីមជីនូ Slim Chino Trouser</span>
                  <span v-if="form.show_variant_attrs" class="text-gray-700 font-normal">
                    (Navy / 32)
                  </span>
                </div>
                <div class="flex items-baseline justify-between pl-3 text-[11px] font-mono">
                  <span class="text-gray-600">1 x $38.00</span>
                  <strong class="font-bold text-gray-900">$38.00</strong>
                </div>
                <div v-if="form.show_item_sku" class="pl-3 text-[9.5px] text-gray-500 font-mono">
                  SKU: SCP-NVY-32
                </div>
              </div>
            </div>

            <!-- Financial Breakdown -->
            <div class="py-2 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between">
                <span class="text-gray-700">សរុបរង:</span>
                <span class="font-mono font-semibold">$66.00</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-700">បញ្ចុះតម្លៃ:</span>
                <span class="font-mono font-semibold">-$0.00</span>
              </div>
              <div v-if="form.show_tax_breakdown" class="flex justify-between">
                <span class="text-gray-700">ពន្ធ (10%):</span>
                <span class="font-mono font-semibold">$6.60</span>
              </div>
            </div>

            <!-- Grand Total inside Double Rule -->
            <div class="kh-receipt-double-rule py-2 flex flex-col gap-1">
              <div class="flex justify-between items-baseline">
                <span class="text-xs font-bold text-gray-900">សរុបត្រូវបង់:</span>
                <span class="text-base font-extrabold font-mono text-gray-900">$72.60</span>
              </div>
              <div v-if="form.show_khr_conversion" class="flex justify-between items-baseline text-[10.5px] text-gray-600">
                <span>សរុបជាប្រាក់រៀល (KHR):</span>
                <span class="font-mono font-semibold text-gray-800">297,660 ៛</span>
              </div>
            </div>

            <!-- Payment Method & Status -->
            <div class="py-2.5 flex flex-col gap-1 text-[11px]">
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">វិធីទូទាត់:</span>
                <span class="font-semibold text-gray-900 text-right">ABA KHQR</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">ស្ថានភាព:</span>
                <strong class="font-bold text-gray-900">បានទូទាត់រួច</strong>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">ប្រាក់បានបង់:</span>
                <span class="font-mono">$72.60</span>
              </div>
              <div class="flex justify-between gap-2">
                <span class="text-gray-600">ប្រាក់អាប់:</span>
                <span class="font-mono">$0.00</span>
              </div>
              <div v-if="form.show_customer_info" class="flex justify-between text-gray-700 pt-1 border-t border-gray-200">
                <span>ពិន្ទុសន្សំ:</span>
                <span>+72 / 450 pts</span>
              </div>
            </div>

            <!-- Footer Message & Policies -->
            <div class="pt-2 border-t border-dashed border-gray-300 text-center flex flex-col items-center gap-1">
              <p class="text-xs font-bold text-gray-900">សូមអរគុណ!</p>
              <p class="text-[11px] font-medium text-gray-700 leading-tight">{{ form.footer_message || 'សូមអរគុណដែលបានគាំទ្រហាងរបស់យើង!' }}</p>
              <p v-if="form.return_policy" class="text-[9.5px] text-gray-500 mt-0.5 leading-snug">{{ form.return_policy }}</p>
              <p v-if="form.wifi_info" class="text-[9.5px] font-mono text-gray-600 mt-0.5">{{ form.wifi_info }}</p>

              <!-- Real Scannable Vector QR Code -->
              <div v-if="form.qr_content" class="flex flex-col items-center justify-center pt-2.5">
                <div class="w-[88px] h-[88px] p-1.5 bg-white border border-gray-300 rounded flex items-center justify-center shadow-2xs">
                  <div
                    v-if="previewQrSvg"
                    class="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                    v-html="previewQrSvg"
                  />
                  <UIcon v-else name="i-heroicons-qr-code" class="w-12 h-12 text-gray-800" />
                </div>
                <span class="text-[9px] text-gray-600 mt-1 font-khmer">ស្កេនមើលវិក្កយបត្រ / Scan QR</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppConfirmDialog
      v-model="showResetConfirm"
      title="Reset Receipt Template"
      description="Are you sure you want to reset all receipt layout fields to the factory defaults?"
      consequence="Unsaved customizations in the editor will be replaced with the standard 80mm template."
      confirm-label="Reset Defaults"
      variant="warning"
      @confirm="resetToDefaults"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { renderSVG } from 'uqr'
import { formatReceiptCompactDate, printWithKhmerFonts } from '~/composables/useKhmerPrint'
import { DEFAULT_RECEIPT_TEMPLATE } from '~/composables/useReceiptTemplate'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Receipt Templates — Clothing Store' })

const settingsApi = useSystemSettingsApi()
const toast = useAppToast()

const saving = ref(false)
const showResetConfirm = ref(false)

const form = ref({ ...DEFAULT_RECEIPT_TEMPLATE })

const previewQrSvg = computed(() => {
  const content = form.value.qr_content?.trim() || 'https://kimvannak.store'
  try {
    return renderSVG(content, { ecc: 'M', border: 1 })
  } catch {
    return ''
  }
})


async function loadSettings() {
  try {
    const res = typeof settingsApi.getReceiptSettings === 'function'
      ? await settingsApi.getReceiptSettings()
      : await settingsApi.getCategorySettings('receipt')
    if (res && Object.keys(res).length > 0) {
      form.value = { ...DEFAULT_RECEIPT_TEMPLATE, ...res }
    } else {
      // Check local storage fallback
      const local = localStorage.getItem('pos_receipt_template')
      if (local) {
        form.value = { ...DEFAULT_RECEIPT_TEMPLATE, ...JSON.parse(local) }
      }
    }
  } catch {
    const local = localStorage.getItem('pos_receipt_template')
    if (local) {
      try {
        form.value = { ...DEFAULT_RECEIPT_TEMPLATE, ...JSON.parse(local) }
      } catch {}
    }
  }
}

async function saveTemplate() {
  saving.value = true
  try {
    if (typeof settingsApi.updateReceiptSettings === 'function') {
      await settingsApi.updateReceiptSettings(form.value)
    } else {
      await settingsApi.updateCategorySettings('receipt', form.value)
    }
    localStorage.setItem('pos_receipt_template', JSON.stringify(form.value))
    toast.success('Receipt Template Saved', 'Updated thermal slip template synchronized to all cashier stations.')
  } catch (err: any) {
    localStorage.setItem('pos_receipt_template', JSON.stringify(form.value))
    toast.add({
      title: 'Saved Locally',
      description: 'Receipt settings saved in browser cache (backend synchronization offline).',
      color: 'amber',
    })
  } finally {
    saving.value = false
  }
}

function resetToDefaults() {
  form.value = { ...DEFAULT_RECEIPT_TEMPLATE }
  showResetConfirm.value = false
  toast.add({
    title: 'Defaults Restored',
    description: 'Template reset to standard 80mm configuration.',
    color: 'default',
  })
}

async function handleTestPrint() {
  await nextTick()
  await printWithKhmerFonts()
}

onMounted(() => {
  loadSettings()
})
</script>

<style>
.khmer-ui,
.khmer-print-surface {
  font-family: var(--font-khmer, 'Kantumruy Pro', 'Battambang', 'Noto Sans Khmer', 'Battambang Local', 'Inter', sans-serif);
  line-height: 1.6;
  font-feature-settings: 'liga' 1, 'calt' 1, 'clig' 1, 'kern' 1;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.khmer-ui,
.khmer-print-surface,
.font-khmer,
.kh-receipt-store-kh,
.kh-receipt-branch,
.kh-receipt-item-title {
  letter-spacing: normal !important;
}

.kh-receipt-store-kh {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.65;
}

.kh-receipt-branch {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
}

.kh-receipt-double-rule {
  border-top: 3px double #111827;
  border-bottom: 3px double #111827;
}

.kh-receipt-dashed-rule {
  border-top: 1px dashed #9ca3af;
  border-bottom: 1px dashed #9ca3af;
}

.kh-receipt-item-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #111827;
  line-height: 1.65;
  word-break: break-word;
}

@media print {
  body * {
    visibility: hidden;
  }
  #thermal-receipt-preview,
  #thermal-receipt-preview * {
    visibility: visible;
  }
  #thermal-receipt-preview {
    position: absolute;
    left: 0;
    top: 0;
    width: 78mm !important;
    box-shadow: none !important;
    border: none !important;
  }
}
</style>

