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

    <div v-if="loading" class="state-card" role="status">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
      <span>Loading product…</span>
    </div>

    <template v-else-if="product">
      <ProductForm
        v-model="form"
        :cancel-to="`/products/${id}`"
        submit-label="Save Changes"
        :submitting="saving"
        @submit="save"
      />
    </template>

    <AppErrorState
      v-else
      title="Product not found"
      :message="loadError || 'The requested product could not be loaded.'"
      @retry="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/types'
import type { ProductFormState } from '~/components/modules/catalog/ProductForm.vue'

definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const id = route.params.id as string
useHead({ title: 'Edit Product — KVC Clothing Store Admin' })

const { getProduct, updateProduct } = useProductApi()
const { addToast } = useAppToast()

const product = ref<Product | null>(null)
const loading = ref(true)
const saving = ref(false)
const loadError = ref('')

const form = ref<ProductFormState>({
  name: '',
  code: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '',
  tags: [],
  images: [],
  attribute_value_ids: [],
})
const snapshot = ref('')

const isDirty = computed(() => !!product.value && JSON.stringify(form.value) !== snapshot.value)

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const f = form.value
    await updateProduct(id, {
      name: f.name.trim(),
      code: f.code?.trim() || null,
      description: f.description?.trim() || null,
      category_id: f.category_id || null,
      brand_id: f.brand_id || null,
      supplier_id: f.supplier_id || null,
      image_url: f.image_url || null,
      status_code: f.status_code,
      tags: f.tags || [],
      images: (f.images || []).map((img, idx) => ({
        image_url: img.image_url,
        variant_id: img.variant_id || null,
        is_primary: img.is_primary,
        sort_order: idx,
      })),
      attribute_value_ids: f.attribute_value_ids || [],
    })
    snapshot.value = JSON.stringify(form.value)
    addToast({ type: 'success', title: 'Product updated' })
    await navigateTo(`/products/${id}`)
  } catch (e: any) {
    addToast({ type: 'error', title: 'Update failed', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const p = (await getProduct(id)) as Product
    product.value = p
    const loadedImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images.map((img, idx) => ({
          id: img.id,
          image_url: img.image_url,
          variant_id: img.variant_id ?? null,
          is_primary: img.is_primary,
          sort_order: img.sort_order ?? idx,
        }))
      : (p.image_url ? [{ image_url: p.image_url, is_primary: true, sort_order: 0 }] : [])

    const loadedAttrIds = Array.isArray(p.attribute_assignments)
      ? p.attribute_assignments.map(a => a.attribute_value_id).filter(Boolean)
      : []

    form.value = {
      name: p.name,
      code: p.code ?? '',
      description: p.description ?? '',
      category_id: p.category_id ?? '',
      brand_id: p.brand_id ?? '',
      supplier_id: (p as any).supplier_id ?? '',
      status_code: (p as any).status_code || p.status || 'ACTIVE',
      image_url: p.image_url ?? '',
      tags: Array.isArray(p.tags) ? [...p.tags] : [],
      images: loadedImages,
      attribute_value_ids: loadedAttrIds,
    }
    snapshot.value = JSON.stringify(form.value)
  } catch (e: any) {
    product.value = null
    loadError.value = e?.data?.detail ?? e?.message ?? ''
  } finally {
    loading.value = false
  }
}

onBeforeRouteLeave(() => {
  if (isDirty.value && !saving.value) {
    return window.confirm('You have unsaved changes. Leave this page without saving?')
  }
})

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
  loadData()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>
