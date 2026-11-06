<template>
  <div class="page-root">
    <AppPageHeader
      title="Product Categories"
      description="Organize clothing, garments, and accessories into structured catalog hierarchies."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Categories' },
      ]"
      primary-label="Add Category"
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
          @click="fetchCategories"
        />
      </template>
    </AppPageHeader>

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search categories by name, code, slug, or description..."
      :chips="activeChips"
      :shown-count="filteredCategories.length"
      :total-count="categories.length"
      count-label="categories"
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
            <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-mono text-xs border border-gray-200 flex-shrink-0">
              <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4" />
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">{{ row.name }}</p>
              <p class="text-xs text-gray-500 font-mono">{{ row.slug || row.code || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-parent="{ row }">
          <span class="text-sm text-gray-600">
            {{ getParentCategoryName(row.parent_id) }}
          </span>
        </template>

        <template #cell-sort_order="{ row }">
          <span class="mono text-xs text-gray-600">{{ row.sort_order ?? 0 }}</span>
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
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div class="form-field">
          <label class="field-label">
            Category Name <span class="required">*</span>
          </label>
          <AppInput
            v-model="form.name"
            placeholder="e.g. Outerwear, Men's Shirts, Denim"
            required
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            Category Code / Slug
          </label>
          <AppInput
            v-model="form.slug"
            placeholder="e.g. outerwear, mens-shirts (auto-generated if blank)"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            Parent Category (Optional Hierarchy)
          </label>
          <AppSelect
            v-model="form.parent_id"
            :options="parentCategoryOptions"
            placeholder="None (Top-Level Category)"
          />
        </div>

        <div class="form-field">
          <label class="field-label">
            Description
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Category overview, styling notes, or placement notes..."
            class="field-input field-textarea"
          />
        </div>

        <div class="form-row">
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

          <div class="form-field">
            <label class="field-label">
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
            :label="isEditing ? 'Save Changes' : 'Create Category'"
          />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppConfirmDialog
      v-model="showDeleteModal"
      title="Delete Category"
      variant="danger"
      confirm-label="Delete Category"
      :loading="isDeleting"
      :message="`Are you sure you want to delete category &quot;${selectedCategory?.name}&quot;?`"
      consequence="Products assigned to this category will need to be reclassified."
      @confirm="handleDeleteCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useCatalogApi } from '~/composables/useApi'
import { useAppToast } from '~/composables/useAppToast'
import type { Category } from '~/types'
import type { FilterChipItem } from '~/components/AppFilterBar.vue'

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
  { key: 'name', label: 'Category', sortable: true },
  { key: 'parent', label: 'Parent Hierarchy' },
  { key: 'description', label: 'Description' },
  { key: 'sort_order', label: 'Sort Order', width: '110px', sortable: true },
  { key: 'status', label: 'Status', width: '110px' },
]

const form = reactive({
  name: '',
  slug: '',
  parent_id: '',
  description: '',
  status_code: 'ACTIVE',
  sort_order: 0,
})

const activeChips = computed<FilterChipItem[]>(() => {
  const chips: FilterChipItem[] = []
  if (statusFilter.value) chips.push({ key: 'status', label: 'Status', value: statusFilter.value })
  return chips
})

const filteredCategories = computed(() => {
  return categories.value.filter((cat) => {
    const matchesSearch = !searchQuery.value.trim() ||
      cat.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (cat.slug && cat.slug.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (cat.code && cat.code.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesStatus = !statusFilter.value || (cat.status_code || cat.status || 'ACTIVE') === statusFilter.value
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
  const parent = categories.value.find(c => c.id === parentId)
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
  form.slug = category.slug || category.code || ''
  form.parent_id = category.parent_id || ''
  form.description = category.description || ''
  form.status_code = category.status_code || category.status || 'ACTIVE'
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
