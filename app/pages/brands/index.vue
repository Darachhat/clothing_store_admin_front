<template>
  <div class="page-root">
    <AppPageHeader
      title="Brands & Labels"
      description="Manage apparel brands, designer labels, and manufacturer profiles."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Brands' },
      ]"
      primary-label="Add BRAND_MODEL"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreateModal"
    >
      <template #secondary>
        <AppButton
          size="sm"
          variant="default"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchBrands"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search brands by name, slug, or description..."
      :chips="activeChips"
      :shown-count="filteredBrands.length"
      :total-count="brands.length"
      count-label="brands"
      @remove-chip="statusFilter = ''"
      @clear-all="searchQuery = ''; statusFilter = ''"
    >
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]"
        style="min-width: 150px;"
      />
    </AppFilterBar>

    <!-- Brands Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredBrands"
        :loading="loading"
        empty-text="No clothing brands found."
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-xs border border-gray-200 flex-shrink-0 overflow-hidden">
              <img
                v-if="row.logo_url"
                :src="row.logo_url"
                :alt="row.name"
                class="w-full h-full object-cover"
              />
              <UIcon v-else name="i-heroicons-sparkles" class="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-500 font-mono">{{ row.slug || row.code || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="text-sm text-gray-600 line-clamp-1">
            {{ row.description || '—' }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <AppBadge :color="(row.status_code || row.status || 'ACTIVE') === 'ACTIVE' ? 'green' : 'default'" size="sm">
            {{ row.status_code || row.status || 'ACTIVE' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton
              variant="ghost"
              size="xs"
              icon="i-heroicons-pencil-square"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              variant="danger"
              size="xs"
              icon="i-heroicons-trash"
              label="Delete"
              @click="confirmDeleteBrand(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="isEditing ? 'Edit BRAND_MODEL' : 'Register New BRAND_MODEL'"
      size="md"
    >
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="field-label">
            BRAND_MODEL Name <span class="required">*</span>
          </label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Zara, Uniqlo, Levi's, H&M"
            required
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            BRAND_MODEL Slug / Identifier
          </label>
          <AppInput
            v-model="form.slug"
            placeholder="e.g. zara, uniqlo (auto-generated if blank)"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            BRAND_MODEL Logo
          </label>
          <AppFileUpload
            v-model="form.logo_url"
            folder="brands"
            hint="Upload brand insignia or logo image"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            Description
          </label>
          <AppTextarea
          v-model="form.description"
          rows="3"
          placeholder="BRAND_MODEL origin, target demographic, manufacturing quality notes..."
        />
        </div>

        <div class="form-field">
          <label class="field-label">
            Status
          </label>
          <AppSelect
            v-model="form.status_code"
            :options="[
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
            ]"
          />
        </div>

        <div class="modal-actions">
          <AppButton
            type="button"
            variant="ghost"
            label="Cancel"
            @click="showModal = false"
          />
          <AppButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
            :label="isEditing ? 'Save Changes' : 'Register BRAND_MODEL'"
          />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppConfirmDialog
      v-model="showDeleteModal"
      title="Delete BRAND_MODEL"
      variant="danger"
      confirm-label="Delete BRAND_MODEL"
      :loading="isDeleting"
      :message="`Are you sure you want to delete brand &quot;${selectedBrand?.name}&quot;?`"
      consequence="Products linked to this brand will remain in catalog without a brand association."
      @confirm="handleDeleteBrand"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useCatalogApi } from '~/composables/useApi'
import { useAppToast } from '~/composables/useAppToast'
import type { BRAND_MODEL } from '~/types'
import type { FilterChipItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Brands — Clothing Store Admin' })

const { listBrands, createBrand, updateBrand, deleteBrand } = useCatalogApi()
const { addToast } = useAppToast()

const brands = ref<BRAND_MODEL[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedBrand = ref<BRAND_MODEL | null>(null)

const columns = [
  { key: 'name', label: 'BRAND_MODEL Name', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status', width: '120px' },
]

const form = reactive({
  name: '',
  slug: '',
  logo_url: '' as string | null,
  description: '',
  status_code: 'ACTIVE',
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  return chips
})

const filteredBrands = computed(() => {
  return brands.value.filter((b) => {
    const matchesSearch = !searchQuery.value.trim() ||
      b.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.slug && b.slug.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (b.code && b.code.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesStatus = !statusFilter.value || (b.status_code || b.status || 'ACTIVE') === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

async function fetchBrands() {
  loading.value = true
  try {
    const res: any = await listBrands()
    brands.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (err: any) {
    addToast({
      title: 'Failed to load brands',
      description: err?.data?.detail || err?.message || 'Could not fetch brands',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  selectedBrand.value = null
  form.name = ''
  form.slug = ''
  form.logo_url = ''
  form.description = ''
  form.status_code = 'ACTIVE'
  showModal.value = true
}

function openEditModal(brand: BRAND_MODEL) {
  isEditing.value = true
  selectedBrand.value = brand
  form.name = brand.name || ''
  form.slug = brand.slug || brand.code || ''
  form.logo_url = brand.logo_url || ''
  form.description = brand.description || ''
  form.status_code = brand.status_code || brand.status || 'ACTIVE'
  showModal.value = true
}

function confirmDeleteBrand(brand: BRAND_MODEL) {
  selectedBrand.value = brand
  showDeleteModal.value = true
}

async function handleSubmit() {
  if (!form.name.trim()) return
  isSubmitting.value = true
  try {
    const slug = form.slug.trim() || form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const payload = {
      name: form.name.trim(),
      slug,
      logo_url: form.logo_url?.trim() || null,
      description: form.description?.trim() || null,
      status_code: form.status_code,
    }

    if (isEditing.value && selectedBrand.value) {
      await updateBrand(selectedBrand.value.id, payload)
      addToast({ title: 'BRAND_MODEL Updated', description: `Successfully updated ${form.name}`, color: 'green' })
    } else {
      await createBrand(payload)
      addToast({ title: 'BRAND_MODEL Created', description: `Successfully registered ${form.name}`, color: 'green' })
    }

    showModal.value = false
    await fetchBrands()
  } catch (err: any) {
    addToast({
      title: 'Action Failed',
      description: err?.data?.detail || err?.message || 'Could not save brand',
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteBrand() {
  if (!selectedBrand.value) return
  isDeleting.value = true
  try {
    await deleteBrand(selectedBrand.value.id)
    addToast({ title: 'BRAND_MODEL Deleted', description: `${selectedBrand.value.name} was removed`, color: 'green' })
    showDeleteModal.value = false
    await fetchBrands()
  } catch (err: any) {
    addToast({
      title: 'Delete Failed',
      description: err?.data?.detail || err?.message || 'Could not delete brand',
      color: 'red',
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchBrands()
})
</script>
