<template>
  <form
    class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="flex flex-col gap-4">
      <!-- SECTION 1: BASIC INFORMATION -->
      <AppCard title="Section 1 — Basic Information" subtitle="Core product identity, categorization, tags, and catalog status.">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-4">
            <AppInput
              id="product-name"
              v-model="model.name"
              label="Product Name"
              placeholder="e.g. Basic Oversize T-Shirt"
              required
              :maxlength="200"
              :error="nameError"
            />
            <AppInput
              id="product-code"
              v-model="model.code"
              label="Product Code"
              placeholder="e.g. TSH-001 (Auto if blank)"
              mono
              :maxlength="64"
              hint="Used as SKU prefix (e.g. TSH-001-BLK-S)"
            />
          </div>

          <AppTextarea
            id="product-description"
            v-model="model.description"
            label="Description"
            placeholder="Detailed description, fabric composition, fit notes, wash & care instructions..."
            :rows="3"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppSelect
              id="product-category"
              v-model="model.category_id"
              label="Category"
              :options="categoryOptions"
              placeholder="Select category"
            />
            <AppSelect
              id="product-brand"
              v-model="model.brand_id"
              label="Brand"
              :options="brandOptions"
              placeholder="Select brand"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AppSelect
              id="product-supplier"
              v-model="model.supplier_id"
              label="Supplier (Optional)"
              :options="supplierOptions"
              placeholder="Select supplier"
            />
            <AppSelect
              id="product-status"
              v-model="model.status_code"
              label="Product Status"
              :options="PRODUCT_STATUS_OPTIONS"
            />
          </div>

          <!-- Tags -->
          <div class="flex flex-col gap-1.5">
            <label for="product-tag-input" class="text-sm text-ink-secondary">Tags</label>
            <div class="flex flex-wrap items-center gap-1.5 rounded-lg border border-border-default bg-surface-card p-2">
              <span
                v-for="(tag, idx) in model.tags"
                :key="`${tag}-${idx}`"
                class="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-inset px-2 py-0.5 text-xs font-medium text-ink"
              >
                <span>{{ tag }}</span>
                <button
                  type="button"
                  class="text-ink-tertiary hover:text-ink"
                  :aria-label="`Remove tag ${tag}`"
                  @click="removeTag(idx)"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>
              </span>
              <input
                id="product-tag-input"
                v-model="tagInput"
                type="text"
                class="flex-1 min-w-[160px] bg-transparent text-xs text-ink placeholder:text-ink-tertiary focus:outline-none py-0.5 px-1"
                placeholder="Type tag & press Enter or comma (e.g. streetwear, bestseller)..."
                @keydown.enter.prevent="commitTagInput"
                @keydown.,.prevent="commitTagInput"
                @blur="commitTagInput"
              />
            </div>
          </div>
        </div>
      </AppCard>

      <!-- SECTION 3: DYNAMIC PRODUCT ATTRIBUTES -->
      <AppCard
        title="Section 3 — Product Attributes"
        subtitle="Configurable garment attributes loaded dynamically from the catalog schema."
      >
        <template #actions>
          <AppButton
            type="button"
            size="xs"
            variant="default"
            icon="i-heroicons-plus"
            label="New Attribute"
            @click="showNewAttrForm = !showNewAttrForm"
          />
        </template>

        <div class="flex flex-col gap-4">
          <!-- Inline Quick-Create Attribute -->
          <div
            v-if="showNewAttrForm"
            class="rounded-lg border border-border-subtle bg-surface-inset p-3 flex flex-col gap-3"
          >
            <div class="text-xs font-semibold text-ink">Create Configurable Attribute</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AppInput
                id="new-attr-display-name"
                v-model="newAttrDisplayName"
                label="Attribute Display Name"
                placeholder="e.g. Neckline, Sleeve Length"
              />
              <AppInput
                id="new-attr-first-value"
                v-model="newAttrFirstValue"
                label="Initial Option Value (Optional)"
                placeholder="e.g. Crew Neck, Short Sleeve"
              />
            </div>
            <div class="flex justify-end gap-2">
              <AppButton type="button" size="xs" variant="ghost" label="Cancel" @click="showNewAttrForm = false" />
              <AppButton
                type="button"
                size="xs"
                variant="primary"
                icon="i-heroicons-check"
                label="Save Attribute"
                :loading="creatingAttr"
                @click="handleCreateAttribute"
              />
            </div>
          </div>

          <div v-if="loadingAttributes" class="text-xs text-ink-secondary py-2 flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
            <span>Loading configurable attributes...</span>
          </div>

          <div v-else-if="attributes.length === 0" class="text-xs text-ink-tertiary py-2">
            No product attributes configured yet. Click "New Attribute" to add one.
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="attr in attributes"
              :key="attr.id"
              class="rounded-lg border border-border-subtle bg-surface-card p-3 flex flex-col gap-2"
            >
              <div class="flex items-center justify-between">
                <label class="text-xs font-semibold text-ink uppercase tracking-wider">
                  {{ attr.display_name }}
                </label>
                <button
                  type="button"
                  class="text-[11px] text-ink-secondary hover:text-ink inline-flex items-center gap-0.5"
                  @click="toggleAddValueInput(attr.id)"
                >
                  <UIcon name="i-heroicons-plus" class="w-3 h-3" />
                  <span>Add option</span>
                </button>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="val in attr.values"
                  :key="val.id"
                  type="button"
                  class="px-2.5 py-1 rounded-md text-xs font-medium border transition-colors"
                  :class="isAttributeValueSelected(val.id)
                    ? 'bg-ink text-white border-border-default'
                    : 'bg-surface-inset text-ink-secondary border-border-subtle hover:text-ink'"
                  @click="toggleAttributeValue(attr.id, val.id)"
                >
                  {{ val.display_value }}
                </button>
                <span v-if="!attr.values || attr.values.length === 0" class="text-xs text-ink-tertiary italic">
                  No options yet
                </span>
              </div>

              <!-- Quick add value for this attribute -->
              <div v-if="addingValueForAttr === attr.id" class="flex items-center gap-1.5 pt-1">
                <AppInput
                  :id="`add-val-${attr.id}`"
                  v-model="newValueText"
                  class="flex-1"
                  placeholder="New option (e.g. Linen)"
                  @keydown.enter.prevent="handleAddAttributeValue(attr.id)"
                />
                <AppButton
                  type="button"
                  size="xs"
                  variant="primary"
                  icon="i-heroicons-check"
                  label="Add"
                  :loading="savingAttrValue"
                  @click="handleAddAttributeValue(attr.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Slot for Section 4 (Variant Generator) & Section 5 (Pricing) -->
      <slot />
    </div>

    <!-- RIGHT COLUMN: SECTION 2 — PRODUCT IMAGES & ACTIONS -->
    <div class="flex flex-col gap-4">
      <AppCard
        title="Section 2 — Product Images"
        subtitle="Upload multiple images, set primary cover, and reorder gallery."
      >
        <div class="flex flex-col gap-3">
          <!-- Multi-file Dropzone -->
          <div
            class="flex flex-col items-center justify-center p-4 bg-surface-inset border border-dashed border-border-default rounded-lg cursor-pointer hover:bg-surface-hover transition-colors text-center"
            @dragover.prevent
            @drop.prevent="onDropFiles"
            @click="triggerMultiFileInput"
          >
            <input
              ref="multiFileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onSelectMultiFiles"
            />
            <div v-if="isUploading" class="flex items-center gap-2 text-xs text-ink-secondary py-2">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>Uploading image... {{ uploadProgress }}%</span>
            </div>
            <div v-else class="flex flex-col items-center gap-1">
              <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-ink-secondary" />
              <div class="text-xs font-medium text-ink">Click or drop images here</div>
              <div class="text-[11px] text-ink-tertiary">PNG, JPG, WEBP — multiple files supported</div>
            </div>
          </div>

          <!-- Add by Image URL -->
          <div class="flex items-center gap-1.5">
            <AppInput
              id="manual-image-url"
              v-model="manualImageUrl"
              class="flex-1"
              placeholder="Or paste image URL..."
              @keydown.enter.prevent="addManualImageUrl"
            />
            <AppButton
              type="button"
              size="xs"
              variant="default"
              icon="i-heroicons-plus"
              label="Add"
              @click="addManualImageUrl"
            />
          </div>

          <!-- Gallery List -->
          <div v-if="galleryList.length > 0" class="flex flex-col gap-2 pt-1">
            <div
              v-for="(img, idx) in galleryList"
              :key="`${img.image_url}-${idx}`"
              class="flex items-center gap-2.5 p-2 rounded-lg border border-border-subtle bg-surface-card"
            >
              <img
                :src="img.image_url"
                alt="Product gallery preview"
                class="w-12 h-12 rounded-md border border-border-subtle object-cover shrink-0 bg-surface-inset"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <span
                    v-if="img.is_primary"
                    class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-ink text-white"
                  >
                    Primary
                  </span>
                  <button
                    v-else
                    type="button"
                    class="text-[11px] text-ink-secondary hover:text-ink underline"
                    @click="setPrimaryImage(idx)"
                  >
                    Set as Primary
                  </button>
                </div>
                <div class="text-[11px] text-ink-tertiary truncate mono mt-0.5">
                  #{{ idx + 1 }} · {{ shortFilename(img.image_url) }}
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  class="p-1 rounded border border-border-subtle text-ink-secondary hover:text-ink disabled:opacity-30"
                  :disabled="idx === 0"
                  title="Move up"
                  @click="moveImage(idx, -1)"
                >
                  <UIcon name="i-heroicons-chevron-up" class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded border border-border-subtle text-ink-secondary hover:text-ink disabled:opacity-30"
                  :disabled="idx === galleryList.length - 1"
                  title="Move down"
                  @click="moveImage(idx, 1)"
                >
                  <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded border border-border-subtle text-ink-secondary hover:text-ink"
                  title="Remove image"
                  @click="removeImage(idx)"
                >
                  <UIcon name="i-heroicons-trash" class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-ink-tertiary m-0 text-center py-2">
            No images uploaded yet.
          </p>
        </div>
      </AppCard>

      <div class="flex flex-col gap-2">
        <slot name="actions" />
        <div class="flex justify-end gap-2">
          <AppButton type="button" variant="default" label="Cancel" :to="cancelTo" />
          <AppButton
            type="submit"
            :variant="primarySubmit ? 'primary' : 'secondary'"
            icon="i-heroicons-check"
            :loading="submitting"
            :label="submitLabel"
          />
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import type { SelectOption, ProductAttribute } from '~/types'
import { useUpload } from '~/composables/useUpload'

export interface ProductGalleryImageInput {
  id?: string
  image_url: string
  variant_id?: string | null
  is_primary: boolean
  sort_order: number
}

export interface ProductFormState {
  name: string
  code?: string
  description: string
  category_id: string
  brand_id: string
  supplier_id: string
  status_code: string
  image_url: string | null
  tags?: string[]
  images?: ProductGalleryImageInput[]
  attribute_value_ids?: string[]
}

const PRODUCT_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive (Draft)', value: 'INACTIVE' },
  { label: 'Discontinued (Archived)', value: 'DISCONTINUED' },
]

withDefaults(defineProps<{
  submitting?: boolean
  submitLabel?: string
  cancelTo: string
  primarySubmit?: boolean
}>(), {
  submitLabel: 'Save',
  primarySubmit: true,
})

const emit = defineEmits<{ submit: [] }>()
const model = defineModel<ProductFormState>({ required: true })

const { listCategories, listBrands } = useCatalogApi()
const { listSuppliers } = useSupplierApi()
const { listProductAttributes, createProductAttribute, addProductAttributeValue } = useProductApi()
const { uploadFile, isUploading, uploadProgress } = useUpload()
const { addToast } = useAppToast()

const categoryOptions = ref<SelectOption[]>([])
const brandOptions = ref<SelectOption[]>([])
const supplierOptions = ref<SelectOption[]>([])
const attributes = ref<ProductAttribute[]>([])
const loadingAttributes = ref(false)

// Tags state
const tagInput = ref('')

function ensureArrays() {
  if (!Array.isArray(model.value.tags)) model.value.tags = []
  if (!Array.isArray(model.value.images)) model.value.images = []
  if (!Array.isArray(model.value.attribute_value_ids)) model.value.attribute_value_ids = []
}

function commitTagInput() {
  ensureArrays()
  const raw = tagInput.value.trim().replace(/,+$/, '')
  if (!raw) return
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean)
  for (const part of parts) {
    if (!model.value.tags!.includes(part)) {
      model.value.tags!.push(part)
    }
  }
  tagInput.value = ''
}

function removeTag(idx: number) {
  ensureArrays()
  model.value.tags!.splice(idx, 1)
}

// Dynamic Attributes state
const showNewAttrForm = ref(false)
const newAttrDisplayName = ref('')
const newAttrFirstValue = ref('')
const creatingAttr = ref(false)

const addingValueForAttr = ref<string | null>(null)
const newValueText = ref('')
const savingAttrValue = ref(false)

function isAttributeValueSelected(valId: string): boolean {
  return Array.isArray(model.value.attribute_value_ids) && model.value.attribute_value_ids.includes(valId)
}

function toggleAttributeValue(_attrId: string, valId: string) {
  ensureArrays()
  const list = model.value.attribute_value_ids!
  const idx = list.indexOf(valId)
  if (idx >= 0) {
    list.splice(idx, 1)
  } else {
    list.push(valId)
  }
}

function toggleAddValueInput(attrId: string) {
  if (addingValueForAttr.value === attrId) {
    addingValueForAttr.value = null
    newValueText.value = ''
  } else {
    addingValueForAttr.value = attrId
    newValueText.value = ''
  }
}

async function handleCreateAttribute() {
  const displayName = newAttrDisplayName.value.trim()
  if (!displayName) return
  creatingAttr.value = true
  try {
    const slugName = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const created = await createProductAttribute({
      name: slugName || 'custom_attr',
      display_name: displayName,
      attribute_type: 'SELECT',
      sort_order: attributes.value.length + 1,
    })
    if (newAttrFirstValue.value.trim() && created?.id) {
      const valText = newAttrFirstValue.value.trim()
      await addProductAttributeValue(created.id, {
        value: valText.toUpperCase().replace(/[^A-Z0-9]+/g, '_'),
        display_value: valText,
        sort_order: 1,
      })
    }
    const fresh = await listProductAttributes()
    attributes.value = Array.isArray(fresh) ? fresh : []
    newAttrDisplayName.value = ''
    newAttrFirstValue.value = ''
    showNewAttrForm.value = false
    addToast({ type: 'success', title: 'Attribute created', message: `${displayName} is now available.` })
  } catch (e: any) {
    addToast({ type: 'error', title: 'Failed to create attribute', message: e?.data?.detail ?? String(e) })
  } finally {
    creatingAttr.value = false
  }
}

async function handleAddAttributeValue(attrId: string) {
  const text = newValueText.value.trim()
  if (!text) return
  savingAttrValue.value = true
  try {
    const code = text.toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    const createdVal = await addProductAttributeValue(attrId, {
      value: code || text,
      display_value: text,
      sort_order: 10,
    })
    const fresh = await listProductAttributes()
    attributes.value = Array.isArray(fresh) ? fresh : []
    if (createdVal?.id) {
      ensureArrays()
      if (!model.value.attribute_value_ids!.includes(createdVal.id)) {
        model.value.attribute_value_ids!.push(createdVal.id)
      }
    }
    newValueText.value = ''
    addingValueForAttr.value = null
  } catch (e: any) {
    addToast({ type: 'error', title: 'Could not add option', message: e?.data?.detail ?? String(e) })
  } finally {
    savingAttrValue.value = false
  }
}

// Multi-image gallery state
const multiFileInputRef = ref<HTMLInputElement | null>(null)
const manualImageUrl = ref('')

const galleryList = computed<ProductGalleryImageInput[]>(() => model.value.images || [])

function syncPrimaryUrl() {
  ensureArrays()
  const imgs = model.value.images!
  if (imgs.length === 0) {
    model.value.image_url = null
    return
  }
  if (!imgs.some(i => i.is_primary)) {
    imgs[0]!.is_primary = true
  }
  imgs.forEach((img, idx) => {
    img.sort_order = idx
  })
  const primary = imgs.find(i => i.is_primary) || imgs[0]
  model.value.image_url = primary ? primary.image_url : null
}

function appendGalleryImage(url: string) {
  const clean = url.trim()
  if (!clean) return
  ensureArrays()
  const imgs = model.value.images!
  if (imgs.some(i => i.image_url === clean)) return
  imgs.push({
    image_url: clean,
    is_primary: imgs.length === 0,
    sort_order: imgs.length,
  })
  syncPrimaryUrl()
}

function triggerMultiFileInput() {
  if (!isUploading.value) {
    multiFileInputRef.value?.click()
  }
}

async function onSelectMultiFiles(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.length) return
  const files = Array.from(input.files)
  for (const file of files) {
    const res = await uploadFile(file, 'products')
    if (res?.url) {
      appendGalleryImage(res.url)
    }
  }
  input.value = ''
}

async function onDropFiles(e: DragEvent) {
  if (!e.dataTransfer?.files?.length) return
  const files = Array.from(e.dataTransfer.files)
  for (const file of files) {
    const res = await uploadFile(file, 'products')
    if (res?.url) {
      appendGalleryImage(res.url)
    }
  }
}

function addManualImageUrl() {
  if (!manualImageUrl.value.trim()) return
  appendGalleryImage(manualImageUrl.value)
  manualImageUrl.value = ''
}

function setPrimaryImage(idx: number) {
  ensureArrays()
  model.value.images!.forEach((img, i) => {
    img.is_primary = i === idx
  })
  syncPrimaryUrl()
}

function moveImage(idx: number, delta: number) {
  ensureArrays()
  const imgs = model.value.images!
  const target = idx + delta
  if (target < 0 || target >= imgs.length) return
  const [item] = imgs.splice(idx, 1)
  if (item) {
    imgs.splice(target, 0, item)
    syncPrimaryUrl()
  }
}

function removeImage(idx: number) {
  ensureArrays()
  model.value.images!.splice(idx, 1)
  syncPrimaryUrl()
}

function shortFilename(url: string): string {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] || url)
  } catch {
    return url
  }
}

const touched = ref(false)
const nameError = computed(() =>
  touched.value && !model.value.name.trim() ? 'Product name is required' : undefined,
)

function toItems(res: any): any[] {
  return Array.isArray(res) ? res : (res?.items ?? [])
}

function toOptions(res: any): SelectOption[] {
  return toItems(res).map((i: any) => ({ label: i.name, value: i.id }))
}

function onSubmit() {
  touched.value = true
  commitTagInput()
  if (!model.value.name.trim()) return
  emit('submit')
}

function validate(): boolean {
  touched.value = true
  commitTagInput()
  return !!model.value.name.trim()
}
defineExpose({ validate })

onMounted(async () => {
  ensureArrays()
  if (model.value.image_url && (!model.value.images || model.value.images.length === 0)) {
    appendGalleryImage(model.value.image_url)
  }
  loadingAttributes.value = true
  const [cats, brands, suppliers, attrs] = await Promise.all([
    listCategories().catch(() => []),
    listBrands().catch(() => []),
    listSuppliers().catch(() => []),
    listProductAttributes().catch(() => []),
  ])
  categoryOptions.value = toOptions(cats)
  brandOptions.value = toOptions(brands)
  supplierOptions.value = toOptions(suppliers)
  attributes.value = Array.isArray(attrs) ? attrs : []
  loadingAttributes.value = false
})
</script>
