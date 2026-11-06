<template>
  <div class="page-root">
    <AppPageHeader
      title="Brands"
      description="Manage clothing brands, manufacturer codes, and brand logos."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Brands' },
      ]"
      primary-label="Add Brand"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreate"
    />

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search brands by name or code..."
      :shown-count="filteredBrands.length"
      :total-count="brands.length"
      count-label="brands"
      @clear-all="searchQuery = ''"
    />

    <AppCard :no-pad="true">
      <AppTable :columns="columns" :rows="filteredBrands" :loading="loading" empty-text="No brands found.">
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2.5">
            <img
              v-if="row.logo_url"
              :src="row.logo_url"
              :alt="row.name"
              class="w-7 h-7 rounded object-contain border border-gray-200 bg-gray-50"
            />
            <span class="font-semibold text-gray-900">{{ row.name }}</span>
          </div>
        </template>
        <template #cell-code="{ value }">
          <code class="mono font-semibold">{{ value }}</code>
        </template>
        <template #actions="{ row }">
          <AppButton size="xs" variant="ghost" label="Edit" @click="openEdit(row)" />
          <AppButton size="xs" variant="danger" label="Delete" @click="confirmDelete(row)" />
        </template>
      </AppTable>
    </AppCard>

    <AppModal v-model="showModal" :title="editTarget ? 'Edit Brand' : 'New Brand'" size="sm">
      <form class="form-grid" @submit.prevent="save">
        <div class="form-field">
          <label class="field-label">Name <span class="required">*</span></label>
          <input v-model="form.name" class="field-input" placeholder="e.g. Nike" required />
        </div>
        <div class="form-field">
          <label class="field-label">Code <span class="required">*</span></label>
          <input v-model="form.code" class="field-input mono uppercase" placeholder="e.g. NIKE" required />
        </div>
        <div class="form-field">
          <label class="field-label">Logo URL</label>
          <input v-model="form.logo_url" class="field-input" placeholder="https://…" />
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" label="Save Brand" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <AppConfirmDialog
      v-model="showDelete"
      title="Delete Brand"
      variant="danger"
      confirm-label="Delete Brand"
      :loading="deleting"
      :message="`Are you sure you want to delete brand &quot;${deleteTarget?.name}&quot;?`"
      consequence="Products associated with this brand will have their brand cleared."
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Brand } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Brands — Clothing Store Admin' })

const { listBrands, createBrand, updateBrand, deleteBrand } = useCatalogApi()
const { addToast } = useAppToast()

const brands = ref<Brand[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const showModal = ref(false)
const editTarget = ref<Brand | null>(null)
const showDelete = ref(false)
const deleteTarget = ref<Brand | null>(null)

const form = reactive({ name: '', code: '', logo_url: '' })

const columns = [
  { key: 'name', label: 'Brand Name', sortable: true },
  { key: 'code', label: 'Code', width: '140px', sortable: true },
  { key: 'logo_url', label: 'Logo URL' },
]

const filteredBrands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return brands.value
  return brands.value.filter(b =>
    [b.name, b.code].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

function openCreate() {
  editTarget.value = null
  Object.assign(form, { name: '', code: '', logo_url: '' })
  showModal.value = true
}

function openEdit(b: Brand) {
  editTarget.value = b
  Object.assign(form, { name: b.name, code: b.code, logo_url: b.logo_url ?? '' })
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const body = { name: form.name.trim(), code: form.code.trim().toUpperCase(), logo_url: form.logo_url || null }
    if (editTarget.value) {
      await updateBrand(editTarget.value.id, body)
      addToast({ type: 'success', title: 'Brand updated' })
    } else {
      await createBrand(body)
      addToast({ type: 'success', title: 'Brand created' })
    }
    showModal.value = false
    brands.value = (await listBrands()) ?? []
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

function confirmDelete(b: Brand) {
  deleteTarget.value = b
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteBrand(deleteTarget.value.id)
    addToast({ type: 'success', title: 'Brand deleted' })
    showDelete.value = false
    brands.value = (await listBrands()) ?? []
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    brands.value = (await listBrands()) ?? []
  } finally {
    loading.value = false
  }
})
</script>
