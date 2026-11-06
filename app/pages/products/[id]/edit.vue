<template>
  <div class="page-root">
    <AppPageHeader
      title="Edit Product"
      :description="product ? `Editing ${product.name} (${product.code || product.sku_prefix || ''})` : 'Loading product...'"
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: product?.name || 'Product', to: `/products/${id}` },
        { label: 'Edit' },
      ]"
    >
      <template #actions>
        <AppButton :to="`/products/${id}`" variant="default" size="sm" icon="i-heroicons-arrow-left" label="Back to Product" />
      </template>
    </AppPageHeader>

    <div v-if="loading" class="state-card">Loading product…</div>

    <form v-else-if="product" class="product-form-layout" @submit.prevent="save">
      <div class="product-form-main">
        <AppCard title="Basic Information">
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">Product Name <span class="required">*</span></label>
              <input v-model="form.name" class="field-input" required />
            </div>

            <div class="form-field">
              <label class="field-label">Description</label>
              <textarea v-model="form.description" class="field-input field-textarea" rows="4" />
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Category</label>
                <AppSelect v-model="form.category_id" :options="categoryOptions" placeholder="Select category" />
              </div>
              <div class="form-field">
                <label class="field-label">Brand</label>
                <AppSelect v-model="form.brand_id" :options="brandOptions" placeholder="Select brand" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Supplier</label>
                <AppSelect v-model="form.supplier_id" :options="supplierOptions" placeholder="Select supplier" />
              </div>
              <div class="form-field">
                <label class="field-label">Status</label>
                <AppSelect v-model="form.status" :options="statusOptions" />
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <div class="product-form-side">
        <AppCard title="Product Photo">
          <AppFileUpload
            v-model="form.image_url"
            folder="products"
            label="Product Main Photo"
            hint="Upload high-res product photo (PNG, JPG, WEBP)"
          />
        </AppCard>

        <div class="form-actions-bar">
          <AppButton type="button" variant="default" label="Cancel" :to="`/products/${id}`" />
          <AppButton type="submit" variant="primary" label="Save Changes" icon="i-heroicons-check" :loading="saving" />
        </div>
      </div>
    </form>

    <div v-else class="state-card">Product not found.</div>
  </div>
</template>

<script setup lang="ts">
import type { Product, Category, Brand, Supplier } from '~/types'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Edit Product — Clothing Store Admin' })

const { getProduct, updateProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { listSuppliers } = useSupplierApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  image_url: '' as string | null,
  status: 'ACTIVE',
})

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Discontinued', value: 'DISCONTINUED' },
]

const categoryOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const brandOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const supplierOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])

async function save() {
  saving.value = true
  try {
    await updateProduct(id, {
      name: form.name.trim(),
      description: form.description || null,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
      image_url: form.image_url || null,
      status_code: form.status,
      status: form.status,
    })
    addToast({ type: 'success', title: 'Product updated' })
    await navigateTo(`/products/${id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Update failed', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [rawProduct, cats, brands, suppliers] = await Promise.all([
      getProduct(id),
      listCategories(),
      listBrands(),
      listSuppliers(),
    ])
    const p = rawProduct as Product
    product.value = p
    if (p) {
      Object.assign(form, {
        name: p.name,
        description: p.description ?? '',
        category_id: p.category_id ?? '',
        brand_id: p.brand_id ?? '',
        supplier_id: p.supplier_id ?? '',
        image_url: p.image_url ?? '',
        status: (p as any).status_code || p.status || 'ACTIVE',
      })
    }
    const catList = Array.isArray(cats) ? cats : ((cats as any)?.items || [])
    const brandList = Array.isArray(brands) ? brands : ((brands as any)?.items || [])
    const supList = Array.isArray(suppliers) ? suppliers : ((suppliers as any)?.items || [])
    categoryOptions.value = [{ label: 'None', value: '' }, ...(catList as Category[]).map(c => ({ label: c.name, value: c.id }))]
    brandOptions.value = [{ label: 'None', value: '' }, ...(brandList as Brand[]).map(b => ({ label: b.name, value: b.id }))]
    supplierOptions.value = [{ label: 'None', value: '' }, ...(supList as Supplier[]).map(s => ({ label: s.name, value: s.id }))]
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
