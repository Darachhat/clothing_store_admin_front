<template>
  <div class="page-root">
    <AppPageHeader
      title="Create New Product"
      description="Add an apparel product to your catalog with category, brand, procurement supplier, and main photo."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Products', to: '/products' },
        { label: 'Create New Product' },
      ]"
    >
      <template #actions>
        <AppButton to="/products" variant="default" size="sm" icon="i-heroicons-arrow-left" label="Back to Products" />
      </template>
    </AppPageHeader>

    <form class="product-form-layout" @submit.prevent="submitProduct">
      <!-- Left Column: Core Details -->
      <div class="product-form-main">
        <AppCard title="Basic Information">
          <div class="form-grid">
            <div class="form-field">
              <label class="field-label">
                Product Name <span class="required">*</span>
              </label>
              <AppInput
                v-model="form.name"
                placeholder="e.g. Classic Cotton T-Shirt, Slim Fit Denim Jeans"
                required
              />
            </div>

            <div class="form-field">
              <label class="field-label">Description</label>
              <textarea
                v-model="form.description"
                placeholder="Detailed description, fabric composition, wash & care instructions..."
                rows="3"
                class="field-input field-textarea"
              />
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Category</label>
                <AppSelect
                  v-model="form.category_id"
                  :options="categoryOptions"
                  placeholder="Select product category"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Brand</label>
                <AppSelect
                  v-model="form.brand_id"
                  :options="brandOptions"
                  placeholder="Select brand / manufacturer"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Supplier (Optional)</label>
                <AppSelect
                  v-model="form.supplier_id"
                  :options="supplierOptions"
                  placeholder="Select procurement supplier"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Status</label>
                <AppSelect
                  v-model="form.status_code"
                  :options="[
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Draft / Inactive', value: 'INACTIVE' },
                  ]"
                />
              </div>
            </div>
          </div>
        </AppCard>
      </div>

      <!-- Right Column: Photo & Actions -->
      <div class="product-form-side">
        <AppCard title="Product Main Photo">
          <AppFileUpload
            v-model="form.image_url"
            folder="products"
            hint="Upload high-res product photo (PNG, JPG, WEBP)"
          />
        </AppCard>

        <div class="form-actions-bar">
          <AppButton to="/products" variant="default" label="Cancel" />
          <AppButton
            type="submit"
            variant="primary"
            icon="i-heroicons-check"
            :loading="isSubmitting"
            label="Create Product"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProductApi, useCatalogApi, useSupplierApi } from '~/composables/useApi'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({
  middleware: ['auth'],
})

useHead({ title: 'New Product — Clothing Store Admin' })

const { createProduct } = useProductApi()
const { listCategories, listBrands } = useCatalogApi()
const { listSuppliers } = useSupplierApi()
const { addToast } = useAppToast()
const router = useRouter()

const isSubmitting = ref(false)

const categoryOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const brandOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const supplierOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])

const form = reactive({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '' as string | null,
})

async function loadDropdowns() {
  try {
    const [cats, brands, suppliers]: [any, any, any] = await Promise.all([
      listCategories(),
      listBrands(),
      listSuppliers(),
    ])

    const catItems = Array.isArray(cats) ? cats : (cats?.items || [])
    categoryOptions.value = [
      { label: 'Select product category', value: '' },
      ...catItems.map((c: any) => ({ label: c.name, value: c.id })),
    ]

    const brandItems = Array.isArray(brands) ? brands : (brands?.items || [])
    brandOptions.value = [
      { label: 'Select brand / manufacturer', value: '' },
      ...brandItems.map((b: any) => ({ label: b.name, value: b.id })),
    ]

    const supItems = Array.isArray(suppliers) ? suppliers : (suppliers?.items || [])
    supplierOptions.value = [
      { label: 'Select procurement supplier', value: '' },
      ...supItems.map((s: any) => ({ label: s.name, value: s.id })),
    ]
  } catch (err) {
    console.warn('Failed to load product creation dropdowns:', err)
  }
}

async function submitProduct() {
  if (!form.name.trim()) return
  isSubmitting.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
      status_code: form.status_code,
      image_url: form.image_url?.trim() || null,
    }

    const res: any = await createProduct(payload)
    addToast({
      title: 'Product Created',
      description: `${res?.name || form.name} was added to the catalog.`,
      color: 'green',
    })
    if (res?.id) {
      router.push(`/products/${res.id}/variants`)
    } else {
      router.push('/products')
    }
  } catch (err: any) {
    addToast({
      title: 'Failed to create product',
      description: err?.data?.detail || err?.message || 'Server error creating product',
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadDropdowns()
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
