<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Brands &amp; Labels</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage apparel brands, designer labels, and manufacturer profiles</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchBrands"
        />
        <AppButton
          variant="primary"
          icon="i-heroicons-plus"
          label="Add Brand"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Filter & Search Bar -->
    <div class="flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search brands by name, slug, or description..."
          class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>
      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
        ]"
        class="w-full sm:w-44"
      />
    </div>

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
            <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs border border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden">
              <img
                v-if="row.logo_url"
                :src="row.logo_url"
                :alt="row.name"
                class="w-full h-full object-cover"
              />
              <UIcon v-else name="i-heroicons-sparkles" class="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-500 font-mono">{{ row.slug || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
            {{ row.description || '—' }}
          </span>
        </template>

        <template #cell-status="{ value }">
          <AppBadge :color="value === 'ACTIVE' ? 'green' : 'default'">
            {{ value || 'ACTIVE' }}
          </AppBadge>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <AppButton
              variant="ghost"
              size="sm"
              icon="i-heroicons-pencil-square"
              label="Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              variant="ghost"
              size="sm"
              icon="i-heroicons-trash"
              label="Delete"
              class="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
              @click="confirmDeleteBrand(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="isEditing ? 'Edit Brand' : 'Register New Brand'"
      size="md"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Brand Name <span class="text-red-500">*</span>
          </label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Zara, Uniqlo, Levi's, H&M"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Brand Slug / Identifier
          </label>
          <AppInput
            v-model="form.slug"
            placeholder="e.g. zara, uniqlo (auto-generated if blank)"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Brand Logo
          </label>
          <AppFileUpload
            v-model="form.logo_url"
            folder="brands"
            hint="Upload brand insignia or logo image"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Brand origin, target demographic, manufacturing quality notes..."
            class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
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
              { label: 'Inactive', value: 'INACTIVE' },
            ]"
          />
        </div>

        <div class="flex justify-end gap-2.5 pt-4 border-t border-gray-100 dark:border-gray-800">
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
            :label="isEditing ? 'Save Changes' : 'Register Brand'"
          />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal
      v-model="showDeleteModal"
      title="Delete Brand"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete brand
          <strong class="text-gray-900 dark:text-white">{{ selectedBrand?.name }}</strong>?
          Products linked to this brand will remain in catalog without a brand association.
        </p>
        <div class="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <AppButton
            variant="ghost"
            label="Cancel"
            @click="showDeleteModal = false"
          />
          <AppButton
            variant="primary"
            label="Delete Brand"
            class="bg-red-600 hover:bg-red-700 text-white"
            :loading="isDeleting"
            @click="handleDeleteBrand"
          />
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useCatalogApi } from '~/composables/useApi'
import { useAppToast } from '~/composables/useAppToast'
import type { Brand } from '~/types/api.generated'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Brands — Clothing Store Admin' })

const { listBrands, createBrand, updateBrand, deleteBrand } = useCatalogApi()
const { addToast } = useAppToast()

const brands = ref<Brand[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedBrand = ref<Brand | null>(null)

const columns = [
  { key: 'name', label: 'Brand Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
]

const form = reactive({
  name: '',
  slug: '',
  logo_url: '',
  description: '',
  status_code: 'ACTIVE',
})

const filteredBrands = computed(() => {
  return brands.value.filter((b) => {
    const matchesSearch = !searchQuery.value.trim() ||
      b.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (b.slug && b.slug.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesStatus = !statusFilter.value || (b.status_code || 'ACTIVE') === statusFilter.value
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

function openEditModal(brand: Brand) {
  isEditing.value = true
  selectedBrand.value = brand
  form.name = brand.name || ''
  form.slug = brand.slug || ''
  form.logo_url = brand.logo_url || ''
  form.description = brand.description || ''
  form.status_code = brand.status_code || 'ACTIVE'
  showModal.value = true
}

function confirmDeleteBrand(brand: Brand) {
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
      addToast({ title: 'Brand Updated', description: `Successfully updated ${form.name}`, color: 'green' })
    } else {
      await createBrand(payload)
      addToast({ title: 'Brand Created', description: `Successfully registered ${form.name}`, color: 'green' })
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
    addToast({ title: 'Brand Deleted', description: `${selectedBrand.value.name} was removed`, color: 'green' })
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

