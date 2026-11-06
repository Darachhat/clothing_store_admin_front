<template>
  <div class="page-root">
    <AppPageHeader
      :title="product?.name || 'Product Detail'"
      :description="product ? `SKU Prefix: ${product.sku_prefix}` : 'Loading product details...'"
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
        <AppButton variant="default" size="sm" icon="i-heroicons-pencil-square" label="Edit Product" :to="`/products/${id}/edit`" />
        <AppButton variant="primary" size="sm" icon="i-heroicons-squares-plus" label="Manage Variants" :to="`/products/${id}/variants`" />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading product details…</div>

    <template v-else-if="product">
      <div class="detail-grid">
        <div class="space-y-4">
          <AppCard title="Product Details">
            <div v-if="product.image_url" class="product-detail-image-wrap">
              <img :src="product.image_url" :alt="product.name" class="product-detail-image" />
            </div>

            <dl class="detail-list">
              <div class="detail-row">
                <dt>SKU Prefix</dt>
                <dd><code class="mono font-semibold">{{ product.sku_prefix }}</code></dd>
              </div>
              <div class="detail-row">
                <dt>Category</dt>
                <dd>{{ product.category_name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Brand</dt>
                <dd>{{ product.brand_name ?? '—' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Gender</dt>
                <dd>{{ product.gender }}</dd>
              </div>
              <div class="detail-row">
                <dt>Season</dt>
                <dd>{{ product.season ?? 'All Season' }}</dd>
              </div>
              <div class="detail-row">
                <dt>Cost Price</dt>
                <dd class="mono">${{ Number(product.cost_price).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>Retail Price</dt>
                <dd class="mono font-bold text-gray-900">${{ Number(product.retail_price).toFixed(2) }}</dd>
              </div>
              <div class="detail-row">
                <dt>Status</dt>
                <dd>
                  <AppBadge :color="statusColor((product as any).status_code || product.status)" size="sm">
                    {{ (product as any).status_code || product.status || 'ACTIVE' }}
                  </AppBadge>
                </dd>
              </div>
              <div v-if="product.description" class="detail-row detail-row--block">
                <dt>Description</dt>
                <dd>{{ product.description }}</dd>
              </div>
            </dl>
          </AppCard>
        </div>

        <AppCard :title="`Variants (${variants.length})`" :no-pad="true">
          <template #header-right>
            <AppButton size="xs" variant="default" icon="i-heroicons-plus" label="Add / Edit Variants" :to="`/products/${id}/variants`" />
          </template>
          <AppTable :columns="variantCols" :rows="variants" :loading="false" empty-text="No variants configured yet.">
            <template #cell-sku="{ value }">
              <code class="mono font-semibold">{{ value }}</code>
            </template>
            <template #cell-retail_price_override="{ value }">
              <span class="mono">{{ value != null ? `$${Number(value).toFixed(2)}` : `$${Number(product.retail_price).toFixed(2)}` }}</span>
            </template>
            <template #cell-status="{ row }">
              <AppBadge :color="(row.status_code || row.status) === 'ACTIVE' ? 'green' : 'default'" size="sm">
                {{ row.status_code || row.status || 'ACTIVE' }}
              </AppBadge>
            </template>
          </AppTable>
        </AppCard>
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
  { key: 'size', label: 'Size', sortable: true },
  { key: 'color', label: 'Color', sortable: true },
  { key: 'retail_price_override', label: 'Price', sortable: true },
  { key: 'status', label: 'Status' },
]

function statusColor(s: string) {
  const map: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'yellow', ARCHIVED: 'default' }
  return map[s] ?? 'default'
}

async function loadData() {
  loading.value = true
  try {
    const [p, v] = await Promise.all([
      getProduct(id),
      listVariants({ product_id: id }),
    ])
    product.value = p
    variants.value = v ?? []
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.detail-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.product-detail-image-wrap {
  margin-bottom: 14px;
  border-radius: var(--radius-lg, 8px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  max-height: 220px;
}

.product-detail-image {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
}

.detail-row--block {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.detail-row--block dd {
  text-align: left;
}
</style>
