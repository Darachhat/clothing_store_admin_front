<template>
  <div class="page-root">
    <AppPageHeader
      title="Products"
      description="Manage KVC master catalog products, categories, brands, attributes, and SKU variants."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products' },
      ]"
      primary-label="New Product"
      primary-icon="i-heroicons-plus"
      primary-to="/products/new"
    >
      <template #secondary>
        <div class="inline-flex items-center rounded-lg border border-border-default bg-surface-raised p-0.5">
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="viewMode === 'list' ? 'bg-ink text-white' : 'text-ink-secondary hover:text-ink'"
            title="List view"
            @click="viewMode = 'list'"
          >
            <UIcon name="i-heroicons-bars-3" class="w-4 h-4" />
            <span>List</span>
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
            :class="viewMode === 'grid' ? 'bg-ink text-white' : 'text-ink-secondary hover:text-ink'"
            title="Grid view"
            @click="viewMode = 'grid'"
          >
            <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4" />
            <span>Grid</span>
          </button>
        </div>

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
      search-placeholder="Search products by name, product code, SKU, category, or brand..."
      :chips="activeChips"
      :shown-count="products.length"
      :total-count="totalProducts"
      :summary-items="[
        { label: 'Variants (page)', value: pageVariantCount },
        { label: 'Active (page)', value: pageActiveCount },
      ]"
      count-label="products"
      @submit="applyFilters"
      @remove-chip="removeChip"
      @clear-all="resetFilters"
    >
      <AppSelect
        v-model="categoryFilter"
        aria-label="Filter by category"
        :options="categoryOptions"
        style="min-width: 155px;"
      />
      <AppSelect
        v-model="brandFilter"
        aria-label="Filter by brand"
        :options="brandOptions"
        style="min-width: 145px;"
      />
      <AppSelect
        v-model="statusFilter"
        aria-label="Filter by status"
        :options="statusOptions"
        style="min-width: 155px;"
      />
      <AppSelect
        v-model="sortComposite"
        aria-label="Sort products"
        :options="sortOptions"
        style="min-width: 165px;"
      />
    </AppFilterBar>

    <!-- Bulk Selection Action Bar -->
    <div
      v-if="selectedIds.length > 0"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-raised px-4 py-2.5"
    >
      <div class="flex items-center gap-3 text-sm">
        <span class="inline-flex items-center justify-center rounded-md bg-surface-inset px-2 py-0.5 text-xs font-semibold text-ink border border-border-subtle">
          {{ selectedIds.length }} selected
        </span>
        <button
          type="button"
          class="text-xs font-medium text-ink-secondary hover:text-ink underline"
          @click="toggleSelectAllPage"
        >
          {{ allPageSelected ? 'Deselect page' : 'Select all on page' }}
        </button>
        <button
          type="button"
          class="text-xs font-medium text-ink-secondary hover:text-ink underline"
          @click="selectedIds = []"
        >
          Clear selection
        </button>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          size="xs"
          variant="danger"
          icon="i-heroicons-archive-box"
          :label="`Archive Selected (${selectedIds.length})`"
          @click="showBulkArchiveModal = true"
        />
      </div>
    </div>

    <!-- LIST VIEW -->
    <AppCard v-if="viewMode === 'list'" :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="products"
        :loading="loading"
        :error="loadError"
        :on-retry="fetchProducts"
        :empty-state="{
          icon: 'i-heroicons-tag',
          label: 'No products found',
          description: 'Adjust your filters or add a new product to the catalog.',
        }"
        @sort="onSort"
      >
        <template #cell-select="{ row }">
          <input
            type="checkbox"
            class="h-4 w-4 rounded border-border-default text-ink focus:ring-0 cursor-pointer"
            :checked="selectedIds.includes(row.id)"
            :aria-label="`Select ${row.name}`"
            @change="toggleSelectRow(row.id)"
          />
        </template>

        <template #cell-code="{ row }">
          <code class="mono font-medium text-ink">{{ row.code || row.sku_prefix || '—' }}</code>
        </template>

        <template #cell-name="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="primaryImageOf(row)"
              :src="primaryImageOf(row)!"
              :alt="row.name"
              loading="lazy"
              class="w-10 h-10 rounded-lg border border-border-subtle object-cover shrink-0 bg-surface-inset"
            />
            <div v-else class="w-10 h-10 rounded-lg border border-border-subtle shrink-0 bg-surface-inset flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="w-4 h-4 text-ink-tertiary" />
            </div>
            <div class="min-w-0">
              <NuxtLink :to="`/products/${row.id}`" class="block text-sm font-medium text-ink no-underline hover:underline truncate">
                {{ row.name }}
              </NuxtLink>
              <div class="flex items-center gap-1.5 text-xs text-ink-secondary truncate">
                <span class="mono">{{ row.code || row.slug || '' }}</span>
                <template v-if="row.tags && row.tags.length">
                  <span>·</span>
                  <span class="truncate">{{ row.tags.slice(0, 2).join(', ') }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>

        <template #cell-category_name="{ row }">
          <span class="text-sm text-ink-secondary">{{ categoryOf(row) }}</span>
        </template>

        <template #cell-brand_name="{ row }">
          <span class="text-sm text-ink-secondary">{{ brandOf(row) }}</span>
        </template>

        <template #cell-variant_count="{ row }">
          <NuxtLink
            :to="`/products/${row.id}?tab=variants`"
            class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink no-underline hover:bg-surface-hover"
          >
            <UIcon name="i-heroicons-squares-2x2" class="w-3.5 h-3.5 text-ink-secondary" />
            <span class="mono">{{ variantCountOf(row) }}</span>
          </NuxtLink>
        </template>

        <template #cell-price_range="{ row }">
          <span class="mono text-sm font-medium text-ink">{{ priceRangeOf(row) }}</span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="statusColor(statusOf(row))" size="sm">
            {{ statusOf(row) }}
          </AppBadge>
        </template>

        <template #cell-created_at="{ row }">
          <span class="text-xs text-ink-secondary whitespace-nowrap">{{ formatDate(row.created_at) }}</span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <AppButton size="xs" variant="ghost" icon="i-heroicons-eye" :aria-label="`View ${row.name}`" label="View" :to="`/products/${row.id}`" />
            <AppButton size="xs" variant="ghost" icon="i-heroicons-pencil-square" :aria-label="`Edit ${row.name}`" label="Edit" :to="`/products/${row.id}/edit`" />
            <AppButton size="xs" variant="default" icon="i-heroicons-squares-plus" :aria-label="`Variants of ${row.name}`" label="Variants" :to="`/products/${row.id}?tab=variants`" />
            <AppButton
              v-if="statusOf(row) !== 'DISCONTINUED'"
              size="xs"
              variant="danger"
              icon="i-heroicons-archive-box"
              :aria-label="`Archive ${row.name}`"
              label="Archive"
              @click="confirmArchive(row)"
            />
          </div>
        </template>

        <template v-if="totalProducts > pageSize" #footer>
          <AppPagination
            v-model:page="currentPage"
            :page-size="pageSize"
            :total="totalProducts"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- GRID VIEW -->
    <div v-else class="space-y-4">
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="n in 8"
          :key="n"
          class="rounded-xl border border-border-subtle bg-surface-raised p-4 animate-pulse space-y-3"
        >
          <div class="aspect-square rounded-lg bg-surface-inset" />
          <div class="h-4 w-2/3 rounded bg-surface-inset" />
          <div class="h-3 w-1/2 rounded bg-surface-inset" />
        </div>
      </div>

      <div
        v-else-if="products.length === 0"
        class="rounded-xl border border-border-subtle bg-surface-raised p-12 text-center"
      >
        <UIcon name="i-heroicons-tag" class="w-8 h-8 text-ink-tertiary mx-auto mb-2" />
        <div class="text-sm font-semibold text-ink">No products found</div>
        <div class="text-xs text-ink-secondary mt-1">Adjust your filters or create a new product.</div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="row in products"
          :key="row.id"
          class="group rounded-xl border border-border-subtle bg-surface-raised overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-sm"
        >
          <div>
            <div class="relative aspect-[4/3] bg-surface-inset border-b border-border-subtle overflow-hidden">
              <img
                v-if="primaryImageOf(row)"
                :src="primaryImageOf(row)!"
                :alt="row.name"
                loading="lazy"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-photo" class="w-10 h-10 text-ink-tertiary" />
              </div>

              <div class="absolute top-2.5 left-2.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border-default bg-surface-raised text-ink focus:ring-0 cursor-pointer"
                  :checked="selectedIds.includes(row.id)"
                  :aria-label="`Select ${row.name}`"
                  @change="toggleSelectRow(row.id)"
                />
                <code class="rounded-md bg-surface-raised/95 border border-border-subtle px-2 py-0.5 text-[11px] font-semibold mono text-ink">
                  {{ row.code || '—' }}
                </code>
              </div>

              <div class="absolute top-2.5 right-2.5">
                <AppBadge :color="statusColor(statusOf(row))" size="sm">
                  {{ statusOf(row) }}
                </AppBadge>
              </div>
            </div>

            <div class="p-4 space-y-2">
              <NuxtLink
                :to="`/products/${row.id}`"
                class="block text-sm font-semibold text-ink no-underline hover:underline line-clamp-1"
              >
                {{ row.name }}
              </NuxtLink>

              <div class="flex items-center justify-between text-xs text-ink-secondary">
                <span class="truncate">{{ categoryOf(row) }} · {{ brandOf(row) }}</span>
                <span class="shrink-0">{{ formatDate(row.created_at) }}</span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-border-subtle">
                <div>
                  <div class="text-[11px] text-ink-tertiary uppercase tracking-wider">Price Range</div>
                  <div class="mono text-sm font-semibold text-ink">{{ priceRangeOf(row) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-[11px] text-ink-tertiary uppercase tracking-wider">Variants</div>
                  <div class="mono text-sm font-semibold text-ink">{{ variantCountOf(row) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-4 py-2.5 bg-surface-inset border-t border-border-subtle flex items-center justify-between gap-1">
            <AppButton size="xs" variant="ghost" icon="i-heroicons-eye" label="Details" :to="`/products/${row.id}`" />
            <div class="flex items-center gap-1">
              <AppButton size="xs" variant="ghost" icon="i-heroicons-pencil-square" label="Edit" :to="`/products/${row.id}/edit`" />
              <AppButton
                v-if="statusOf(row) !== 'DISCONTINUED'"
                size="xs"
                variant="danger"
                icon="i-heroicons-archive-box"
                :aria-label="`Archive ${row.name}`"
                @click="confirmArchive(row)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="totalProducts > pageSize" class="flex justify-end pt-2">
        <AppPagination
          v-model:page="currentPage"
          :page-size="pageSize"
          :total="totalProducts"
        />
      </div>
    </div>

    <!-- Single Archive Dialog -->
    <AppConfirmDialog
      v-model="showArchiveModal"
      title="Archive Product"
      variant="danger"
      confirm-label="Archive Product"
      :loading="archiving"
      :message="`Are you sure you want to archive &quot;${archiveTarget?.name}&quot;?`"
      consequence="The product is marked Discontinued and hidden from active POS checkout grids. Variants, stock, and historical sales records are kept, and you can re-activate it from the Edit page."
      @confirm="doArchive"
    />

    <!-- Bulk Archive Dialog -->
    <AppConfirmDialog
      v-model="showBulkArchiveModal"
      title="Archive Selected Products"
      variant="danger"
      :confirm-label="`Archive ${selectedIds.length} Product(s)`"
      :loading="bulkArchiving"
      :message="`Are you sure you want to archive ${selectedIds.length} selected product(s)?`"
      consequence="Selected products will be marked Discontinued and hidden from active POS checkout grids while preserving all variants and historical records."
      @confirm="doBulkArchive"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product, FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Products — KVC Clothing Store Admin' })

const { listProducts, deleteProduct, bulkArchiveProducts } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { addToast } = useAppToast()

const products = ref<Product[]>([])
const totalProducts = ref(0)
const categories = ref<any[]>([])
const brands = ref<any[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

const viewMode = ref<'list' | 'grid'>('list')
const selectedIds = ref<string[]>([])

const search = ref('')
const categoryFilter = ref('')
const brandFilter = ref('')
const statusFilter = ref('ALL')
const currentPage = ref(1)
const pageSize = 20

const SERVER_SORT_KEYS: Record<string, string> = {
  name: 'name',
  code: 'code',
  status: 'status',
  created_at: 'created_at',
}
const sortKey = ref('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')

const sortComposite = computed({
  get: () => `${sortKey.value}:${sortDirection.value}`,
  set: (val: string) => {
    const [k, dir] = val.split(':')
    if (k) sortKey.value = k
    if (dir === 'asc' || dir === 'desc') sortDirection.value = dir
  },
})

const sortOptions = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Oldest First', value: 'created_at:asc' },
  { label: 'Name (A–Z)', value: 'name:asc' },
  { label: 'Name (Z–A)', value: 'name:desc' },
  { label: 'Code (A–Z)', value: 'code:asc' },
  { label: 'Code (Z–A)', value: 'code:desc' },
]

const showArchiveModal = ref(false)
const archiveTarget = ref<Product | null>(null)
const archiving = ref(false)

const showBulkArchiveModal = ref(false)
const bulkArchiving = ref(false)

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued (Archived)', value: 'DISCONTINUED' },
]

const categoryMap = computed<Record<string, string>>(() =>
  Object.fromEntries(categories.value.filter(c => c?.id).map(c => [c.id, c.name])),
)
const brandMap = computed<Record<string, string>>(() =>
  Object.fromEntries(brands.value.filter(b => b?.id).map(b => [b.id, b.name])),
)

const categoryOptions = computed(() => [
  { label: 'All Categories', value: '' },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])
const brandOptions = computed(() => [
  { label: 'All Brands', value: '' },
  ...brands.value.map(b => ({ label: b.name, value: b.id })),
])

const columns = [
  { key: 'select', label: '', width: '40px' },
  { key: 'code', label: 'Code', width: '125px', sortable: true },
  { key: 'name', label: 'Product', sortable: true },
  { key: 'category_name', label: 'Category' },
  { key: 'brand_name', label: 'Brand' },
  { key: 'variant_count', label: 'Variants', width: '100px' },
  { key: 'price_range', label: 'Price Range', width: '140px' },
  { key: 'status', label: 'Status', width: '120px', sortable: true },
  { key: 'created_at', label: 'Created', width: '115px', sortable: true },
]

const statusOf = (p: any): string => p.status_code || p.status || 'ACTIVE'
const categoryOf = (p: any): string =>
  p.category?.name || p.category_name || categoryMap.value[p.category_id] || '—'
const brandOf = (p: any): string =>
  p.brand?.name || p.brand_name || brandMap.value[p.brand_id] || '—'

function primaryImageOf(p: Product): string | null {
  if (p.image_url) return p.image_url
  if (Array.isArray(p.images) && p.images.length > 0) {
    const primary = p.images.find(img => img.is_primary)
    return (primary || p.images[0])?.image_url || null
  }
  return null
}

function variantCountOf(p: Product): number {
  if (typeof p.variant_count === 'number') return p.variant_count
  if (Array.isArray(p.variants)) return p.variants.length
  return 0
}

function formatMoney(v: number | string | null | undefined): string {
  const num = Number(v)
  if (!Number.isFinite(num)) return '$0.00'
  return `$${num.toFixed(2)}`
}

function priceRangeOf(p: Product): string {
  const min = p.min_price !== undefined && p.min_price !== null ? Number(p.min_price) : null
  const max = p.max_price !== undefined && p.max_price !== null ? Number(p.max_price) : null
  if (min !== null && max !== null && Number.isFinite(min) && Number.isFinite(max)) {
    if (Math.abs(min - max) < 0.005) return formatMoney(min)
    return `${formatMoney(min)} – ${formatMoney(max)}`
  }
  if (Array.isArray(p.variants) && p.variants.length > 0) {
    const prices = p.variants
      .map(v => Number(v.selling_price))
      .filter(n => Number.isFinite(n))
    if (prices.length > 0) {
      const lo = Math.min(...prices)
      const hi = Math.max(...prices)
      return Math.abs(lo - hi) < 0.005 ? formatMoney(lo) : `${formatMoney(lo)} – ${formatMoney(hi)}`
    }
  }
  return '—'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const pageVariantCount = computed(() =>
  products.value.reduce((sum, p) => sum + variantCountOf(p), 0).toLocaleString(),
)
const pageActiveCount = computed(() => products.value.filter(p => statusOf(p) === 'ACTIVE').length)

const allPageSelected = computed(() =>
  products.value.length > 0 && products.value.every(p => selectedIds.value.includes(p.id)),
)

function toggleSelectRow(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

function toggleSelectAllPage() {
  if (allPageSelected.value) {
    const pageIds = new Set(products.value.map(p => p.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.has(id))
  } else {
    const set = new Set([...selectedIds.value, ...products.value.map(p => p.id)])
    selectedIds.value = Array.from(set)
  }
}

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (categoryFilter.value) {
    chips.push({ key: 'category', label: 'Category', value: categoryMap.value[categoryFilter.value] || categoryFilter.value })
  }
  if (brandFilter.value) {
    chips.push({ key: 'brand', label: 'Brand', value: brandMap.value[brandFilter.value] || brandFilter.value })
  }
  if (statusFilter.value && statusFilter.value !== 'ALL') {
    chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  }
  return chips
})

function removeChip(key: string) {
  if (key === 'category') categoryFilter.value = ''
  if (key === 'brand') brandFilter.value = ''
  if (key === 'status') statusFilter.value = 'ALL'
}

function resetFilters() {
  search.value = ''
  categoryFilter.value = ''
  brandFilter.value = ''
  statusFilter.value = 'ALL'
}

function statusColor(s: string) {
  const map: Record<string, string> = { ACTIVE: 'green', INACTIVE: 'yellow', DISCONTINUED: 'red' }
  return map[s] ?? 'default'
}

function onSort({ key, order }: { key: string; order: 'asc' | 'desc' }) {
  const serverKey = SERVER_SORT_KEYS[key]
  if (!serverKey) return
  sortKey.value = serverKey
  sortDirection.value = order
}

let requestSeq = 0
async function fetchProducts() {
  const seq = ++requestSeq
  loading.value = true
  loadError.value = null
  try {
    const params: Record<string, unknown> = {
      page: currentPage.value,
      page_size: pageSize,
      include_stock: true,
      status: statusFilter.value || 'ALL',
      sort: sortKey.value,
      sort_direction: sortDirection.value,
    }
    const q = search.value.trim()
    if (q) params.q = q
    if (categoryFilter.value) params.category_id = categoryFilter.value
    if (brandFilter.value) params.brand_id = brandFilter.value

    const res = await listProducts(params) as any
    if (seq !== requestSeq) return
    const items: Product[] = Array.isArray(res) ? res : (res?.items ?? [])
    products.value = items
    totalProducts.value = res?.pagination?.total ?? res?.total ?? items.length
  } catch (e: any) {
    if (seq !== requestSeq) return
    loadError.value = e?.data?.detail ?? e?.message ?? 'Failed to load products'
    addToast({ type: 'error', title: 'Error', message: loadError.value ?? undefined })
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function applyFilters() {
  if (currentPage.value !== 1) currentPage.value = 1
  else fetchProducts()
}

watch([categoryFilter, brandFilter, statusFilter, sortKey, sortDirection], applyFilters)

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applyFilters, 350)
})
onBeforeUnmount(() => clearTimeout(searchTimer))

watch(currentPage, fetchProducts)

function confirmArchive(p: Product) {
  archiveTarget.value = p
  showArchiveModal.value = true
}

async function doArchive() {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    await deleteProduct(archiveTarget.value.id)
    addToast({ type: 'success', title: 'Product archived', message: `${archiveTarget.value.name} is now Discontinued.` })
    showArchiveModal.value = false
    selectedIds.value = selectedIds.value.filter(id => id !== archiveTarget.value?.id)
    await fetchProducts()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    archiving.value = false
  }
}

async function doBulkArchive() {
  if (!selectedIds.value.length) return
  bulkArchiving.value = true
  try {
    const res = await bulkArchiveProducts(selectedIds.value)
    addToast({
      type: 'success',
      title: 'Products archived',
      message: `${res?.archived_count ?? selectedIds.value.length} product(s) marked as Discontinued.`,
    })
    showBulkArchiveModal.value = false
    selectedIds.value = []
    await fetchProducts()
  } catch (e: any) {
    addToast({ type: 'error', title: 'Bulk archive failed', message: e?.data?.detail ?? String(e) })
  } finally {
    bulkArchiving.value = false
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
