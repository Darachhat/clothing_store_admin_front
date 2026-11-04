<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Product Categories</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Organize clothing, garments, and accessories into structured catalog hierarchies</p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          label="Refresh"
          :loading="loading"
          @click="fetchCategories"
        />
        <AppButton
          variant="primary"
          icon="i-heroicons-plus"
          label="Add Category"
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
          placeholder="Search categories by name, code, or description..."
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

    <!-- Categories Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="filteredCategories"
        :loading="loading"
        empty-text="No product categories found."
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300 font-mono text-xs border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 dark:text-white text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-500 font-mono">{{ row.slug || row.code || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-parent="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ getParentCategoryName(row.parent_id) }}
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
              @click="confirmDeleteCategory(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="isEditing ? 'Edit Category' : 'Create New Category'"
      size="md"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Category Name <span class="text-red-500">*</span>
          </label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Outerwear, Men's Shirts, Denim"
            required
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Category Code / Slug
          </label>
          <AppInput
            v-model="form.slug"
            placeholder="e.g. outerwear, mens-shirts (auto-generated if blank)"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Parent Category (Optional Hierarchy)
          </label>
          <AppSelect
            v-model="form.parent_id"
            :options="parentCategoryOptions"
            placeholder="None (Top-Level Category)"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Category overview, styling notes, or placement notes..."
            class="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
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

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Display Sort Order
            </label>
            <AppInput
              v-model.number="form.sort_order"
              type="number"
              min="0"
              placeholder="0"
            />
          </div>
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
            :label="isEditing ? 'Save Changes' : 'Create Category'"
          />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal
      v-model="showDeleteModal"
      title="Delete Category"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to delete category
          <strong class="text-gray-900 dark:text-white">{{ selectedCategory?.name }}</strong>?
          Products assigned to this category will need to be reclassified.
        </p>
        <div class="flex justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <AppButton
            variant="ghost"
            label="Cancel"
            @click="showDeleteModal = false"
          />
          <AppButton
            variant="primary"
            label="Delete Category"
            class="bg-red-600 hover:bg-red-700 text-white"
            :loading="isDeleting"
            @click="handleDeleteCategory"
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
import type { Category } from '~/types/api.generated'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Categories — Clothing Store Admin' })

const { listCategories, createCategory, updateCategory, deleteCategory } = useCatalogApi()
const { addToast } = useAppToast()

const categories = ref<Category[]>([])
const loading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const searchQuery = ref('')
const statusFilter = ref('')

const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedCategory = ref<Category | null>(null)

const columns = [
  { key: 'name', label: 'Category' },
  { key: 'parent', label: 'Parent Hierarchy' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
]

const form = reactive({
  name: '',
  slug: '',
  parent_id: '',
  description: '',
  status_code: 'ACTIVE',
  sort_order: 0,
})

const filteredCategories = computed(() => {
  return categories.value.filter((cat) => {
    const matchesSearch = !searchQuery.value.trim() ||
      cat.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (cat.slug && cat.slug.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesStatus = !statusFilter.value || (cat.status_code || 'ACTIVE') === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const parentCategoryOptions = computed(() => {
  const options = [{ label: 'None (Top-Level Category)', value: '' }]
  for (const cat of categories.value) {
    if (!isEditing.value || cat.id !== selectedCategory.value?.id) {
      options.push({ label: cat.name, value: cat.id })
    }
  }
  return options
})

function getParentCategoryName(parentId?: string | null): string {
  if (!parentId) return 'Top-Level'
  const parent = categories.value.find((c) => c.id === parentId)
  return parent ? parent.name : '—'
}

async function fetchCategories() {
  loading.value = true
  try {
    const res: any = await listCategories()
    categories.value = Array.isArray(res) ? res : (res?.items || [])
  } catch (err: any) {
    addToast({
      title: 'Failed to load categories',
      description: err?.data?.detail || err?.message || 'Could not fetch categories',
      color: 'red',
    })
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  isEditing.value = false
  selectedCategory.value = null
  form.name = ''
  form.slug = ''
  form.parent_id = ''
  form.description = ''
  form.status_code = 'ACTIVE'
  form.sort_order = categories.value.length
  showModal.value = true
}

function openEditModal(category: Category) {
  isEditing.value = true
  selectedCategory.value = category
  form.name = category.name || ''
  form.slug = category.slug || ''
  form.parent_id = category.parent_id || ''
  form.description = category.description || ''
  form.status_code = category.status_code || 'ACTIVE'
  form.sort_order = category.sort_order || 0
  showModal.value = true
}

function confirmDeleteCategory(category: Category) {
  selectedCategory.value = category
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
      parent_id: form.parent_id || null,
      description: form.description?.trim() || null,
      status_code: form.status_code,
      sort_order: form.sort_order || 0,
    }

    if (isEditing.value && selectedCategory.value) {
      await updateCategory(selectedCategory.value.id, payload)
      addToast({ title: 'Category Updated', description: `Successfully updated ${form.name}`, color: 'green' })
    } else {
      await createCategory(payload)
      addToast({ title: 'Category Created', description: `Successfully created ${form.name}`, color: 'green' })
    }

    showModal.value = false
    await fetchCategories()
  } catch (err: any) {
    addToast({
      title: 'Action Failed',
      description: err?.data?.detail || err?.message || 'Could not save category',
      color: 'red',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDeleteCategory() {
  if (!selectedCategory.value) return
  isDeleting.value = true
  try {
    await deleteCategory(selectedCategory.value.id)
    addToast({ title: 'Category Deleted', description: `${selectedCategory.value.name} was removed`, color: 'green' })
    showDeleteModal.value = false
    await fetchCategories()
  } catch (err: any) {
    addToast({
      title: 'Delete Failed',
      description: err?.data?.detail || err?.message || 'Could not delete category',
      color: 'red',
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

