<template>
  <div class="page-root">
    <AppPageHeader
      title="Create New Product"
      description="Add an apparel product with initial pricing, stock, and barcode so you can immediately print thermal stickers and scan on Cashier POS."
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

    <form class="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 items-start" @submit.prevent="submitProduct(false)">
      <!-- Left Column: Core Details + Initial Variant -->
      <div class="flex flex-col gap-4">
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

        <!-- One-Stop Initial Variant, Barcode & Opening Stock -->
        <AppCard
          title="Initial Variant, Pricing & Barcode (Ready for Sticker & POS)"
          subtitle="Create the first SKU/barcode and opening stock right away so stickers can be printed immediately"
        >
          <template #actions>
            <label class="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input v-model="includeInitialVariant" type="checkbox" />
              <span>Create initial variant now</span>
            </label>
          </template>

          <div v-if="includeInitialVariant" class="form-grid">
            <div class="form-row">
              <div class="form-field">
                <label class="field-label">
                  Selling Price (USD) <span class="required">*</span>
                </label>
                <input
                  v-model="initialVariant.selling_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  required
                  class="field-input mono"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Cost Price (USD)</label>
                <input
                  v-model="initialVariant.cost_price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  class="field-input mono"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Color (Optional)</label>
                <AppSelect
                  v-model="initialVariant.color_id"
                  :options="colorOptions"
                  placeholder="Default / All Colors"
                />
              </div>

              <div class="form-field">
                <label class="field-label">Size (Optional)</label>
                <AppSelect
                  v-model="initialVariant.size_id"
                  :options="sizeOptions"
                  placeholder="Free Size / Default"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-field">
                <label class="field-label">Opening Stock Quantity (Units)</label>
                <input
                  v-model.number="initialVariant.initial_stock"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="10"
                  class="field-input mono"
                />
                <span class="field-hint">Automatically stocks the default warehouse so POS can scan &amp; sell immediately.</span>
              </div>

              <div class="form-field">
                <label class="field-label">Barcode (Auto-generated if blank)</label>
                <div class="flex gap-2">
                  <input
                    v-model="initialVariant.barcode"
                    type="text"
                    placeholder="Auto 10-digit Code-128 (or scan existing tag)"
                    data-barcode-scanner-target="true"
                    class="field-input flex-1 mono"
                  />
                  <AppButton
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon="i-heroicons-qr-code"
                    label="Scan"
                    @click="showScannerModal = true"
                  />
                </div>
                <span class="field-hint">Leave blank to auto-generate a compact 10-digit barcode for thermal stickers.</span>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-slate-500 py-2">
            You can add multiple color and size variants on the next screen after creating the product.
          </div>
        </AppCard>
      </div>

      <!-- Right Column: Photo & Actions -->
      <div class="flex flex-col gap-4">
        <AppCard title="Product Main Photo">
          <AppFileUpload
            v-model="form.image_url"
            folder="products"
            hint="Upload high-res product photo (PNG, JPG, WEBP)"
          />
        </AppCard>

        <div class="flex flex-col gap-2">
          <AppButton
            v-if="includeInitialVariant"
            type="button"
            variant="primary"
            icon="i-heroicons-printer"
            :loading="isSubmitting && printAfterCreate"
            label="Create & Print Sticker"
            class="w-full justify-center"
            @click="submitProduct(true)"
          />
          <div class="flex justify-end gap-2">
            <AppButton to="/products" variant="default" label="Cancel" />
            <AppButton
              type="submit"
              :variant="includeInitialVariant ? 'secondary' : 'primary'"
              icon="i-heroicons-check"
              :loading="isSubmitting && !printAfterCreate"
              label="Create Product"
            />
          </div>
        </div>
      </div>
    </form>

    <BarcodeScannerModal
      v-model="showScannerModal"
      :auto-close-on-scan="true"
      @scanned="(code: string) => { initialVariant.barcode = code }"
    />
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
const { listCategories, listBrands, listColors, listSizes } = useCatalogApi()
const { listSuppliers } = useSupplierApi()
const { addToast } = useAppToast()
const router = useRouter()

const isSubmitting = ref(false)
const printAfterCreate = ref(false)
const includeInitialVariant = ref(true)
const showScannerModal = ref(false)

const categoryOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const brandOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const supplierOptions = ref<{ label: string; value: string }[]>([{ label: 'None', value: '' }])
const colorOptions = ref<{ label: string; value: string }[]>([{ label: 'Default / Any Color', value: '' }])
const sizeOptions = ref<{ label: string; value: string }[]>([{ label: 'Free Size / Default', value: '' }])

const form = reactive({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  status_code: 'ACTIVE',
  image_url: '' as string | null,
})

const initialVariant = reactive({
  selling_price: '10.00',
  cost_price: '0.00',
  color_id: '',
  size_id: '',
  initial_stock: 10,
  barcode: '',
})

async function loadDropdowns() {
  try {
    const [cats, brands, suppliers, colors, sizes]: [any, any, any, any, any] = await Promise.all([
      listCategories(),
      listBrands(),
      listSuppliers(),
      listColors(),
      listSizes(),
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

    const colItems = Array.isArray(colors) ? colors : (colors?.items || [])
    colorOptions.value = [
      { label: 'Default / Any Color', value: '' },
      ...colItems.map((c: any) => ({ label: c.name, value: c.id })),
    ]

    const sizeItems = Array.isArray(sizes) ? sizes : (sizes?.items || [])
    sizeOptions.value = [
      { label: 'Free Size / Default', value: '' },
      ...sizeItems.map((s: any) => ({ label: s.name, value: s.id })),
    ]
  } catch (err) {
    console.warn('Failed to load product creation dropdowns:', err)
  }
}

async function submitProduct(shouldPrintSticker = false) {
  if (!form.name.trim()) return
  if (includeInitialVariant.value && (!initialVariant.selling_price || Number(initialVariant.selling_price) <= 0)) {
    addToast({
      title: 'Selling Price Required',
      description: 'Please enter a selling price greater than $0.00 for the initial variant.',
      color: 'amber',
    })
    return
  }

  isSubmitting.value = true
  printAfterCreate.value = shouldPrintSticker
  try {
    const payload: Record<string, any> = {
      name: form.name.trim(),
      description: form.description?.trim() || null,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      supplier_id: form.supplier_id || null,
      status_code: form.status_code,
      image_url: form.image_url?.trim() || null,
    }

    if (includeInitialVariant.value) {
      payload.initial_variant = {
        selling_price: Number(initialVariant.selling_price),
        cost_price: Number(initialVariant.cost_price || 0),
        color_id: initialVariant.color_id || null,
        size_id: initialVariant.size_id || null,
        initial_stock: Math.max(0, Number(initialVariant.initial_stock) || 0),
        barcode: initialVariant.barcode?.trim() || null,
      }
    }

    const res: any = await createProduct(payload)
    const createdVariant = res?.variants?.[0]

    addToast({
      title: 'Product Created',
      description: createdVariant
        ? `${res?.name || form.name} (${createdVariant.sku}) is ready to print & scan.`
        : `${res?.name || form.name} was added to the catalog.`,
      color: 'green',
    })

    if (res?.id) {
      if (shouldPrintSticker && createdVariant?.id) {
        const copies = Math.max(1, Number(initialVariant.initial_stock) || 1)
        router.push(`/products/${res.id}/variants?print_variant=${createdVariant.id}&copies=${copies}`)
      } else {
        router.push(`/products/${res.id}/variants`)
      }
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
    printAfterCreate.value = false
  }
}

onMounted(() => {
  loadDropdowns()
})
</script>

