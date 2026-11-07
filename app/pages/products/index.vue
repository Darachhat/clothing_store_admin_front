<template>
  <div class="page-root">
    <AppPageHeader
      title="Products"
      description="Manage master catalog products, categories, brands, suppliers, and SKU variants."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products' },
      ]"
      primary-label="New Product"
      primary-icon="i-heroicons-plus"
      primary-to="/products/new"
    >
      <template #secondary>
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-tag"
          label="Print Labels"
          to="/labels/generate"
        />
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchProducts"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="search"
      search-placeholder="Search products by name, code, slug, category, or brand..."
      :chips="activeChips"
      :shown-count="paginatedProducts.length"
      :total-count="filteredProducts.length"
      count-label="products"
      @submit="fetchProducts"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="categoryFilter"
        :options="categoryOptions"
        style="min-width: 155px;"
      />
      <AppSelect
        v-model="brandFilter"
        :options="brandOptions"
        style="min-width: 145px;"
      />
      <AppSelect
        v-model="statusFilter"
        :options="statusOptions"
        style="min-width: 145px;"
        @change="fetchProducts"
      />
    </AppFilterBar>

    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="paginatedProducts"
        :loading="loading"
        :empty-state="{
          icon: 'i-heroicons-tag',
          label: 'No products found',
          description: 'Adjust your filters or add a new product to the catalog.',
        }"
      >
        <template #cell-code="{ row }">
          <code class="mono font-semibold text-gray-800">{{ row.code || row.sku_prefix || '—' }}</code>
        </template>

        <template #cell-name="{ row }">
          <div class="product-cell">
            <img
              v-if="row.image_url"
              :src="row.image_url"
              :alt="row.name"
              class="product-thumb"
            />
            <div v-else class="product-thumb product-thumb--placeholder">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 text-gray-400" />
            </div>
            <div class="min-w-0">
              <NuxtLink :to="`/products/${row.id}`" class="product-name">{{ row.name }}</NuxtLink>
              <div class="product-sku mono">{{ row.slug || row.code || row.sku_prefix || '' }}</div>
            </div>
          </div>
        </template>

        <template #cell-category_name="{ row }">
          <span>{{ row.category?.name || row.category_name || categoryMap[row.category_id] || '—' }}</span>
        </template>

        <template #cell-brand_name="{ row }">
          <span>{{ row.brand?.name || row.brand_name || brandMap[row.brand_id] || '—' }}</span>
        </template>

        <template #cell-total_stock="{ row }">
          <span class="mono font-semibold">{{ row.total_stock ?? 0 }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="statusColor(row.status_code || row.status)" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="ghost" label="View" :to="`/products/${row.id}`" />
            <AppButton size="xs" variant="ghost" label="Edit" :to="`/products/${row.id}/edit`" />
            <AppButton size="xs" variant="default" label="Variants" :to="`/products/${row.id}/variants`" />
            <AppButton
              v-if="(row.status_code || row.status) !== 'ARCHIVED' && (row.status_code || row.status) !== 'DISCONTINUED'"
              size="xs"
              variant="danger"
              label="Archive"
              @click="confirmArchive(row)"
            />
          </div>
        </template>

        <template v-if="filteredProducts.length > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="filteredProducts.length"
          />
        </template>
      </AppTable>
    </AppCard>

    <AppConfirmDialog
      v-model="showArchiveModal"
      title="Archive Product"
      variant="danger"
      confirm-label="Archive Product"
      :loading="archiving"
      :message="`Are you sure you want to archive &quot;${archiveTarget?.name}&quot;?`"
      consequence="Archived products are hidden from active POS checkout grids while preserving historical sales records."
      @confirm="doArchive"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Products — Clothing Store Admin' })

const { listProducts, deleteProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { addToast } = useAppToast()

const products = ref<Product[]>([])
const categories = ref<any[]>([])
const brands = ref<any[]>([])
const loading = ref(false)

const search = ref('')
const categoryFilter = ref('')
const brandFilter = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 20

const showArchiveModal = ref(false)
const archiveTarget = ref<Product | null>(null)
const archiving = ref(false)

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED' },
]

const categoryMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const c of categories.value) {
    if (c?.id) m[c.id] = c.name
  }
  return m
})

const brandMap = computed<Record<string, string>>(() => {
  const m: Record<string, string> = {}
  for (const b of brands.value) {
    if (b?.id) m[b.id] = b.name
  }
  return m
})

const categoryOptions = computed(() => [
  { label: 'All Categories', value: '' },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])

const brandOptions = computed(() => [
  { label: 'All Brands', value: '' },
  ...brands.value.map(b => ({ label: b.name, value: b.id })),
])

const columns = [
  { key: 'code', label: 'Code', width: '130px', sortable: true },
  { key: 'name', label: 'Product Name', sortable: true },
  { key: 'category_name', label: 'Category', sortable: true },
  { key: 'brand_name', label: 'Brand', sortable: true },
  { key: 'total_stock', label: 'Total Stock', width: '110px', sortable: true },
  { key: 'status', label: 'Status', width: '115px', sortable: true },
]

const filteredProducts = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.value.filter((p: any) => {
    if (q) {
      const hay = [
        p.name,
        p.code,
        p.slug,
        p.sku_prefix,
        p.category?.name || p.category_name || categoryMap.value[p.category_id],
        p.brand?.name || p.brand_name || brandMap.value[p.brand_id],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (categoryFilter.value && p.category_id !== categoryFilter.value) return false
    if (brandFilter.value && p.brand_id !== brandFilter.value) return false
    if (statusFilter.value && (p.status_code || p.status) !== statusFilter.value) return false
    return true
  })
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (categoryFilter.value) {
    chips.push({ key: 'category', label: 'Category', value: categoryMap.value[categoryFilter.value] || categoryFilter.value })
  }
  if (brandFilter.value) {
    chips.push({ key: 'brand', label: 'Brand', value: brandMap.value[brandFilter.value] || brandFilter.value })
  }
  if (statusFilter.value) {
    chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  }
  return chips
})

function removeChip(key: string) {
  if (key === 'category') categoryFilter.value = ''
  if (key === 'brand') brandFilter.value = ''
  if (key === 'status') {
    statusFilter.value = ''
    fetchProducts()
  }
  currentPage.value = 1
}

function resetFilters() {
  search.value = ''
  categoryFilter.value = ''
  brandFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchProducts()
}

watch([search, categoryFilter, brandFilter, statusFilter], () => {
  currentPage.value = 1
})

function statusColor(s: string) {
  const map: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'yellow', DISCONTINUED: 'red', ARCHIVED: 'default' }
  return map[s] ?? 'default'
}

async function fetchProducts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = { limit: 200, include_stock: true }
    if (search.value.trim()) params.q = search.value.trim()
    if (statusFilter.value) params.status = statusFilter.value
    const res = await listProducts(params) as any
    products.value = Array.isArray(res) ? res : (res?.items ?? [])
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    loading.value = false
  }
}

function confirmArchive(p: Product) {
  archiveTarget.value = p
  showArchiveModal.value = true
}

async function doArchive() {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    await deleteProduct(archiveTarget.value.id)
    addToast({ type: 'success', title: 'Product archived' })
    showArchiveModal.value = false
    await fetchProducts()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    archiving.value = false
  }
}

onMounted(async () => {
  const [cats, brs] = await Promise.all([
    listCategories().catch(() => []),
    listBrands().catch(() => []),
  ])
  categories.value = Array.isArray(cats) ? cats : ((cats as any)?.items || [])
  brands.value = Array.isArray(brs) ? brs : ((brs as any)?.items || [])
  await fetchProducts()
})
</script>

<style scoped>
.product-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-thumb {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  object-fit: cover;
  flex-shrink: 0;
  background: var(--surface-inset, #f8fafc);
}

.product-thumb--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  text-decoration: none;
}

.product-name:hover {
  text-decoration: underline;
}

.product-sku {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
}
</style>
