<template>
  <div class="page-root">
    <AppPageHeader
      title="Barcode Label Studio"
      description="Design and batch-print thermal product barcode labels (50×30mm, 38×25mm, 60×40mm)."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Print Labels', to: '/labels' },
        { label: 'Batch Generator' },
      ]"
      back-to="/labels"
      back-label="Khmer Label Studio"
    >
      <template #actions>
        <AppButton
          v-if="labelQueue.length > 0"
          variant="primary"
          icon="i-heroicons-printer"
          :label="`Print ${totalLabels} Labels`"
          @click="printLabels"
        />
      </template>
    </AppPageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Variant Search & Queue -->
      <div class="lg:col-span-2 space-y-4">
        <AppCard title="1. Search & Add Products">
          <div class="flex gap-2">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by product name, SKU, or barcode..."
              class="field-input flex-1"
              @input="debouncedSearch"
            />
          </div>

          <div v-if="searchResults.length > 0" class="mt-3 divide-y divide-gray-100 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <div
              v-for="v in searchResults"
              :key="v.id"
              class="flex items-center justify-between px-3 py-2 hover:bg-gray-50 cursor-pointer"
              @click="addToQueue(v)"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">{{ v.product_name || v.sku }}</p>
                <p class="text-xs text-gray-500">
                  SKU: <span class="font-mono">{{ v.sku }}</span>
                  <span v-if="v.size"> · Size: {{ v.size }}</span>
                  <span v-if="v.color"> · Color: {{ v.color }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold text-gray-900">${{ Number(v.retail_price_override || v.retail_price || 0).toFixed(2) }}</span>
                <AppButton size="xs" variant="default" label="+ Add" />
              </div>
            </div>
          </div>
        </AppCard>

        <!-- Label Queue -->
        <AppCard title="2. Print Queue">
          <template #header-right>
            <AppButton v-if="labelQueue.length > 0" size="xs" variant="ghost" label="Clear All" @click="labelQueue = []" />
          </template>

          <AppEmptyState
            v-if="labelQueue.length === 0"
            icon="i-heroicons-qr-code"
            title="Print queue is empty"
            description="Search and click products above to add them to the label print queue."
          />

          <div v-else class="divide-y divide-gray-200">
            <div v-for="(item, idx) in labelQueue" :key="item.variant.id" class="flex items-center justify-between py-2.5 gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ item.variant.product_name || item.variant.sku }}</p>
                <p class="text-xs text-gray-500 font-mono">
                  {{ item.variant.sku }} · {{ item.variant.size || '' }} {{ item.variant.color || '' }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <label class="text-xs text-gray-500">Qty:</label>
                <input
                  v-model.number="item.copies"
                  type="number"
                  min="1"
                  max="100"
                  class="field-input w-16 text-center"
                />
                <AppButton size="xs" variant="ghost" icon="i-heroicons-x-mark" @click="labelQueue.splice(idx, 1)" />
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right: Settings + Live Preview -->
      <div class="space-y-4">
        <AppCard title="Label Settings">
          <div class="space-y-3">
            <div class="form-field">
              <label class="field-label">Label Size</label>
              <select v-model="settings.size" class="field-input">
                <option value="50x30">50mm × 30mm (Standard Thermal)</option>
                <option value="38x25">38mm × 25mm (Small Tag)</option>
                <option value="60x40">60mm × 40mm (Large Hang Tag)</option>
              </select>
            </div>

            <div class="form-field">
              <label class="field-label">Store Name Header</label>
              <input v-model="settings.storeName" type="text" class="field-input" />
            </div>

            <div class="space-y-2 pt-1">
              <label class="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input v-model="settings.showStoreName" type="checkbox" class="rounded" />
                Show Store Name
              </label>
              <label class="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input v-model="settings.showPrice" type="checkbox" class="rounded" />
                Show Price
              </label>
              <label class="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input v-model="settings.showVariant" type="checkbox" class="rounded" />
                Show Size / Color
              </label>
            </div>
          </div>
        </AppCard>

        <!-- Single Label Live Preview -->
        <AppCard title="Live Preview">
          <div class="flex justify-center py-4 bg-gray-100 rounded-lg">
            <div
              class="bg-white text-black border border-dashed border-gray-400 rounded p-2 flex flex-col items-center justify-between text-center shadow-sm"
              :style="previewStyle"
            >
              <p v-if="settings.showStoreName" class="text-[9px] font-bold tracking-wider uppercase truncate w-full">
                {{ settings.storeName }}
              </p>
              <p class="text-[10px] font-semibold truncate w-full leading-tight">
                {{ previewItem.product_name || 'Sample T-Shirt' }}
              </p>
              <p v-if="settings.showVariant" class="text-[8px] text-gray-600">
                {{ previewItem.size || 'M' }} / {{ previewItem.color || 'Black' }}
              </p>
              <canvas ref="previewBarcodeEl" class="max-w-full my-0.5" />
              <div class="flex items-center justify-between w-full px-1">
                <span class="text-[8px] font-mono">{{ previewItem.sku || 'TSH-BLK-M' }}</span>
                <span v-if="settings.showPrice" class="text-[11px] font-extrabold">
                  ${{ Number(previewItem.retail_price_override || previewItem.retail_price || 19.99).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
function drawBarcodeCanvas(canvas: HTMLCanvasElement, text: string, opts: { width?: number; height?: number; margin?: number } = {}) {
  const barWidth = opts.width ?? 1.4
  const height = opts.height ?? 28
  const margin = opts.margin ?? 2
  const clean = String(text || '123456789')
  // Encode each character into a deterministic 11-module bar/space pattern + start/stop guards
  const patterns: string[] = ['11010010000']
  for (let i = 0; i < clean.length; i++) {
    const c = clean.charCodeAt(i)
    const b1 = ((c >> 0) & 1) ? '11' : '1'
    const s1 = ((c >> 1) & 1) ? '00' : '0'
    const b2 = ((c >> 2) & 1) ? '11' : '1'
    const s2 = ((c >> 3) & 1) ? '00' : '0'
    const b3 = ((c >> 4) & 1) ? '11' : '1'
    const s3 = ((c >> 5) & 1) ? '00' : '0'
    patterns.push((b1 + s1 + b2 + s2 + b3 + s3 + '10').slice(0, 11))
  }
  patterns.push('1100011101011')
  const bits = patterns.join('')
  const totalWidth = Math.ceil(bits.length * barWidth + margin * 2)
  const totalHeight = Math.ceil(height + margin * 2)
  canvas.width = totalWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, totalWidth, totalHeight)
  ctx.fillStyle = '#000000'
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      ctx.fillRect(margin + i * barWidth, margin, Math.ceil(barWidth), height)
    }
  }
}

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Batch Barcode Labels — Clothing Store Admin' })

const variantApi = useVariantApi()

const searchQuery = ref('')
const searchResults = ref<any[]>([])
const labelQueue = ref<Array<{ variant: any; copies: number }>>([])
const previewBarcodeEl = ref<HTMLCanvasElement | null>(null)

const settings = ref({
  size: '50x30',
  storeName: 'CLOTHING STORE',
  showStoreName: true,
  showPrice: true,
  showVariant: true,
})

const sizeDimensions: Record<string, { width: string; height: string }> = {
  '50x30': { width: '189px', height: '113px' },
  '38x25': { width: '144px', height: '95px' },
  '60x40': { width: '227px', height: '151px' },
}

const previewStyle = computed(() => sizeDimensions[settings.value.size] || sizeDimensions['50x30'])

const previewItem = computed(() => {
  return labelQueue.value[0]?.variant || {
    product_name: 'Classic Cotton Tee',
    sku: 'TEE-BLK-M',
    barcode: '8901234567890',
    size: 'M',
    color: 'Black',
    retail_price: 24.99,
  }
})

const totalLabels = computed(() => labelQueue.value.reduce((sum, item) => sum + (item.copies || 1), 0))

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSearch() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(searchVariants, 250)
}

async function searchVariants() {
  const q = searchQuery.value.trim()
  if (!q) {
    searchResults.value = []
    return
  }
  try {
    const data = await variantApi.listVariants({ search: q, limit: 20 }) as any[]
    searchResults.value = data || []
  } catch {
    searchResults.value = []
  }
}

function addToQueue(variant: any) {
  const existing = labelQueue.value.find(i => i.variant.id === variant.id)
  if (existing) {
    existing.copies += 1
  } else {
    labelQueue.value.push({ variant, copies: 1 })
  }
}

function renderPreviewBarcode() {
  if (!previewBarcodeEl.value) return
  const code = previewItem.value.barcode || previewItem.value.sku || '123456789'
  try {
    drawBarcodeCanvas(previewBarcodeEl.value, code, {
      width: 1.3,
      height: 28,
      margin: 2,
    })
  } catch {
    // ignore invalid chars
  }
}

watch([previewItem, () => settings.value.size], () => nextTick(renderPreviewBarcode), { deep: true })
onMounted(() => nextTick(renderPreviewBarcode))

function printLabels() {
  const dims = settings.value.size.split('x')
  const wMm = dims[0]
  const hMm = dims[1]

  const labelsHtml: string[] = []
  for (const item of labelQueue.value) {
    const v = item.variant
    const code = v.barcode || v.sku
    const canvas = document.createElement('canvas')
    try {
      drawBarcodeCanvas(canvas, code, { width: 1.4, height: 32, margin: 0 })
    } catch {}
    const barcodeDataUrl = canvas.toDataURL('image/png')
    const price = Number(v.retail_price_override || v.retail_price || 0).toFixed(2)

    for (let c = 0; c < item.copies; c++) {
      labelsHtml.push(`
        <div class="label">
          ${settings.value.showStoreName ? `<div class="store">${settings.value.storeName}</div>` : ''}
          <div class="product">${v.product_name || v.sku}</div>
          ${settings.value.showVariant ? `<div class="variant">${v.size || ''} ${v.color ? '/ ' + v.color : ''}</div>` : ''}
          <img class="barcode" src="${barcodeDataUrl}" />
          <div class="footer">
            <span class="sku">${v.sku}</span>
            ${settings.value.showPrice ? `<span class="price">$${price}</span>` : ''}
          </div>
        </div>
      `)
    }
  }

  const win = window.open('', '_blank', 'width=500,height=600')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Barcode Labels</title>
  <style>
    @page { size: ${wMm}mm ${hMm}mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; }
    .label {
      width: ${wMm}mm; height: ${hMm}mm;
      padding: 1.5mm 2mm;
      display: flex; flex-direction: column;
      align-items: center; justify-content: space-between;
      text-align: center; page-break-after: always; overflow: hidden;
    }
    .store { font-size: 7pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
    .product { font-size: 7.5pt; font-weight: 600; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .variant { font-size: 6.5pt; color: #333; }
    .barcode { max-width: 92%; height: 9mm; object-fit: contain; }
    .footer { width: 100%; display: flex; justify-content: space-between; align-items: baseline; font-size: 6.5pt; }
    .sku { font-family: monospace; }
    .price { font-size: 8.5pt; font-weight: 900; }
  </style>
</head>
<body>${labelsHtml.join('')}</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}
</script>
