<template>
  <div class="page-root space-y-5">
    <PageHeader
      class="no-print"
      title="Sticker & Label Template Studio"
      description="Configure your store-wide default garment sticker layout, thermal roll size, 1D/2D scan code format, and visible fields."
      :breadcrumbs="[{ label: 'Catalog' }, { label: 'Sticker & Label Templates' }]"
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <BaseButton
            variant="secondary"
            size="sm"
            icon="i-heroicons-arrow-path"
            label="Reset Defaults"
            @click="resetDefaults"
          />
          <BaseButton
            variant="secondary"
            size="sm"
            icon="i-heroicons-printer"
            label="Test Print Sample"
            @click="handleTestPrint"
          />
          <BaseButton
            variant="secondary"
            size="sm"
            icon="i-heroicons-queue-list"
            label="Batch Print Stickers"
            to="/labels/generate"
          />
          <BaseButton
            variant="primary"
            size="sm"
            icon="i-heroicons-check"
            label="Save Template"
            :loading="saving"
            @click="handleSaveTemplate"
          />
        </div>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start no-print">
      <!-- Left Column: Template Configuration Controls -->
      <div class="lg:col-span-7 space-y-4">
        <!-- 1. Sticker Size & Thermal Roll Preset -->
        <DataCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  1. Sticker Size &amp; Paper Preset
                </h3>
              </div>
              <span class="text-xs font-mono text-gray-500">
                {{ form.label_width_mm }} × {{ form.label_height_mm }} mm ({{ form.columns }} col)
              </span>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                v-for="preset in stickerPresets"
                :key="preset.id"
                type="button"
                class="flex items-start justify-between p-3 rounded-lg border text-left transition-all"
                :class="
                  form.paper_size === preset.id
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60'
                "
                @click="applyPreset(preset)"
              >
                <div class="min-w-0 pr-2">
                  <div class="text-xs font-semibold truncate">{{ preset.label }}</div>
                  <div
                    class="text-[11px] mt-0.5 leading-snug"
                    :class="form.paper_size === preset.id ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'"
                  >
                    {{ preset.sub }}
                  </div>
                </div>
                <UIcon
                  :name="form.paper_size === preset.id ? 'i-heroicons-check-circle' : 'i-heroicons-tag'"
                  class="w-4 h-4 shrink-0 mt-0.5"
                />
              </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
              <FormField label="Width (mm)">
                <BaseInput v-model="form.label_width_mm" type="number" :min="25" :max="120" />
              </FormField>
              <FormField label="Height (mm)">
                <BaseInput v-model="form.label_height_mm" type="number" :min="18" :max="120" />
              </FormField>
              <FormField label="Columns">
                <BaseInput v-model="form.columns" type="number" :min="1" :max="6" />
              </FormField>
              <FormField label="Default Copies">
                <BaseInput v-model="form.default_copies" type="number" :min="1" :max="500" />
              </FormField>
            </div>
          </div>
        </DataCard>

        <!-- 2. Scan Code Format (1D Barcode vs 2D QR) -->
        <DataCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-qr-code" class="w-4 h-4 text-gray-500" />
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                2. Default Scan Code Symbology
              </h3>
            </div>
          </template>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              class="flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
              :class="
                form.code_type === 'BARCODE'
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              "
              @click="form.code_type = 'BARCODE'"
            >
              <UIcon name="i-heroicons-bars-3-bottom-left" class="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div class="text-xs font-semibold">1D Barcode (Code 128)</div>
                <p
                  class="text-[11px] mt-0.5 leading-snug"
                  :class="form.code_type === 'BARCODE' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'"
                >
                  Compatible with all 1D laser scanners, 2D USB guns, and camera scanners. Uses compact numeric barcode.
                </p>
              </div>
            </button>

            <button
              type="button"
              class="flex items-start gap-3 p-3 rounded-lg border text-left transition-all"
              :class="
                form.code_type === 'QR'
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900 dark:border-white'
                  : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              "
              @click="form.code_type = 'QR'"
            >
              <UIcon name="i-heroicons-qr-code" class="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div class="text-xs font-semibold">2D QR Code</div>
                <p
                  class="text-[11px] mt-0.5 leading-snug"
                  :class="form.code_type === 'QR' ? 'text-gray-300 dark:text-gray-600' : 'text-gray-500'"
                >
                  Ideal for small square tags, camera scanners, and 2D optical imagers. Encodes variant QR reference.
                </p>
              </div>
            </button>
          </div>
        </DataCard>

        <!-- 3. Visible Sticker Fields & Typography -->
        <DataCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-adjustments-horizontal" class="w-4 h-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  3. Sticker Content &amp; Field Visibility
                </h3>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                @click="syncFromBrand"
              >
                <UIcon name="i-heroicons-sparkles" class="w-3.5 h-3.5" />
                <span>Sync Store Name from Brand</span>
              </button>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Store Header Title (Khmer / English)">
                <BaseInput
                  v-model="form.store_header"
                  placeholder="គឹម វណ្ណាក់ ហាងលក់សម្លៀកបំពាក់"
                />
              </FormField>
              <FormField label="KHR Exchange Rate (1 USD = ៛)">
                <BaseInput
                  v-model="form.khr_exchange_rate"
                  type="number"
                  :min="100"
                  :max="50000"
                  placeholder="4100"
                />
              </FormField>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_store_header" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show Store Header</div>
                  <div class="text-[11px] text-gray-500">Top brand title with divider line</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_product_name" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show Product Name</div>
                  <div class="text-[11px] text-gray-500">Khmer or English garment name</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_price_usd" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show USD Price ($0.00)</div>
                  <div class="text-[11px] text-gray-500">Bold primary selling price</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_khr" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show KHR Price (៛)</div>
                  <div class="text-[11px] text-gray-500">Auto-converted Riel price</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_sku" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show Variant SKU Line</div>
                  <div class="text-[11px] text-gray-500">Prints SKU: ... below product name</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <input v-model="form.show_variant_attrs" type="checkbox" class="rounded border-gray-300" />
                <div>
                  <div class="text-xs font-semibold text-gray-900 dark:text-white">Show Color &amp; Size (ពណ៌ / ទំហំ)</div>
                  <div class="text-[11px] text-gray-500">Displays garment color and size</div>
                </div>
              </label>
            </div>
          </div>
        </DataCard>
      </div>

      <!-- Right Column: Live Interactive Sticker Preview -->
      <div class="lg:col-span-5 lg:sticky lg:top-4 space-y-4">
        <DataCard>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-eye" class="w-4 h-4 text-gray-500" />
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
                  Live Thermal Sticker Preview
                </h3>
              </div>
              <span class="text-[11px] font-mono px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                {{ form.label_width_mm }} × {{ form.label_height_mm }} mm
              </span>
            </div>
          </template>

          <div class="space-y-4">
            <!-- Preview Stage -->
            <div class="flex flex-col items-center justify-center p-6 rounded-xl bg-gray-100 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700">
              <div
                class="kh-product-sticker bg-white text-gray-900 rounded-md shadow-xs border border-gray-300 flex flex-col justify-between overflow-hidden"
                :style="{
                  width: `${form.label_width_mm}mm`,
                  height: `${form.label_height_mm}mm`,
                  transform: 'scale(1.35)',
                  transformOrigin: 'center center',
                  margin: '18px 0',
                  padding: isCompactSize ? '1.5mm 1.8mm' : '1.8mm 2.2mm',
                }"
              >
                <div>
                  <div
                    v-if="form.show_store_header"
                    class="font-khmer font-bold text-gray-900 truncate pb-0.5 mb-0.5 border-b border-gray-200"
                    :style="{ fontSize: isCompactSize ? '5pt' : '5.5pt' }"
                  >
                    {{ form.store_header || displayNameKh || displayName }}
                  </div>

                  <div class="flex items-baseline justify-between gap-1">
                    <div
                      v-if="form.show_product_name"
                      class="font-khmer font-bold text-gray-900 truncate"
                      :style="{ fontSize: isCompactSize ? '6.5pt' : '7.2pt' }"
                    >
                      {{ sampleItem.productName }}
                    </div>
                    <div v-else class="flex-1" />
                    <div
                      v-if="form.show_price_usd"
                      class="font-extrabold text-gray-900 shrink-0"
                      :style="{ fontSize: isCompactSize ? '8.5pt' : '9.5pt' }"
                    >
                      ${{ Number(sampleItem.priceUsd || 0).toFixed(2) }}
                    </div>
                  </div>

                  <div
                    v-if="form.show_sku || form.show_khr"
                    class="flex items-center justify-between gap-1 text-gray-700"
                    :style="{ fontSize: isCompactSize ? '4.8pt' : '5.3pt' }"
                  >
                    <span v-if="form.show_sku" class="font-mono truncate">SKU: {{ sampleItem.sku }}</span>
                    <span v-else />
                    <span v-if="form.show_khr" class="font-khmer font-semibold shrink-0">
                      {{ samplePriceKhr }} ៛
                    </span>
                  </div>

                  <div
                    v-if="form.show_variant_attrs"
                    class="font-khmer text-gray-900 truncate"
                    :style="{ fontSize: isCompactSize ? '4.8pt' : '5.3pt' }"
                  >
                    ពណ៌: <strong>{{ sampleItem.color }}</strong> &nbsp; ទំហំ: <strong>{{ sampleItem.size }}</strong>
                  </div>
                </div>

                <!-- Barcode / QR Zone -->
                <div class="flex flex-col items-center justify-end pt-0.5">
                  <template v-if="previewVariantId">
                    <img
                      v-if="form.code_type === 'QR'"
                      :src="getQrUrl(previewVariantId, 'svg')"
                      alt="Sample QR"
                      style="width: 9.5mm; height: 9.5mm; object-fit: contain;"
                    />
                    <img
                      v-else
                      :src="getBarcodeUrl(previewVariantId, 'svg', false)"
                      alt="Sample Barcode"
                      style="width: 94%; height: 7.5mm; object-fit: contain;"
                    />
                  </template>
                  <template v-else>
                    <UIcon
                      :name="form.code_type === 'QR' ? 'i-heroicons-qr-code' : 'i-heroicons-bars-3-bottom-left'"
                      class="w-6 h-6 text-gray-800"
                    />
                  </template>
                  <div
                    class="font-mono font-bold text-gray-900 tracking-wider text-center leading-none mt-0.5"
                    :style="{ fontSize: isCompactSize ? '5pt' : '5.5pt' }"
                  >
                    {{ sampleItem.barcode || sampleItem.sku }}
                  </div>
                </div>
              </div>

              <p class="text-[11px] text-gray-500 mt-2 text-center">
                Scaled 1.35× for screen clarity • Actual print output:
                <span class="font-mono font-semibold">{{ form.label_width_mm }}mm × {{ form.label_height_mm }}mm</span>
              </p>
            </div>

            <!-- Sample Preview Data Switcher -->
            <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Sample Garment Data</span>
                <span class="text-[11px] text-gray-500">Test text fitting</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <BaseInput v-model="sampleItem.productName" size="sm" placeholder="Product Name" />
                <BaseInput v-model="sampleItem.sku" size="sm" mono placeholder="SKU" />
                <BaseInput v-model="sampleItem.barcode" size="sm" mono placeholder="Barcode (885...)" />
                <BaseInput v-model="sampleItem.priceUsd" size="sm" type="number" :step="0.5" placeholder="Price USD" />
              </div>
            </div>

            <!-- Where this template is used -->
            <div class="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <div class="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                <UIcon name="i-heroicons-check-badge" class="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span>Synced Across All Sticker Surfaces</span>
              </div>
              <ul class="space-y-1 pl-5 list-disc text-[11px]">
                <li>Post-Product Creation Instant Sticker Print (<span class="font-mono">/products/new</span>)</li>
                <li>Product Detail &amp; Variants Sticker Modal (<span class="font-mono">/products/[id]</span>)</li>
                <li>Batch Sticker Roll &amp; Sheet Studio (<span class="font-mono">/labels/generate</span>)</li>
                <li>Cashier POS Instant Garment Tag Printer (<span class="font-mono">/pos</span>)</li>
              </ul>
            </div>
          </div>
        </DataCard>
      </div>
    </div>

    <!-- Print-Only Container for Test Print -->
    <div
      id="template-test-print-sticker"
      class="print-only"
      :style="{
        '--sticker-w': `${form.label_width_mm}mm`,
        '--sticker-h': `${form.label_height_mm}mm`,
      }"
    >
      <div
        class="kh-product-sticker"
        :style="{
          width: `${form.label_width_mm}mm`,
          height: `${form.label_height_mm}mm`,
          padding: isCompactSize ? '1.5mm 1.8mm' : '1.8mm 2.2mm',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          overflow: 'hidden',
        }"
      >
        <div>
          <div
            v-if="form.show_store_header"
            class="font-khmer font-bold text-gray-900 truncate pb-0.5 mb-0.5 border-b border-gray-200"
            :style="{ fontSize: isCompactSize ? '5pt' : '5.5pt' }"
          >
            {{ form.store_header || displayNameKh || displayName }}
          </div>
          <div class="flex items-baseline justify-between gap-1">
            <div
              v-if="form.show_product_name"
              class="font-khmer font-bold text-gray-900 truncate"
              :style="{ fontSize: isCompactSize ? '6.5pt' : '7.2pt' }"
            >
              {{ sampleItem.productName }}
            </div>
            <div v-else class="flex-1" />
            <div
              v-if="form.show_price_usd"
              class="font-extrabold text-gray-900 shrink-0"
              :style="{ fontSize: isCompactSize ? '8.5pt' : '9.5pt' }"
            >
              ${{ Number(sampleItem.priceUsd || 0).toFixed(2) }}
            </div>
          </div>
          <div
            v-if="form.show_sku || form.show_khr"
            class="flex items-center justify-between gap-1 text-gray-700"
            :style="{ fontSize: isCompactSize ? '4.8pt' : '5.3pt' }"
          >
            <span v-if="form.show_sku" class="font-mono truncate">SKU: {{ sampleItem.sku }}</span>
            <span v-else />
            <span v-if="form.show_khr" class="font-khmer font-semibold shrink-0">{{ samplePriceKhr }} ៛</span>
          </div>
          <div
            v-if="form.show_variant_attrs"
            class="font-khmer text-gray-900 truncate"
            :style="{ fontSize: isCompactSize ? '4.8pt' : '5.3pt' }"
          >
            ពណ៌: <strong>{{ sampleItem.color }}</strong> &nbsp; ទំហំ: <strong>{{ sampleItem.size }}</strong>
          </div>
        </div>
        <div class="flex flex-col items-center justify-end pt-0.5">
          <template v-if="previewVariantId">
            <img
              v-if="form.code_type === 'QR'"
              :src="getQrUrl(previewVariantId, 'svg')"
              alt="Sample QR"
              style="width: 9.5mm; height: 9.5mm; object-fit: contain;"
            />
            <img
              v-else
              :src="getBarcodeUrl(previewVariantId, 'svg', false)"
              alt="Sample Barcode"
              style="width: 94%; height: 7.5mm; object-fit: contain;"
            />
          </template>
          <div
            class="font-mono font-bold text-gray-900 tracking-wider text-center leading-none mt-0.5"
            :style="{ fontSize: isCompactSize ? '5pt' : '5.5pt' }"
          >
            {{ sampleItem.barcode || sampleItem.sku }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductVariant } from '~/types'
import { DEFAULT_STICKER_TEMPLATE, type StickerTemplateConfig } from '~/composables/useStickerTemplate'
import { printWithKhmerFonts } from '~/composables/useKhmerPrint'

definePageMeta({ middleware: ['auth'] })

const toast = useAppToast()
const { displayName, displayNameKh, loadBrand } = useBrand()
const { stickerPresets, loadStickerTemplate, saveStickerTemplate } = useStickerTemplate()
const { listVariants, getQrUrl, getBarcodeUrl } = useVariantApi()

const saving = ref(false)
const previewVariantId = ref<string>('')

const form = reactive<StickerTemplateConfig>({
  ...DEFAULT_STICKER_TEMPLATE,
})

const sampleItem = reactive({
  productName: 'អាវយឺតកមូល (Cotton Tee)',
  sku: 'TSH-BLK-M-01',
  barcode: '8850002401',
  color: 'ខ្មៅ (Black)',
  size: 'M',
  priceUsd: 18.5,
})

const isCompactSize = computed(() => Number(form.label_width_mm) <= 42)

const samplePriceKhr = computed(() => {
  const rate = Number(form.khr_exchange_rate) || 4100
  return Math.round((Number(sampleItem.priceUsd) || 0) * rate).toLocaleString()
})

function applyPreset(preset: (typeof stickerPresets)[number]) {
  form.paper_size = preset.paper_size
  form.label_width_mm = preset.label_width_mm
  form.label_height_mm = preset.label_height_mm
  form.columns = preset.columns
}

function syncFromBrand() {
  const header = displayNameKh.value || displayName.value || DEFAULT_STICKER_TEMPLATE.store_header
  form.store_header = header
  toast.add({
    title: 'Synced with Brand Profile',
    description: `Store header set to "${header}"`,
    color: 'green',
  })
}

function resetDefaults() {
  Object.assign(form, {
    ...DEFAULT_STICKER_TEMPLATE,
    store_header: displayNameKh.value || displayName.value || DEFAULT_STICKER_TEMPLATE.store_header,
  })
  toast.add({
    title: 'Defaults Restored',
    description: 'Click Save Template to persist default sticker settings.',
    color: 'default',
  })
}

async function handleSaveTemplate() {
  saving.value = true
  try {
    await saveStickerTemplate({
      ...form,
      label_width_mm: Number(form.label_width_mm) || 50,
      label_height_mm: Number(form.label_height_mm) || 30,
      columns: Number(form.columns) || 1,
      khr_exchange_rate: Number(form.khr_exchange_rate) || 4100,
      default_copies: Number(form.default_copies) || 1,
    })
    toast.add({
      title: 'Sticker Template Saved',
      description: 'Default sticker layout and fields updated across Admin & Cashier POS.',
      color: 'green',
    })
  } catch (err: any) {
    toast.add({
      title: 'Save Error',
      description: err?.data?.detail || 'Saved locally; could not sync with server.',
      color: 'amber',
    })
  } finally {
    saving.value = false
  }
}

async function handleTestPrint() {
  await printWithKhmerFonts()
}

onMounted(async () => {
  await loadBrand()
  const loaded = await loadStickerTemplate(true)
  Object.assign(form, loaded)
  if (!form.store_header) {
    form.store_header = displayNameKh.value || displayName.value || DEFAULT_STICKER_TEMPLATE.store_header
  }

  try {
    const variants = (await listVariants({ limit: 5 })) as ProductVariant[]
    if (variants && variants.length > 0) {
      const first = variants[0]!
      previewVariantId.value = first.id
      sampleItem.productName = first.product?.name || sampleItem.productName
      sampleItem.sku = first.sku || sampleItem.sku
      sampleItem.barcode = first.barcode || first.sku || sampleItem.barcode
      sampleItem.color = first.color?.name || sampleItem.color
      sampleItem.size = first.size?.name || sampleItem.size
      sampleItem.priceUsd = Number(first.selling_price) || sampleItem.priceUsd
    }
  } catch {
    // Keep fallback sample item if offline
  }
})
</script>

<style scoped>
.print-only {
  display: none;
}

@media print {
  @page {
    margin: 0;
  }
  .no-print {
    display: none !important;
  }
  .print-only {
    display: block !important;
  }
}
</style>
