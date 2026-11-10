<template>
  <div class="page-root">
    <!-- Header -->
    <PageHeader
      title="Content &amp; Language CMS"
      description="Manage system-wide UI translations across 5 languages backed by PostgreSQL and Redis sub-millisecond cache."
      :breadcrumbs="[{ label: 'System Settings', to: '/settings' }, { label: 'Translations CMS' }]"
      back-to="/settings"
    >
      <template #actions>
        <BaseButton
          variant="default"
          size="sm"
          icon="i-heroicons-arrow-path"
          label="Purge &amp; Sync Cache"
          :loading="isPurging"
          @click="handlePurgeCache"
        />
        <BaseButton
          variant="default"
          size="sm"
          icon="i-heroicons-sparkles"
          label="Re-seed Standard Keys"
          :loading="isReseeding"
          @click="handleReseed"
        />
        <BaseButton
          variant="primary"
          size="sm"
          icon="i-heroicons-plus"
          label="Add Content Key"
          @click="openCreateModal"
        />
      </template>
    </PageHeader>

    <!-- Quick Stats -->
    <div class="kpi-grid">
      <StatCard
        label="Total Translation Keys"
        :value="totalItems"
        sublabel="Database dictionary entries"
        icon="i-heroicons-language"
        tone="primary"
        :loading="loading"
      />
      <StatCard
        label="Supported Locales"
        value="5 Languages"
        sublabel="EN, KM, CN, JP, KR"
        icon="i-heroicons-globe-alt"
        tone="info"
      />
      <StatCard
        label="Active Schema"
        :value="schemaFilter || 'All Schemas'"
        sublabel="Current filter scope"
        icon="i-heroicons-squares-2x2"
        tone="neutral"
      />
      <StatCard
        label="Redis Cache"
        value="Synchronized"
        sublabel="Sub-millisecond lookup"
        icon="i-heroicons-bolt"
        tone="success"
      />
    </div>

    <!-- Filters & Search Toolbar -->
    <FilterBar
      v-model:search="searchQuery"
      search-placeholder="Search by key, section, English, Khmer, Chinese, Japanese, Korean..."
      :total-count="totalItems"
      count-label="keys"
      @submit="onFilterChange"
    >
      <BaseSelect
        v-model="schemaFilter"
        :options="schemaOptions"
        class="w-full sm:w-40"
        @change="onFilterChange"
      />
      <BaseSelect
        v-model="statusFilter"
        :options="statusOptions"
        class="w-full sm:w-36"
        @change="onFilterChange"
      />
      <BaseButton variant="ghost" size="sm" icon="i-heroicons-x-mark" label="Reset" @click="resetFilters" />
    </FilterBar>

    <!-- Translation Content Table -->
    <DataTable
      :columns="columns"
      :rows="items"
      row-key="id"
      :loading="loading"
      empty-title="No translation keys found"
      empty-text="Try adjusting your search or filters, or add a new key."
      empty-icon="i-heroicons-inbox"
    >
      <template #cell-key="{ row }">
        <div class="flex flex-col gap-0.5 min-w-0">
          <span class="font-mono text-xs font-semibold text-ink">{{ row.table_name }}.{{ row.column_name }}</span>
          <div class="flex items-center gap-1.5">
            <StatusBadge status="DEFAULT" :label="row.schema_name" />
            <span v-if="row.note" class="text-[11px] text-ink-tertiary max-w-[140px] truncate" :title="row.note">{{ row.note }}</span>
          </div>
        </div>
      </template>
      <template #cell-en="{ row }">{{ row.en || '—' }}</template>
      <template #cell-km="{ row }">{{ row.km || '—' }}</template>
      <template #cell-cn="{ row }">{{ row.cn || '—' }}</template>
      <template #cell-jp="{ row }">{{ row.jp || '—' }}</template>
      <template #cell-kr="{ row }">{{ row.kr || '—' }}</template>
      <template #cell-status_code="{ row }">
        <StatusBadge :status="row.status_code || 'ACTIVE'" :label="row.status_code || 'ACTIVE'" />
      </template>
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-1">
          <IconButton icon="i-heroicons-pencil-square" label="Edit Translation" @click="openEditModal(row)" />
          <IconButton icon="i-heroicons-trash" label="Delete Key" variant="danger" @click="confirmDeleteItem(row)" />
        </div>
      </template>
      <template #footer>
        <Pagination
          :page="currentPage"
          :page-size="pageSize"
          :total="totalItems"
          @update:page="changePage"
        />
      </template>
    </DataTable>

    <!-- Create / Edit Modal -->
    <BaseModal
      v-model="showModal"
      :title="isEditing ? 'Edit Content Translation' : 'Add New Content Key'"
      size="lg"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <FormSection :columns="3">
          <FormField label="Schema" required>
            <BaseInput v-model="form.schema_name" required placeholder="e.g. admin_front" />
          </FormField>
          <FormField label="Section / Table" required>
            <BaseInput v-model="form.table_name" required placeholder="e.g. nav, common, product" />
          </FormField>
          <FormField label="Key / Column" required>
            <BaseInput v-model="form.column_name" required placeholder="e.g. settings_btn, title" />
          </FormField>
        </FormSection>

        <FormField label="Translator Note / Context Description">
          <BaseInput v-model="form.note" placeholder="e.g. Label displayed on the topbar navigation button" />
        </FormField>

        <FormSection title="Localized Content (5 Languages)" bordered>
          <FormField label="English (en)" required>
            <BaseInput v-model="form.en" required placeholder="English translation text" />
          </FormField>
          <FormField label="Khmer / ភាសាខ្មែរ (km)" required>
            <BaseInput v-model="form.km" required placeholder="អត្ថបទជាភាសាខ្មែរ" />
          </FormField>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <FormField label="Chinese / 中文 (cn)">
              <BaseInput v-model="form.cn" placeholder="中文翻译" />
            </FormField>
            <FormField label="Japanese / 日本語 (jp)">
              <BaseInput v-model="form.jp" placeholder="日本語の翻訳" />
            </FormField>
            <FormField label="Korean / 한국어 (kr)">
              <BaseInput v-model="form.kr" placeholder="한국어 번역" />
            </FormField>
          </div>
        </FormSection>

        <FormField label="Status">
          <BaseSelect v-model="form.status_code" :options="formStatusOptions" />
        </FormField>

        <FormActions>
          <BaseButton type="button" variant="ghost" label="Cancel" @click="showModal = false" />
          <BaseButton
            type="submit"
            variant="primary"
            :loading="isSubmitting"
            :label="isEditing ? 'Save Changes' : 'Create Key'"
          />
        </FormActions>
      </form>
    </BaseModal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      v-model="showDeleteModal"
      title="Delete Translation Key"
      :message="`Are you sure you want to deactivate translation key ${selectedItem?.table_name}.${selectedItem?.column_name}?`"
      consequence="The key will be marked as inactive and removed from live Redis caches."
      confirm-label="Deactivate Key"
      variant="danger"
      :loading="isDeleting"
      @confirm="handleDeleteItem"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useTranslationsApi } from '~/composables/useApi'
import { useAppTranslation } from '~/composables/useAppTranslation'
import { useAppToast } from '~/composables/useAppToast'
import type { TranslationItem } from '~/types'

definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Translations CMS — Clothing Store Admin' })

const { listItems, createItem, updateItem, deleteItem, purgeCache, seedTranslations } = useTranslationsApi()
const { fetchTranslations } = useAppTranslation()
const { addToast } = useAppToast()

// Table State
const items = ref<TranslationItem[]>([])
const loading = ref(false)
const totalItems = ref(0)
const totalPages = ref(1)
const currentPage = ref(1)
const pageSize = ref(50)

// Filters
const searchQuery = ref('')
const schemaFilter = ref('')
const statusFilter = ref('')

// Action states
const isPurging = ref(false)
const isReseeding = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)

// Modals
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedItem = ref<TranslationItem | null>(null)

// Form
const form = reactive({
  schema_name: 'admin_front',
  table_name: '',
  column_name: '',
  en: '',
  km: '',
  cn: '',
  jp: '',
  kr: '',
  note: '',
  status_code: 'ACTIVE',
})

async function fetchItems() {
  loading.value = true
  try {
    const res = await listItems({
      q: searchQuery.value.trim() || undefined,
      schema_name: schemaFilter.value || undefined,
      status_code: statusFilter.value || undefined,
      page: currentPage.value,
      page_size: pageSize.value,
    })
    items.value = res.items || []
    totalItems.value = res.total || 0
    totalPages.value = res.total_pages || 1
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to Load Translations',
      message: err?.data?.detail || err?.message || 'Could not fetch translation keys from server',
    })
  } finally {
    loading.value = false
  }
}

function changePage(page: number) {
  currentPage.value = page
  fetchItems()
}

function resetFilters() {
  searchQuery.value = ''
  schemaFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  fetchItems()
}

function openCreateModal() {
  isEditing.value = false
  selectedItem.value = null
  form.schema_name = schemaFilter.value || 'admin_front'
  form.table_name = ''
  form.column_name = ''
  form.en = ''
  form.km = ''
  form.cn = ''
  form.jp = ''
  form.kr = ''
  form.note = ''
  form.status_code = 'ACTIVE'
  showModal.value = true
}

function openEditModal(item: TranslationItem) {
  isEditing.value = true
  selectedItem.value = item
  form.schema_name = item.schema_name
  form.table_name = item.table_name
  form.column_name = item.column_name
  form.en = item.en || ''
  form.km = item.km || ''
  form.cn = item.cn || ''
  form.jp = item.jp || ''
  form.kr = item.kr || ''
  form.note = item.note || ''
  form.status_code = item.status_code || 'ACTIVE'
  showModal.value = true
}

async function handleSubmit() {
  if (!form.schema_name || !form.table_name || !form.column_name || !form.en || !form.km) {
    addToast({
      type: 'warn',
      title: 'Missing Required Fields',
      message: 'Please provide Schema, Section, Key, English, and Khmer texts.',
    })
    return
  }

  isSubmitting.value = true
  try {
    if (isEditing.value && selectedItem.value) {
      await updateItem(selectedItem.value.id, {
        schema_name: form.schema_name,
        table_name: form.table_name,
        column_name: form.column_name,
        en: form.en,
        km: form.km,
        cn: form.cn || null as any,
        jp: form.jp || null as any,
        kr: form.kr || null as any,
        note: form.note || null as any,
        status_code: form.status_code,
      })
      addToast({
        type: 'success',
        title: 'Translation Updated',
        message: `Saved changes to ${form.table_name}.${form.column_name}.`,
      })
    } else {
      await createItem({
        schema_name: form.schema_name,
        table_name: form.table_name,
        column_name: form.column_name,
        en: form.en,
        km: form.km,
        cn: form.cn,
        jp: form.jp,
        kr: form.kr,
        note: form.note,
        status_code: form.status_code,
      })
      addToast({
        type: 'success',
        title: 'Translation Created',
        message: `Successfully created key ${form.table_name}.${form.column_name}.`,
      })
    }

    showModal.value = false
    await fetchItems()
    // Background sync local translation registry
    fetchTranslations().catch(() => {})
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to Save Translation',
      message: err?.data?.detail || err?.message || 'Error occurred while saving key.',
    })
  } finally {
    isSubmitting.value = false
  }
}

function confirmDeleteItem(item: TranslationItem) {
  selectedItem.value = item
  showDeleteModal.value = true
}

async function handleDeleteItem() {
  if (!selectedItem.value) return
  isDeleting.value = true
  try {
    await deleteItem(selectedItem.value.id)
    addToast({
      type: 'success',
      title: 'Translation Deactivated',
      message: `Key ${selectedItem.value.table_name}.${selectedItem.value.column_name} has been marked inactive.`,
    })
    showDeleteModal.value = false
    await fetchItems()
    fetchTranslations().catch(() => {})
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Failed to Delete Translation',
      message: err?.data?.detail || err?.message || 'Could not deactivate translation key.',
    })
  } finally {
    isDeleting.value = false
  }
}

async function handlePurgeCache() {
  isPurging.value = true
  try {
    const res = await purgeCache()
    await fetchTranslations()
    addToast({
      type: 'success',
      title: 'Cache Synchronized',
      message: res.message || 'Redis cache flushed and warmed successfully.',
    })
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Cache Purge Failed',
      message: err?.data?.detail || err?.message || 'Could not flush Redis cache.',
    })
  } finally {
    isPurging.value = false
  }
}

async function handleReseed() {
  isReseeding.value = true
  try {
    const res = await seedTranslations()
    await fetchItems()
    await fetchTranslations()
    addToast({
      type: 'success',
      title: 'Standard Keys Seeded',
      message: `Seeded ${res.seeded_count} standard translation keys into database.`,
    })
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'Reseed Failed',
      message: err?.data?.detail || err?.message || 'Could not seed translation keys.',
    })
  } finally {
    isReseeding.value = false
  }
}

onMounted(() => {
  fetchItems()
})

const columns = [
  { key: 'key', label: 'Content Key' },
  { key: 'en', label: 'English (EN)' },
  { key: 'km', label: 'Khmer (KM)' },
  { key: 'cn', label: 'Chinese (CN)' },
  { key: 'jp', label: 'Japanese (JP)' },
  { key: 'kr', label: 'Korean (KR)' },
  { key: 'status_code', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' as const },
]

const schemaOptions = [
  { label: 'All Schemas', value: '' },
  { label: 'admin_front', value: 'admin_front' },
  { label: 'pos', value: 'pos' },
  { label: 'web_store', value: 'web_store' },
  { label: 'common', value: 'common' },
]
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
]
const formStatusOptions = statusOptions.slice(1)

function onFilterChange() {
  currentPage.value = 1
  fetchItems()
}
</script>
