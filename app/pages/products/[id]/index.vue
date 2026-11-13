<template>
  <div class="page-root">
    <AppPageHeader
      :title="product?.name || 'Product Detail'"
      :description="product ? `Product Code: ${product.code || product.sku_prefix || '—'} · ${variants.length} Variant(s)` : 'Loading product details...'"
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: product?.name || 'Detail' },
      ]"
    >
      <template v-if="product" #badge>
        <AppBadge :color="statusColor((product as any).status_code || product.status)" size="sm">
          {{ (product as any).status_code || product.status || 'ACTIVE' }}
        </AppBadge>
      </template>
      <template v-if="product" #actions>
        <AppButton
          variant="default"
          size="sm"
          icon="i-heroicons-tag"
          label="Label Designer"
          :to="`/labels/generate?product_id=${id}`"
        />
        <AppButton
          variant="default"
          size="sm"
          icon="i-heroicons-pencil-square"
          label="Edit Product"
          :to="`/products/${id}/edit`"
        />
        <AppButton
          variant="primary"
          size="sm"
          icon="i-heroicons-squares-plus"
          label="Variant Matrix & Stock"
          :to="`/products/${id}/variants`"
        />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
      <span>Loading product details…</span>
    </div>

    <template v-else-if="product">
      <!-- 5-Tab Navigation Bar -->
      <div class="flex flex-wrap items-center gap-1 border-b border-border-subtle pb-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'bg-ink text-white'
            : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'"
          @click="activeTab = tab.key"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.count !== undefined"
            class="rounded-full px-1.5 py-0.5 text-[11px] font-mono"
            :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-surface-inset text-ink-secondary border border-border-subtle'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- TAB 1: OVERVIEW -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div class="space-y-4">
          <AppCard>
            <div class="rounded-lg border border-border-subtle bg-surface-inset overflow-hidden flex items-center justify-center aspect-square">
              <img
                v-if="primaryImageUrl"
                :src="primaryImageUrl"
                :alt="product.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="py-10 flex items-center justify-center text-ink-tertiary">
                <UIcon name="i-heroicons-photo" class="w-10 h-10" />
              </div>
            </div>
            <div v-if="galleryImages.length > 1" class="grid grid-cols-4 gap-2 mt-3">
              <button
                v-for="img in galleryImages.slice(0, 4)"
                :key="img.id"
                type="button"
                class="aspect-square rounded-md border border-border-subtle overflow-hidden bg-surface-inset"
                @click="activeTab = 'images'"
              >
                <img :src="img.image_url" :alt="product.name" class="w-full h-full object-cover" />
              </button>
            </div>
          </AppCard>

          <AppCard title="Product Metadata">
            <dl class="detail-list">
              <div class="detail-row">
                <dt>Product Code</dt>
                <dd><code class="mono font-semibold text-ink">{{ product.code || product.sku_prefix || '—' }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd>
                  <AppBadge :color="statusColor((product as any).status_code || product.status)" size="sm">
                    {{ (product as any).status_code || product.status || 'ACTIVE' }}
                  </AppBadge>
                </dd>
              </div>
              <div class="detail-row">
                <dt>Category</dt>
                <dd>{{ product.category?.name ?? product.category_name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Brand</dt>
                <dd>{{ product.brand?.name ?? product.brand_name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Price Range</dt>
                <dd class="mono font-semibold text-ink">{{ priceRangeText }}</dd>
              </div>
              <div class="detail-row">
                <dt>Total Variants</dt>
                <dd class="mono font-semibold text-ink">{{ variants.length }}</dd>
              </div>
              <div class="detail-row">
                <dt>Created</dt>
                <dd>{{ fmtDate(product.created_at || (product as any).created_datetime || '') }}</dd>
              </div>
              <div class="detail-row">
                <dt>Updated</dt>
                <dd>{{ fmtDate(product.updated_at || (product as any).updated_datetime || '') }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>

        <div class="space-y-4">
          <AppCard title="Description & Tags">
            <p v-if="product.description" class="text-sm text-ink whitespace-pre-wrap m-0">{{ product.description }}</p>
            <p v-else class="text-xs text-ink-tertiary italic m-0">No description provided.</p>

            <div v-if="product.tags && product.tags.length > 0" class="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-border-subtle">
              <span class="text-xs text-ink-secondary mr-1">Tags:</span>
              <span
                v-for="tag in product.tags"
                :key="tag"
                class="inline-flex items-center rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink"
              >
                {{ tag }}
              </span>
            </div>
          </AppCard>

          <AppCard title="Configurable Product Attributes">
            <div v-if="groupedAttributes.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div
                v-for="group in groupedAttributes"
                :key="group.name"
                class="rounded-lg border border-border-subtle bg-surface-inset p-3"
              >
                <div class="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">{{ group.name }}</div>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span
                    v-for="val in group.values"
                    :key="val"
                    class="inline-flex items-center rounded-md border border-border-subtle bg-surface-card px-2 py-0.5 text-xs font-medium text-ink"
                  >
                    {{ val }}
                  </span>
                </div>
              </div>
            </div>
            <p v-else class="text-xs text-ink-tertiary italic m-0">
              No attributes assigned yet. Edit the product to select Material, Fit, Gender, Pattern, or Season.
            </p>
          </AppCard>

          <!-- Color & Size Summary -->
          <AppCard title="Available Colors & Sizes">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div class="text-xs font-semibold text-ink-secondary mb-2">Colors ({{ uniqueColors.length }})</div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="c in uniqueColors"
                    :key="c.name"
                    class="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-inset px-2.5 py-1 text-xs font-medium text-ink"
                  >
                    <span
                      v-if="c.hex"
                      class="w-2.5 h-2.5 rounded-full border border-border-subtle"
                      :style="{ background: c.hex }"
                    />
                    <span>{{ c.name }}</span>
                  </span>
                  <span v-if="uniqueColors.length === 0" class="text-xs text-ink-tertiary italic">Standard</span>
                </div>
              </div>
              <div>
                <div class="text-xs font-semibold text-ink-secondary mb-2">Sizes ({{ uniqueSizes.length }})</div>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="s in uniqueSizes"
                    :key="s"
                    class="inline-flex items-center rounded-md border border-border-subtle bg-surface-inset px-2.5 py-1 text-xs font-medium mono text-ink"
                  >
                    {{ s }}
                  </span>
                  <span v-if="uniqueSizes.length === 0" class="text-xs text-ink-tertiary italic">Free Size</span>
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>

      <!-- TAB 2: IMAGES -->
      <div v-else-if="activeTab === 'images'" class="space-y-4">
        <AppCard
          title="Product & Variant Image Gallery"
          subtitle="Upload product photos, choose the primary cover image, reorder gallery items, or link an image to a specific variant."
        >
          <div class="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
            <div class="rounded-xl border border-border-subtle bg-surface-inset p-4 space-y-3">
              <div class="text-xs font-semibold text-ink uppercase tracking-wider">Add New Image</div>
              <AppFileUpload
                v-model="newImageForm.image_url"
                folder="products"
                label="Upload Photo"
                hint="PNG, JPG, WEBP"
              />
              <AppSelect
                id="new-img-variant"
                v-model="newImageForm.variant_id"
                label="Assign to Variant (Optional)"
                :options="variantSelectOptions"
                placeholder="All Variants (Product Gallery)"
              />
              <AppCheckbox
                id="new-img-primary"
                v-model="newImageForm.is_primary"
                label="Set as primary cover image"
              />
              <AppButton
                variant="primary"
                size="sm"
                icon="i-heroicons-plus"
                label="Add Image to Gallery"
                class="w-full justify-center"
                :disabled="!newImageForm.image_url"
                :loading="savingImage"
                @click="handleAddGalleryImage"
              />
            </div>

            <div>
              <div v-if="galleryImages.length === 0" class="rounded-xl border border-border-subtle bg-surface-inset p-8 text-center">
                <UIcon name="i-heroicons-photo" class="w-8 h-8 text-ink-tertiary mx-auto mb-2" />
                <div class="text-sm font-semibold text-ink">No gallery images yet</div>
                <div class="text-xs text-ink-secondary mt-1">Upload an image on the left to build the product gallery.</div>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <div
                  v-for="(img, idx) in galleryImages"
                  :key="img.id"
                  class="rounded-xl border border-border-subtle bg-surface-card overflow-hidden flex flex-col justify-between"
                >
                  <div class="relative aspect-square bg-surface-inset border-b border-border-subtle">
                    <img :src="img.image_url" :alt="product.name" class="w-full h-full object-cover" />
                    <div class="absolute top-2 left-2 flex items-center gap-1.5">
                      <span
                        v-if="img.is_primary"
                        class="rounded-md bg-ink text-white px-2 py-0.5 text-[11px] font-semibold"
                      >
                        Primary Cover
                      </span>
                      <span
                        v-if="img.variant_id"
                        class="rounded-md bg-surface-raised/95 border border-border-subtle px-2 py-0.5 text-[11px] mono text-ink"
                      >
                        {{ variantLabelById(img.variant_id) }}
                      </span>
                    </div>
                  </div>
                  <div class="p-3 flex items-center justify-between gap-2">
                    <button
                      v-if="!img.is_primary"
                      type="button"
                      class="text-xs font-medium text-ink-secondary hover:text-ink underline"
                      @click="handleSetPrimaryImage(img)"
                    >
                      Make Primary
                    </button>
                    <span v-else class="text-xs text-ink-tertiary font-mono">Order #{{ idx + 1 }}</span>

                    <div class="flex items-center gap-1">
                      <AppButton
                        size="xs"
                        variant="danger"
                        icon="i-heroicons-trash"
                        aria-label="Delete image"
                        @click="handleDeleteGalleryImage(img.id)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- TAB 3: VARIANTS -->
      <div v-else-if="activeTab === 'variants'" class="space-y-4">
        <AppCard :title="`Product Variants (${filteredVariants.length} of ${variants.length})`" :no-pad="true">
          <template #header-right>
            <div class="flex flex-wrap items-center gap-2">
              <AppInput
                id="variant-tab-search"
                v-model="variantSearch"
                placeholder="Search SKU, color, size, barcode..."
                style="min-width: 220px;"
              />
              <AppButton
                size="xs"
                variant="primary"
                icon="i-heroicons-squares-plus"
                label="Add / Generate Variants"
                :to="`/products/${id}/variants`"
              />
            </div>
          </template>

          <AppTable
            :columns="variantCols"
            :rows="filteredVariants"
            :loading="false"
            empty-text="No variants match your search."
          >
            <template #cell-sku="{ row }">
              <code class="mono font-semibold text-ink">{{ row.sku }}</code>
            </template>
            <template #cell-color="{ row }">
              <div class="flex items-center gap-1.5">
                <span
                  v-if="row.color?.hex_code"
                  class="inline-block w-2.5 h-2.5 rounded-full border border-border-subtle"
                  :style="{ background: row.color.hex_code }"
                />
                <span>{{ row.color?.name ?? (row as any).color_name ?? 'Standard' }}</span>
              </div>
            </template>
            <template #cell-size="{ row }">
              <span class="mono font-medium">{{ row.size?.name ?? (row as any).size_name ?? 'Free Size' }}</span>
            </template>
            <template #cell-barcode="{ row }">
              <code class="mono text-xs text-ink-secondary">{{ row.barcode || '—' }}</code>
            </template>
            <template #cell-cost_price="{ row }">
              <span class="mono text-ink-secondary">${{ Number(row.cost_price ?? 0).toFixed(2) }}</span>
            </template>
            <template #cell-selling_price="{ row }">
              <span class="mono font-semibold text-ink">${{ Number(row.selling_price ?? 0).toFixed(2) }}</span>
            </template>
            <template #cell-status="{ row }">
              <button
                type="button"
                class="cursor-pointer bg-transparent border-0 p-0"
                title="Click to toggle Active / Inactive"
                @click="toggleVariantStatus(row)"
              >
                <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
                  {{ row.status_code || row.status || 'ACTIVE' }}
                </AppBadge>
              </button>
            </template>
            <template #actions="{ row }">
              <div class="flex justify-end gap-1">
                <AppButton
                  variant="default"
                  size="xs"
                  icon="i-heroicons-printer"
                  label="Sticker"
                  @click="openStickerFor(row)"
                />
                <AppButton
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-pencil-square"
                  label="Edit"
                  :to="`/products/${id}/variants?edit=${row.id}`"
                />
              </div>
            </template>
          </AppTable>
        </AppCard>
      </div>

      <!-- TAB 4: PRICING -->
      <div v-else-if="activeTab === 'pricing'" class="space-y-4">
        <AppCard
          title="Bulk Variant Price Update"
          subtitle="Apply a uniform Cost Price or Selling Price (USD) across all variants of this product."
        >
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <AppInput
              id="bulk-cost-price"
              v-model="bulkPricingForm.cost_price"
              type="number"
              min="0"
              step="0.01"
              label="New Cost Price for All Variants (USD)"
              placeholder="Leave blank to keep current"
              mono
            />
            <AppInput
              id="bulk-selling-price"
              v-model="bulkPricingForm.selling_price"
              type="number"
              min="0.01"
              step="0.01"
              label="New Selling Price for All Variants (USD)"
              placeholder="Leave blank to keep current"
              mono
            />
            <div>
              <AppButton
                variant="primary"
                size="sm"
                icon="i-heroicons-check"
                label="Apply Bulk Pricing"
                :loading="applyingBulkPrice"
                @click="handleBulkPriceUpdate"
              />
            </div>
          </div>
        </AppCard>

        <AppCard title="Variant Pricing & Margin Breakdown" :no-pad="true">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs sm:text-sm">
              <thead class="bg-surface-inset border-b border-border-subtle text-ink-secondary">
                <tr>
                  <th class="py-2.5 px-4 font-medium">SKU</th>
                  <th class="py-2.5 px-4 font-medium">Color / Size</th>
                  <th class="py-2.5 px-4 font-medium w-40">Cost Price (USD)</th>
                  <th class="py-2.5 px-4 font-medium w-40">Selling Price (USD)</th>
                  <th class="py-2.5 px-4 font-medium">Gross Margin</th>
                  <th class="py-2.5 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-subtle">
                <tr v-for="v in variants" :key="v.id" class="bg-surface-card">
                  <td class="py-2 px-4 mono font-semibold text-ink">{{ v.sku }}</td>
                  <td class="py-2 px-4 text-ink-secondary">
                    {{ v.color?.name || 'Standard' }} / {{ v.size?.name || 'Free Size' }}
                  </td>
                  <td class="py-2 px-4">
                    <AppInput
                      :id="`price-cost-${v.id}`"
                      v-model="priceEdits[v.id]!.cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      mono
                    />
                  </td>
                  <td class="py-2 px-4">
                    <AppInput
                      :id="`price-sell-${v.id}`"
                      v-model="priceEdits[v.id]!.selling_price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      mono
                    />
                  </td>
                  <td class="py-2 px-4 mono text-xs">
                    <span class="font-semibold text-ink">{{ calcMarginText(v.id) }}</span>
                  </td>
                  <td class="py-2 px-4 text-right">
                    <AppButton
                      size="xs"
                      variant="default"
                      icon="i-heroicons-check"
                      label="Save"
                      :loading="savingVariantPriceId === v.id"
                      @click="saveSingleVariantPrice(v)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AppCard>
      </div>

      <!-- TAB 5: BARCODE & QR CODES -->
      <div v-else-if="activeTab === 'barcodes'" class="space-y-4">
        <AppCard
          title="Variant Barcodes (Code 128) & QR Codes"
          subtitle="Every variant has a unique Code-128 1D barcode and a stable 2D QR reference. Regenerating codes records an audit log entry."
        >
          <template #actions>
            <AppButton
              size="xs"
              variant="primary"
              icon="i-heroicons-printer"
              label="Open Bulk Label Designer"
              :to="`/labels/generate?product_id=${id}`"
            />
          </template>

          <div v-if="variants.length === 0" class="text-xs text-ink-tertiary py-6 text-center">
            No variants available. Generate variants first to preview barcodes and QR codes.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="v in variants"
              :key="v.id"
              class="rounded-xl border border-border-subtle bg-surface-card p-4 flex flex-col justify-between gap-3"
            >
              <div class="flex items-start justify-between gap-2 border-b border-border-subtle pb-2.5">
                <div>
                  <div class="flex items-center gap-2">
                    <code class="mono text-sm font-bold text-ink">{{ v.sku }}</code>
                    <AppBadge :color="(v.status_code || v.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
                      {{ v.status_code || v.status || 'ACTIVE' }}
                    </AppBadge>
                  </div>
                  <div class="text-xs text-ink-secondary mt-0.5">
                    {{ v.color?.name || 'Standard' }} · {{ v.size?.name || 'Free Size' }} ·
                    <strong class="mono text-ink">${{ Number(v.selling_price ?? 0).toFixed(2) }}</strong>
                  </div>
                </div>
                <div class="flex items-center gap-1">
                  <AppButton
                    size="xs"
                    variant="default"
                    icon="i-heroicons-arrow-path"
                    label="Regenerate"
                    :loading="regeneratingId === v.id"
                    @click="handleRegenerateCodes(v)"
                  />
                  <AppButton
                    size="xs"
                    variant="primary"
                    icon="i-heroicons-printer"
                    label="Print Label"
                    @click="openStickerFor(v)"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-3 items-center">
                <!-- Code 128 Barcode Preview -->
                <div class="rounded-lg border border-border-subtle bg-white p-2.5 flex flex-col items-center justify-center">
                  <img
                    :src="`${getBarcodeUrl(v.id, 'svg', true)}&t=${cacheBust}`"
                    :alt="`Barcode for ${v.sku}`"
                    class="max-h-16 w-auto object-contain"
                  />
                  <div class="text-[11px] font-mono text-ink-secondary mt-1">
                    Code 128: <strong class="text-ink">{{ v.barcode || v.sku }}</strong>
                  </div>
                </div>

                <!-- QR Code Preview -->
                <div class="rounded-lg border border-border-subtle bg-white p-2 flex flex-col items-center justify-center">
                  <img
                    :src="`${getQrUrl(v.id, 'svg')}&t=${cacheBust}`"
                    :alt="`QR for ${v.sku}`"
                    class="w-20 h-20 object-contain"
                  />
                  <div class="text-[10px] font-mono text-ink-tertiary truncate max-w-[95px]" :title="v.qr_reference">
                    {{ v.qr_reference }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <ProductStickerPrintModal
        v-model="showStickerModal"
        :variant="selectedVariant"
        :product-name="product?.name"
      />
    </template>

    <AppErrorState
      v-else
      title="Product not found"
      :message="loadError || 'The requested product could not be found.'"
      @retry="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant, ProductImage, SelectOption } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Detail — KVC Clothing Store Admin' })

const {
  getProduct,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  bulkUpdateVariants,
} = useProductApi()
const {
  listVariants,
  updateVariant,
  patchVariantStatus,
  regenerateCodes,
  getQrUrl,
  getBarcodeUrl,
} = useVariantApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const loading = ref(true)
const loadError = ref('')
const showStickerModal = ref(false)
const selectedVariant = ref<ProductVariant | null>(null)
const cacheBust = ref(Date.now())

type DetailTabKey = 'overview' | 'images' | 'variants' | 'pricing' | 'barcodes'
const activeTab = ref<DetailTabKey>((route.query.tab as DetailTabKey) || 'overview')

const tabs = computed(() => [
  { key: 'overview' as DetailTabKey, label: '1. Overview', icon: 'i-heroicons-information-circle' },
  { key: 'images' as DetailTabKey, label: '2. Images', icon: 'i-heroicons-photo', count: galleryImages.value.length },
  { key: 'variants' as DetailTabKey, label: '3. Variants', icon: 'i-heroicons-squares-2x2', count: variants.value.length },
  { key: 'pricing' as DetailTabKey, label: '4. Pricing', icon: 'i-heroicons-currency-dollar' },
  { key: 'barcodes' as DetailTabKey, label: '5. Barcode & QR Codes', icon: 'i-heroicons-qr-code', count: variants.value.length },
])

// Overview computed properties
const galleryImages = computed<ProductImage[]>(() => {
  const imgs = product.value?.images || []
  if (imgs.length > 0) return imgs
  if (product.value?.image_url) {
    return [{
      id: 'primary-fallback',
      product_id: id,
      image_url: product.value.image_url,
      is_primary: true,
      sort_order: 0,
    }]
  }
  return []
})

const primaryImageUrl = computed(() => {
  const primary = galleryImages.value.find(i => i.is_primary)
  return (primary || galleryImages.value[0])?.image_url || product.value?.image_url || null
})

const priceRangeText = computed(() => {
  if (variants.value.length === 0) return '—'
  const prices = variants.value.map(v => Number(v.selling_price ?? 0)).filter(n => Number.isFinite(n))
  if (prices.length === 0) return '—'
  const lo = Math.min(...prices)
  const hi = Math.max(...prices)
  return Math.abs(lo - hi) < 0.005 ? `$${lo.toFixed(2)}` : `$${lo.toFixed(2)} – $${hi.toFixed(2)}`
})

const groupedAttributes = computed(() => {
  const assigns = product.value?.attribute_assignments || []
  const map = new Map<string, string[]>()
  for (const a of assigns) {
    const label = a.attribute_display_name || a.attribute_name || 'Attribute'
    const val = a.display_value || a.value || ''
    if (!val) continue
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(val)
  }
  return Array.from(map.entries()).map(([name, values]) => ({ name, values }))
})

const uniqueColors = computed(() => {
  const seen = new Map<string, { name: string; hex?: string | null }>()
  for (const v of variants.value) {
    const name = v.color?.name || (v as any).color_name
    if (name && !seen.has(name)) {
      seen.set(name, { name, hex: v.color?.hex_code })
    }
  }
  return Array.from(seen.values())
})

const uniqueSizes = computed(() => {
  const set = new Set<string>()
  for (const v of variants.value) {
    const name = v.size?.name || (v as any).size_name
    if (name) set.add(name)
  }
  return Array.from(set)
})

// Tab 2: Images logic
const newImageForm = reactive({
  image_url: '',
  variant_id: '',
  is_primary: false,
})
const savingImage = ref(false)

const variantSelectOptions = computed<SelectOption[]>(() => [
  { label: 'All Variants (Product Gallery)', value: '' },
  ...variants.value.map(v => ({
    label: `${v.sku} (${v.color?.name || 'Std'} / ${v.size?.name || 'Free'})`,
    value: v.id,
  })),
])

function variantLabelById(variantId: string): string {
  const v = variants.value.find(item => item.id === variantId)
  return v ? v.sku : 'Variant'
}

async function handleAddGalleryImage() {
  if (!newImageForm.image_url.trim()) return
  savingImage.value = true
  try {
    await addProductImage(id, {
      image_url: newImageForm.image_url.trim(),
      variant_id: newImageForm.variant_id || null,
      is_primary: newImageForm.is_primary,
      sort_order: galleryImages.value.length,
    })
    newImageForm.image_url = ''
    newImageForm.variant_id = ''
    newImageForm.is_primary = false
    await loadData()
    addToast({ type: 'success', title: 'Image added to gallery' })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Failed to add image', message: e?.data?.detail ?? String(e) })
  } finally {
    savingImage.value = false
  }
}

async function handleSetPrimaryImage(img: ProductImage) {
  if (img.id === 'primary-fallback') return
  try {
    await updateProductImage(id, img.id, { is_primary: true })
    await loadData()
    addToast({ type: 'success', title: 'Primary cover image updated' })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not update image', message: e?.data?.detail ?? String(e) })
  }
}

async function handleDeleteGalleryImage(imageId: string) {
  if (imageId === 'primary-fallback') return
  try {
    await deleteProductImage(id, imageId)
    await loadData()
    addToast({ type: 'success', title: 'Image removed' })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not remove image', message: e?.data?.detail ?? String(e) })
  }
}

// Tab 3: Variants search & status toggle
const variantSearch = ref('')
const filteredVariants = computed(() => {
  const q = variantSearch.value.trim().toLowerCase()
  if (!q) return variants.value
  return variants.value.filter((v) => {
    const sku = (v.sku || '').toLowerCase()
    const bc = (v.barcode || '').toLowerCase()
    const cName = (v.color?.name || '').toLowerCase()
    const sName = (v.size?.name || '').toLowerCase()
    return sku.includes(q) || bc.includes(q) || cName.includes(q) || sName.includes(q)
  })
})

async function toggleVariantStatus(v: ProductVariant) {
  const current = v.status_code || v.status || 'ACTIVE'
  const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    const updated = await patchVariantStatus(v.id, next)
    v.status_code = updated.status_code
    addToast({ type: 'success', title: 'Variant status updated', message: `${v.sku} is now ${next}.` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Status update failed', message: e?.data?.detail ?? String(e) })
  }
}

// Tab 4: Pricing logic
const bulkPricingForm = reactive({
  cost_price: '' as string | number,
  selling_price: '' as string | number,
})
const applyingBulkPrice = ref(false)
const savingVariantPriceId = ref<string | null>(null)
const priceEdits = reactive<Record<string, { cost_price: string | number; selling_price: string | number }>>({})

function syncPriceEdits() {
  for (const v of variants.value) {
    priceEdits[v.id] = {
      cost_price: Number(v.cost_price ?? 0).toFixed(2),
      selling_price: Number(v.selling_price ?? 0).toFixed(2),
    }
  }
}

function calcMarginText(variantId: string): string {
  const edit = priceEdits[variantId]
  if (!edit) return '—'
  const cost = Number(edit.cost_price) || 0
  const sell = Number(edit.selling_price) || 0
  if (sell <= 0) return '—'
  const profit = sell - cost
  const pct = (profit / sell) * 100
  return `$${profit.toFixed(2)} (${pct.toFixed(0)}%)`
}

async function handleBulkPriceUpdate() {
  const hasCost = bulkPricingForm.cost_price !== '' && bulkPricingForm.cost_price !== null
  const hasSell = bulkPricingForm.selling_price !== '' && bulkPricingForm.selling_price !== null
  if (!hasCost && !hasSell) {
    addToast({ type: 'warn', title: 'Enter a price', message: 'Provide a Cost Price or Selling Price to apply.' })
    return
  }
  applyingBulkPrice.value = true
  try {
    const updated = await bulkUpdateVariants(id, {
      cost_price: hasCost ? Number(bulkPricingForm.cost_price) : null,
      selling_price: hasSell ? Number(bulkPricingForm.selling_price) : null,
    })
    variants.value = updated
    syncPriceEdits()
    bulkPricingForm.cost_price = ''
    bulkPricingForm.selling_price = ''
    addToast({ type: 'success', title: 'Bulk prices updated', message: `Updated ${updated.length} variant(s).` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Bulk update failed', message: e?.data?.detail ?? String(e) })
  } finally {
    applyingBulkPrice.value = false
  }
}

async function saveSingleVariantPrice(v: ProductVariant) {
  const edit = priceEdits[v.id]
  if (!edit) return
  savingVariantPriceId.value = v.id
  try {
    const updated = await updateVariant(v.id, {
      cost_price: Number(edit.cost_price) || 0,
      selling_price: Number(edit.selling_price) || 0,
    })
    const idx = variants.value.findIndex(item => item.id === v.id)
    if (idx >= 0) variants.value[idx] = updated
    syncPriceEdits()
    addToast({ type: 'success', title: 'Price saved', message: `Updated pricing for ${v.sku}.` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Failed to save price', message: e?.data?.detail ?? String(e) })
  } finally {
    savingVariantPriceId.value = null
  }
}

// Tab 5: Barcode & QR Code regeneration
const regeneratingId = ref<string | null>(null)

async function handleRegenerateCodes(v: ProductVariant) {
  if (!window.confirm(`Regenerate barcode and QR code for ${v.sku}? Existing printed stickers with the old barcode will no longer match.`)) {
    return
  }
  regeneratingId.value = v.id
  try {
    const updated = await regenerateCodes(v.id)
    const idx = variants.value.findIndex(item => item.id === v.id)
    if (idx >= 0) variants.value[idx] = updated
    cacheBust.value = Date.now()
    addToast({
      type: 'success',
      title: 'Codes Regenerated & Audited',
      message: `New barcode for ${v.sku}: ${updated.barcode}`,
    })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Regeneration failed', message: e?.data?.detail ?? String(e) })
  } finally {
    regeneratingId.value = null
  }
}

function openStickerFor(v: ProductVariant) {
  selectedVariant.value = v
  showStickerModal.value = true
}

const variantCols = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'barcode', label: 'Barcode (Code 128)' },
  { key: 'cost_price', label: 'Cost', sortable: true },
  { key: 'selling_price', label: 'Selling Price', sortable: true },
  { key: 'status', label: 'Status' },
]

function statusColor(s?: string) {
  const map: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'yellow', DISCONTINUED: 'red', ARCHIVED: 'default' }
  return map[s || 'ACTIVE'] ?? 'default'
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const [p, v] = await Promise.all([
      getProduct(id),
      listVariants({ product_id: id, limit: 500 }).catch((e: any) => {
        addToast({ type: 'warn', title: 'Variants could not be loaded', message: e?.data?.detail ?? e?.message })
        return []
      }),
    ])
    product.value = p
    const list = Array.isArray(v) ? (v as ProductVariant[]) : ((v as any)?.items ?? [])
    variants.value = list.length ? list : (p?.variants ?? [])
    syncPriceEdits()

    const printVarId = route.query.print_variant as string | undefined
    if (printVarId) {
      const target = variants.value.find(item => item.id === printVarId)
      if (target) openStickerFor(target)
    }
  } catch (e: any) {
    product.value = null
    loadError.value = e?.data?.detail ?? e?.message ?? ''
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
