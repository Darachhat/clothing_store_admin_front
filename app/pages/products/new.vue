<template>
  <div class="page-root">
    <AppPageHeader
      title="New Product"
      description="Create a master catalog product with category classification, pricing, and image media."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: 'New Product' },
      ]"
    />

    <form class="product-form-layout" @submit.prevent="handleSubmit">
      <!-- Left Column: Core Details & Pricing -->
      <div class="product-form-main">
        <AppCard title="Basic Information">
          <div class="form-grid">
            <div class="form-row">
              <AppInput
                v-model="form.name"
                label="Product Name"
                placeholder="e.g. Classic Linen Oxford Shirt"
                required
                :error="errors.name"
              />
              <AppInput
                v-model="form.sku_prefix"
                label="SKU Prefix"
                placeholder="e.g. OXF-SHIRT"
                required
                :error="errors.sku_prefix"
              />
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
              <textarea
                v-model="form.description"
                class="field-input field-textarea"
                rows="3"
                placeholder="Optional fabric composition, fit notes, and care instructions…"
              />
            </div>
          </div>
        </AppCard>

        <AppCard title="Pricing & Valuation">
          <div class="form-row">
            <AppInput
              v-model="form.cost_price"
              label="Unit Cost Price (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              :error="errors.cost_price"
            />
            <AppInput
              v-model="form.retail_price"
              label="Retail Selling Price (USD)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              :error="errors.retail_price"
            />
          </div>
        </AppCard>
      </div>

      <!-- Right Column: Status & Media -->
      <div class="product-form-side">
        <AppCard title="Visibility & Status">
          <div class="form-grid">
            <AppSelect v-model="form.status" label="Catalog Status" :options="statusOptions" />
            <p class="field-hint">
              Active products are immediately available for variant creation and POS checkout.
            </p>
          </div>
        </AppCard>

        <AppCard title="Product Image">
          <AppFileUpload v-model="form.image_url" label="Upload Photo" />
        </AppCard>

        <div class="form-actions-bar">
          <AppButton type="button" variant="default" label="Cancel" to="/products" />
          <AppButton type="submit" variant="primary" label="Create Product" icon="i-heroicons-check" :loading="saving" />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { Category, Brand } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'New Product — Clothing Store Admin' })

const { createProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { addToast } = useAppToast()

const categories = ref<Category[]>([])
const brands = ref<Brand[]>([])
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

const errors = reactive<Record<string, string>>({})

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
]

function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  if (!form.name.trim()) errors.name = 'Name is required'
  if (!form.sku_prefix.trim()) errors.sku_prefix = 'SKU prefix is required'
  if (!form.cost_price || isNaN(Number(form.cost_price))) errors.cost_price = 'Valid cost price is required'
  if (!form.retail_price || isNaN(Number(form.retail_price))) errors.retail_price = 'Valid retail price is required'
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  saving.value = true
  try {
    const product = await createProduct({
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
    })
    addToast({ type: 'success', title: 'Product created' })
    await navigateTo(`/products/${(product as any).id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [cats, brs] = await Promise.all([listCategories(), listBrands()])
  categories.value = cats ?? []
  brands.value = brs ?? []
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
