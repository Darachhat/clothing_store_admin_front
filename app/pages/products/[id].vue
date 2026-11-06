<template>
  <div class="page-root">
    <AppPageHeader
      :title="product?.name || 'Product Detail'"
      :description="product ? `Code: ${product.code || product.sku_prefix || '—'}` : 'Loading product details...'"
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
        <AppButton variant="default" size="sm" icon="i-heroicons-tag" label="Print Product Label" :to="`/labels/generate?product_id=${id}`" />
        <AppButton variant="default" size="sm" icon="i-heroicons-pencil-square" label="Edit Product" :to="`/products/${id}/edit`" />
        <AppButton variant="primary" size="sm" icon="i-heroicons-squares-plus" label="Manage Variants" :to="`/products/${id}/variants`" />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
      <span>Loading product details…</span>
    </div>

    <template v-else-if="product">
      <div class="detail-grid">
        <div class="space-y-4">
          <AppCard>
            <div class="product-detail-image-wrap">
              <img v-if="product.image_url" :src="product.image_url" :alt="product.name" class="product-detail-image" />
              <div v-else class="py-10 flex items-center justify-center text-gray-400">
                <UIcon name="i-heroicons-photo" class="w-10 h-10" />
              </div>
            </div>
          </AppCard>

          <AppCard title="Product Details">
            <dl class="detail-list">
              <div class="detail-row">
                <dt>Code</dt>
                <dd><code class="mono font-semibold">{{ product.code || product.sku_prefix || '—' }}</code></dd>
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
                <dt>Slug</dt>
                <dd><code class="mono">{{ product.slug || '—' }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Created</dt>
                <dd>{{ fmtDate(product.created_at || product.created_datetime || '') }}</dd>
              </div>
              <div class="detail-row">
                <dt>Updated</dt>
                <dd>{{ fmtDate(product.updated_at || product.updated_datetime || '') }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>

        <div class="space-y-4">
          <AppCard title="Description">
            <p v-if="product.description" class="text-sm text-gray-700 whitespace-pre-wrap">{{ product.description }}</p>
            <p v-else class="text-xs text-gray-400 italic">No description provided.</p>
          </AppCard>

          <AppCard :title="`Variants (${variants.length})`" :no-pad="true">
            <template #header-right>
              <AppButton size="xs" variant="default" icon="i-heroicons-plus" label="Manage Variants" :to="`/products/${id}/variants`" />
            </template>
            <AppTable :columns="variantCols" :rows="variants" :loading="false" empty-text="No variants configured yet.">
              <template #cell-sku="{ value }">
                <code class="mono font-semibold">{{ value }}</code>
              </template>
              <template #cell-color="{ row }">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="row.color?.hex_code"
                    class="inline-block w-2.5 h-2.5 rounded-full border border-gray-300"
                    :style="{ background: row.color.hex_code }"
                  />
                  <span>{{ row.color?.name ?? (row as any).color_name ?? '—' }}</span>
                </div>
              </template>
              <template #cell-size="{ row }">
                <span>{{ row.size?.name ?? (row as any).size_name ?? '—' }}</span>
              </template>
              <template #cell-selling_price="{ row }">
                <span class="mono font-semibold">${{ Number(row.selling_price ?? row.retail_price_override ?? 0).toFixed(2) }}</span>
              </template>
              <template #cell-status="{ row }">
                <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
                  {{ row.status_code || row.status || 'ACTIVE' }}
                </AppBadge>
              </template>
            </AppTable>
          </AppCard>
        </div>
      </div>
    </template>

    <AppErrorState
      v-else
      title="Product not found"
      message="The requested product could not be found."
      @retry="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, ProductVariant } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Product Detail — Clothing Store Admin' })

const { getProduct } = useProductApi()
const { listVariants } = useVariantApi()

const product = ref<Product | null>(null)
const variants = ref<ProductVariant[]>([])
const loading = ref(true)

const variantCols = [
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'color', label: 'Color (ពណ៌)' },
  { key: 'size', label: 'Size (ទំហំ)' },
  { key: 'selling_price', label: 'Price', sortable: true },
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
  try {
    const [p, v] = await Promise.all([
      getProduct(id),
      listVariants({ product_id: id, limit: 200 }).catch(() => []),
    ])
    product.value = p
    variants.value = (v as ProductVariant[])?.length ? (v as ProductVariant[]) : (p?.variants ?? [])
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.product-detail-image-wrap {
  border-radius: var(--radius-lg, 8px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 240px;
}

.product-detail-image {
  width: 100%;
  max-height: 240px;
  object-fit: contain;
}
</style>
