<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="flex items-center gap-3">
      <AppButton
        to="/products"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        label="Back to Products"
      />
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Create New Product</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Add an apparel product to your catalog</p>
      </div>
    </div>

    <AppCard>
      <form class="space-y-5" @submit.prevent="submitProduct">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Product Name <span class="text-red-500">*</span>
          </label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Classic Cotton T-Shirt, Slim Fit Denim Jeans"
            size="lg"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            v-model="form.description"
            placeholder="Detailed description, fabric composition, wash & care instructions..."
            rows="3"
            class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <AppSelect
              v-model="form.category_id"
              :options="categoryOptions"
              placeholder="Select product category"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Brand
            </label>
            <AppSelect
              v-model="form.brand_id"
              :options="brandOptions"
              placeholder="Select brand / manufacturer"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Supplier (Optional)
            </label>
            <AppSelect
              v-model="form.supplier_id"
              :options="supplierOptions"
              placeholder="Select procurement supplier"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <AppSelect
              v-model="form.status_code"
              :options="[
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Draft / Inactive', value: 'INACTIVE' }
              ]"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Product Main Photo
          </label>
          <AppFileUpload
            v-model="form.image_url"
            folder="products"
            hint="Upload high-res product photo (PNG, JPG, WEBP)"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <AppButton
            to="/products"
            variant="ghost"
            label="Cancel"
          />
          <AppButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
            label="Create Product"
          />
        </div>
      </form>
    </AppCard>
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

const categoryOptions = ref<{ label: string; value: string }[]>([])
const brandOptions = ref<{ label: string; value: string }[]>([])
const supplierOptions = ref<{ label: string; value: string }[]>([])

const form = reactive({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '',
})

async function loadDropdowns() {
  try {
    const [cats, brands, suppliers]: [any, any, any] = await Promise.all([
      listCategories(),
      listBrands(),
      listSuppliers(),
    ])

    const catItems = Array.isArray(cats) ? cats : (cats?.items || [])
    categoryOptions.value = catItems.map((c: any) => ({ label: c.name, value: c.id }))

    const brandItems = Array.isArray(brands) ? brands : (brands?.items || [])
    brandOptions.value = brandItems.map((b: any) => ({ label: b.name, value: b.id }))

    const supItems = Array.isArray(suppliers) ? suppliers : (suppliers?.items || [])
    supplierOptions.value = supItems.map((s: any) => ({ label: s.name, value: s.id }))
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
    // Navigate to variants configuration for the new product
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
