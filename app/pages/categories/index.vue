<template>
  <div class="page-root">
    <AppPageHeader
      title="Categories"
      description="Organize your clothing catalog into hierarchical parent and child categories."
      :breadcrumbs="[
        { label: 'Catalog', to: '/products' },
        { label: 'Categories' },
      ]"
      primary-label="Add Category"
      primary-icon="i-heroicons-plus"
      @primary-click="openCreate"
    />

    <AppFilterBar
      v-model:search="searchQuery"
      search-placeholder="Search categories by name, code, or description..."
      :shown-count="filteredCategories.length"
      :total-count="categories.length"
      count-label="categories"
      @clear-all="searchQuery = ''"
    />

    <AppCard :no-pad="true">
      <AppTable :columns="columns" :rows="filteredCategories" :loading="loading" empty-text="No categories found.">
        <template #cell-code="{ value }">
          <code class="mono font-semibold">{{ value }}</code>
        </template>
        <template #cell-parent_id="{ value }">
          <span>{{ parentName(value) }}</span>
        </template>
        <template #actions="{ row }">
          <AppButton size="xs" variant="ghost" label="Edit" @click="openEdit(row)" />
          <AppButton size="xs" variant="danger" label="Delete" @click="confirmDelete(row)" />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal v-model="showModal" :title="editTarget ? 'Edit Category' : 'New Category'" size="sm">
      <form class="form-grid" @submit.prevent="save">
        <div class="form-field">
          <label class="field-label">Name <span class="required">*</span></label>
          <input v-model="form.name" class="field-input" placeholder="e.g. Outerwear" required />
        </div>
        <div class="form-field">
          <label class="field-label">Code <span class="required">*</span></label>
          <input v-model="form.code" class="field-input mono uppercase" placeholder="e.g. OUTER" required />
        </div>
        <div class="form-field">
          <label class="field-label">Parent Category</label>
          <AppSelect v-model="form.parent_id" :options="parentOptions" />
        </div>
        <div class="form-field">
          <label class="field-label">Description</label>
          <textarea v-model="form.description" class="field-input field-textarea" rows="2" />
        </div>
        <div class="modal-actions">
          <AppButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <AppButton type="submit" variant="primary" label="Save Category" :loading="saving" />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirm -->
    <AppConfirmDialog
      v-model="showDelete"
      title="Delete Category"
      variant="danger"
      confirm-label="Delete Category"
      :loading="deleting"
      :message="`Are you sure you want to delete category &quot;${deleteTarget?.name}&quot;?`"
      consequence="Products assigned to this category will become uncategorized."
      @confirm="doDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Category } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Categories — Clothing Store Admin' })

const { listCategories, createCategory, updateCategory, deleteCategory } = useCatalogApi()
const { addToast } = useAppToast()

const categories = ref<Category[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const searchQuery = ref('')

const showModal = ref(false)
const editTarget = ref<Category | null>(null)
const showDelete = ref(false)
const deleteTarget = ref<Category | null>(null)

const form = reactive({ name: '', code: '', parent_id: '', description: '' })

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'code', label: 'Code', width: '130px', sortable: true },
  { key: 'parent_id', label: 'Parent Category', width: '180px' },
  { key: 'description', label: 'Description' },
]

const filteredCategories = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter(c =>
    [c.name, c.code, c.description].filter(Boolean).join(' ').toLowerCase().includes(q),
  )
})

const parentOptions = computed(() => [
  { label: 'None (top-level)', value: '' },
  ...categories.value
    .filter(c => !editTarget.value || c.id !== editTarget.value.id)
    .map(c => ({ label: c.name, value: c.id })),
])

function parentName(id: string | null) {
  if (!id) return '—'
  return categories.value.find(c => c.id === id)?.name ?? '—'
}

function openCreate() {
  editTarget.value = null
  Object.assign(form, { name: '', code: '', parent_id: '', description: '' })
  showModal.value = true
}

function openEdit(c: Category) {
  editTarget.value = c
  Object.assign(form, { name: c.name, code: c.code, parent_id: c.parent_id ?? '', description: c.description ?? '' })
  showModal.value = true
}

async function save() {
  saving.value = true
  try {
    const body = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      parent_id: form.parent_id || null,
      description: form.description || null,
    }
    if (editTarget.value) {
      await updateCategory(editTarget.value.id, body)
      addToast({ type: 'success', title: 'Category updated' })
    } else {
      await createCategory(body)
      addToast({ type: 'success', title: 'Category created' })
    }
    showModal.value = false
    categories.value = (await listCategories()) ?? []
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    saving.value = false
  }
}

function confirmDelete(c: Category) {
  deleteTarget.value = c
  showDelete.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteCategory(deleteTarget.value.id)
    addToast({ type: 'success', title: 'Category deleted' })
    showDelete.value = false
    categories.value = (await listCategories()) ?? []
  } catch (e: any) {
    addToast({ type: 'error', title: 'Error', message: e?.data?.detail ?? String(e) })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    categories.value = (await listCategories()) ?? []
  } finally {
    loading.value = false
  }
})
</script>
