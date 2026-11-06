<template>
  <div class="page-root">
    <AppPageHeader
      title="Edit Product"
      :description="product ? `Editing ${product.name} (${product.sku_prefix})` : 'Loading product...'"
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: product?.name || 'Product', to: `/products/${id}` },
        { label: 'Edit' },
      ]"
    />

    <div v-if="loading" class="state-card">Loading product…</div>

    <form v-else-if="product" class="product-form-layout" @submit.prevent="handleSubmit">
      <div class="product-form-main">
        <AppCard title="Basic Information">
          <div class="form-grid">
            <div class="form-row">
              <AppInput v-model="form.name" label="Product Name" required />
              <AppInput v-model="form.sku_prefix" label="SKU Prefix" required />
            </div>

            <div class="form-row">
              <AppSelect v-model="form.category_id" label="Category" :options="categoryOptions" />
              <AppSelect v-model="form.brand_id" label="Brand" :options="brandOptions" />
            </div>

            <div class="form-row">
              <AppSelect v-model="form.gender" label="Gender" :options="genderOptions" />
              <AppSelect v-model="form.season" label="Season" :options="seasonOptions" />
            </div>

            <div class="form-field">
              <label class="field-label">Description</label>
              <textarea v-model="form.description" class="field-input field-textarea" rows="3" />
            </div>
          </div>
        </AppCard>

        <AppCard title="Pricing & Valuation">
          <div class="form-row">
            <AppInput v-model="form.cost_price" label="Unit Cost Price (USD)" type="number" step="0.01" min="0" required />
            <AppInput v-model="form.retail_price" label="Retail Selling Price (USD)" type="number" step="0.01" min="0" required />
          </div>
        </AppCard>
      </div>

      <div class="product-form-side">
        <AppCard title="Visibility & Status">
          <AppSelect v-model="form.status" label="Catalog Status" :options="statusOptions" />
        </AppCard>

        <AppCard title="Product Image">
          <AppFileUpload v-model="form.image_url" label="Product Photo" />
        </AppCard>

        <div class="form-actions-bar">
          <AppButton type="button" variant="default" label="Cancel" :to="`/products/${id}`" />
          <AppButton type="submit" variant="primary" label="Save Changes" icon="i-heroicons-check" :loading="saving" />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Product, Category, Brand } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Edit Product — Clothing Store Admin' })

const { getProduct, updateProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  name: '',
  sku_prefix: '',
  category_id: '',
  brand_id: '',
  gender: 'UNISEX',
  season: '',
  cost_price: '',
  retail_price: '',
  description: '',
  image_url: null as string | null,
  status: 'ACTIVE',
})

const categoryOptions = computed(() => [
  { label: 'None', value: '' },
  ...categories.value.map(c => ({ label: c.name, value: c.id })),
])

const brandOptions = computed(() => [
  { label: 'None', value: '' },
  ...brands.value.map(b => ({ label: b.name, value: b.id })),
])

const genderOptions = [
  { label: 'Unisex', value: 'UNISEX' },
  { label: 'Men', value: 'MEN' },
  { label: 'Women', value: 'WOMEN' },
  { label: 'Kids', value: 'KIDS' },
]

const seasonOptions = [
  { label: 'All Season', value: '' },
  { label: 'Spring / Summer', value: 'SS' },
  { label: 'Autumn / Winter', value: 'AW' },
]

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Archived', value: 'ARCHIVED' },
]

async function handleSubmit() {
  saving.value = true
  try {
    await updateProduct(id, {
      name: form.name.trim(),
      sku_prefix: form.sku_prefix.trim().toUpperCase(),
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      gender: form.gender,
      season: form.season || null,
      cost_price: Number(form.cost_price),
      retail_price: Number(form.retail_price),
      description: form.description || null,
      image_url: form.image_url || null,
      status_code: form.status,
      status: form.status,
    })
    addToast({ type: 'success', title: 'Product updated' })
    await navigateTo(`/products/${id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [p, cats, brs] = await Promise.all([
      getProduct(id),
      listCategories(),
      listBrands(),
    ])
    product.value = p
    categories.value = cats ?? []
    brands.value = brs ?? []
    if (p) {
      Object.assign(form, {
        name: p.name,
        sku_prefix: p.sku_prefix,
        category_id: p.category_id ?? '',
        brand_id: p.brand_id ?? '',
        gender: p.gender,
        season: p.season ?? '',
        cost_price: String(p.cost_price),
        retail_price: String(p.retail_price),
        description: p.description ?? '',
        image_url: p.image_url ?? null,
        status: (p as any).status_code || p.status || 'ACTIVE',
      })
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.product-form-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 960px) {
  .product-form-layout {
    grid-template-columns: 1fr;
  }
}

.product-form-main,
.product-form-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
