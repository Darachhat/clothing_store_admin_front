<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Thermal Receipt Customizer</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Design 80mm and 58mm thermal receipt layouts, header info, tax breakdowns, and footer return policies
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          label="Reset Defaults"
          @click="resetToDefaults"
        />
        <AppButton
          variant="ghost"
          icon="i-heroicons-printer"
          label="Test Print"
          @click="handleTestPrint"
        />
        <AppButton
          variant="primary"
          icon="i-heroicons-check"
          label="Save Template"
          :loading="saving"
          @click="saveTemplate"
        />
      </div>
    </div>

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
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name *</label>
                <input
                  v-model="form.store_name"
                  type="text"
                  required
                  placeholder="e.g. VANNAK CLOTHING"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline / Slogan</label>
                <input
                  v-model="form.tagline"
                  type="text"
                  placeholder="e.g. Premium Streetwear & Modern Fashion"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            class="bg-white text-gray-900 shadow-xl border border-gray-200 p-4 transition-all duration-300 font-mono select-none"
            :class="form.paper_width === '80mm' ? 'w-[320px] text-[11px]' : 'w-[260px] text-[10px]'"
            style="font-family: 'Courier New', Courier, monospace;"
          >
            <!-- Receipt Header -->
            <div class="text-center space-y-1 pb-3 border-b border-dashed border-gray-400">
              <h1 class="text-sm font-black tracking-wider uppercase leading-tight">{{ form.store_name || 'STORE NAME' }}</h1>
              <p v-if="form.tagline" class="text-[10px] text-gray-600 leading-tight">{{ form.tagline }}</p>
              <p v-if="form.address" class="text-[10px] text-gray-600 leading-tight mt-1">{{ form.address }}</p>
              <p v-if="form.phone" class="text-[10px] text-gray-600">Tel: {{ form.phone }}</p>
              <p v-if="form.tax_id" class="text-[10px] text-gray-600">VAT TIN: {{ form.tax_id }}</p>
            </div>

            <!-- Invoice & Metadata Strip -->
            <div class="py-2.5 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
              <div class="flex justify-between">
                <span>INVOICE:</span>
                <span class="font-bold">INV-2026-0089</span>
              </div>
              <div class="flex justify-between">
                <span>DATE:</span>
                <span>{{ new Date().toLocaleDateString() }} {{ new Date().toLocaleTimeString() }}</span>
              </div>
              <div v-if="form.show_cashier_name" class="flex justify-between">
                <span>CASHIER:</span>
                <span>Sophea N. (POS-01)</span>
              </div>
              <div v-if="form.show_customer_info" class="flex justify-between text-gray-700">
                <span>CUSTOMER:</span>
                <span>Vannak K. (Gold Tier)</span>
              </div>
            </div>

            <!-- Line Items -->
            <div class="py-2.5 border-b border-dashed border-gray-400 space-y-2">
              <div class="flex justify-between font-bold border-b border-gray-300 pb-1">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>

              <!-- Item 1 -->
              <div>
                <div class="flex justify-between">
                  <span class="font-bold">Classic Linen Shirt</span>
                  <span>1 x $28.00</span>
                  <span class="font-bold">$28.00</span>
                </div>
                <div v-if="form.show_variant_attrs" class="text-[9px] text-gray-600">
                  Size: L | Color: White
                </div>
                <div v-if="form.show_item_sku" class="text-[9px] text-gray-500 font-mono">
                  SKU: CLS-WHT-L
                </div>
              </div>

              <!-- Item 2 -->
              <div>
                <div class="flex justify-between">
                  <span class="font-bold">Slim Chino Trouser</span>
                  <span>1 x $38.00</span>
                  <span class="font-bold">$38.00</span>
                </div>
                <div v-if="form.show_variant_attrs" class="text-[9px] text-gray-600">
                  Size: 32 | Color: Navy
                </div>
                <div v-if="form.show_item_sku" class="text-[9px] text-gray-500 font-mono">
                  SKU: SCP-NVY-32
                </div>
              </div>
            </div>

            <!-- Financial Breakdown -->
            <div class="py-2.5 border-b border-dashed border-gray-400 space-y-1">
              <div class="flex justify-between">
                <span>SUBTOTAL (2 items):</span>
                <span>$66.00</span>
              </div>
              <div v-if="form.show_tax_breakdown" class="flex justify-between text-gray-700">
                <span>VAT (10%):</span>
                <span>$6.60</span>
              </div>
              <div class="flex justify-between text-xs font-black pt-1 border-t border-gray-300">
                <span>TOTAL DUE:</span>
                <span>$72.60</span>
              </div>
              <div v-if="form.show_khr_conversion" class="flex justify-between text-[10px] text-gray-700">
                <span>TOTAL (KHR):</span>
                <span class="font-bold">297,660 Riel</span>
              </div>
            </div>

            <!-- Tender & Payment Method -->
            <div class="py-2.5 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
              <div class="flex justify-between">
                <span>PAYMENT METHOD:</span>
                <span class="font-bold">ABA KHQR</span>
              </div>
              <div class="flex justify-between">
                <span>PAID AMOUNT:</span>
                <span>$72.60</span>
              </div>
              <div class="flex justify-between">
                <span>CHANGE:</span>
                <span>$0.00</span>
              </div>
              <div v-if="form.show_customer_info" class="flex justify-between text-gray-700 pt-1 border-t border-gray-200">
                <span>POINTS EARNED / BAL:</span>
                <span>+72 / 450 pts</span>
              </div>
            </div>

            <!-- Footer Message & Policies -->
            <div class="pt-3 text-center space-y-1.5 text-[9px] leading-tight">
              <p class="font-bold uppercase text-[10px]">{{ form.footer_message || 'Thank you for shopping!' }}</p>
              <p v-if="form.return_policy" class="text-gray-600">{{ form.return_policy }}</p>
              <p v-if="form.wifi_info" class="font-bold text-gray-700 pt-1">{{ form.wifi_info }}</p>

              <!-- QR Code Mock for Feedback / Social -->
              <div v-if="form.qr_content" class="flex flex-col items-center justify-center pt-2">
                <div class="w-16 h-16 border border-gray-400 p-1 flex items-center justify-center bg-gray-50">
                  <UIcon name="i-heroicons-qr-code" class="w-12 h-12 text-gray-800" />
                </div>
                <span class="text-[8px] text-gray-500 mt-1">Scan for Digital Receipt / Offers</span>
              </div>

              <div class="pt-2 text-[8px] text-gray-400">
                *** END OF RECEIPT ***
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const settingsApi = useSystemSettingsApi()
const toast = useAppToast()

const saving = ref(false)

const defaultSettings = {
  paper_width: '80mm',
  store_name: 'VANNAK CLOTHING BOUTIQUE',
  tagline: 'Premium Streetwear & Contemporary Fashion',
  phone: '+855 23 888 999',
  address: '#123 Preah Norodom Blvd, Daun Penh, Phnom Penh',
  tax_id: 'K001-902348572',
  show_item_sku: true,
  show_variant_attrs: true,
  show_khr_conversion: true,
  show_tax_breakdown: true,
  show_cashier_name: true,
  show_customer_info: true,
  footer_message: 'THANK YOU FOR SHOPPING WITH US!',
  return_policy: 'Exchanges accepted within 7 days with original tag and receipt. Sale items are non-refundable.',
  wifi_info: 'Guest Wi-Fi: Vannak_Store | Pass: fashion2026',
  qr_content: 'https://kimvannak.store',
}

const form = ref({ ...defaultSettings })

async function loadSettings() {
  try {
    const res = await settingsApi.getCategorySettings('receipt')
    if (res && Object.keys(res).length > 0) {
      form.value = { ...defaultSettings, ...res }
    } else {
      // Check local storage fallback
      const local = localStorage.getItem('pos_receipt_template')
      if (local) {
        form.value = { ...defaultSettings, ...JSON.parse(local) }
      }
    }
  } catch {
    const local = localStorage.getItem('pos_receipt_template')
    if (local) {
      try {
        form.value = { ...defaultSettings, ...JSON.parse(local) }
      } catch {}
    }
  }
}

async function saveTemplate() {
  saving.value = true
  try {
    await settingsApi.updateCategorySettings('receipt', form.value)
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
  form.value = { ...defaultSettings }
  toast.add({
    title: 'Defaults Restored',
    description: 'Template reset to standard 80mm configuration.',
    color: 'default',
  })
}

function handleTestPrint() {
  window.print()
}

onMounted(() => {
  loadSettings()
})
</script>

<style>
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
    width: 80mm !important;
    box-shadow: none !important;
    border: none !important;
  }
}
</style>

