<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <NuxtLink
            to="/settings"
            class="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
          >
            <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
            <span>Settings</span>
          </NuxtLink>
          <span class="text-xs text-gray-400">/</span>
          <span class="text-xs font-semibold text-gray-900 dark:text-white">Translations CMS</span>
        </div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Content &amp; Language CMS
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage system-wide UI translations across 5 languages backed by PostgreSQL and Redis sub-millisecond cache.
        </p>
      </div>

      <div class="flex items-center flex-wrap gap-2">
        <AppButton
          variant="ghost"
          icon="i-heroicons-arrow-path"
          label="Purge &amp; Sync Cache"
          :loading="isPurging"
          @click="handlePurgeCache"
        />
        <AppButton
          variant="ghost"
          icon="i-heroicons-sparkles"
          label="Re-seed Standard Keys"
          :loading="isReseeding"
          @click="handleReseed"
        />
        <AppButton
          variant="primary"
          icon="i-heroicons-plus"
          label="Add Content Key"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <AppCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-language" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Translation Keys</div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">{{ totalItems }}</div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-globe-alt" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Supported Locales</div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">5 Languages</div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-squares-2x2" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Active Schema</div>
            <div class="text-lg font-bold text-gray-900 dark:text-white">{{ schemaFilter || 'All Schemas' }}</div>
          </div>
        </div>
      </AppCard>

      <AppCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-bolt" class="w-5 h-5" />
          </div>
          <div>
            <div class="text-xs font-medium text-gray-500 dark:text-gray-400">Redis Cache</div>
            <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">Synchronized</div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col sm:flex-row items-center gap-3">
      <div class="relative flex-1 w-full">
        <UIcon name="i-heroicons-magnifying-glass" class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by key, section, English, Khmer, Chinese, Japanese, Korean..."
          class="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          @keyup.enter="fetchItems"
        />
      </div>

      <AppSelect
        v-model="schemaFilter"
        :options="[
          { label: 'All Schemas', value: '' },
          { label: 'admin_front', value: 'admin_front' },
          { label: 'pos', value: 'pos' },
          { label: 'web_store', value: 'web_store' },
          { label: 'common', value: 'common' },
        ]"
        class="w-full sm:w-40"
        @change="fetchItems"
      />

      <AppSelect
        v-model="statusFilter"
        :options="[
          { label: 'All Statuses', value: '' },
          { label: 'ACTIVE', value: 'ACTIVE' },
          { label: 'INACTIVE', value: 'INACTIVE' },
        ]"
        class="w-full sm:w-36"
        @change="fetchItems"
      />

      <AppButton
        variant="ghost"
        icon="i-heroicons-x-mark"
        label="Reset"
        @click="resetFilters"
      />
    </div>

    <!-- Translation Content Table -->
    <AppCard :no-pad="true">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-gray-700 dark:text-gray-300">
          <thead class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th scope="col" class="px-4 py-3 min-w-[200px]">Content Key</th>
              <th scope="col" class="px-3 py-3 min-w-[160px]">
                <div class="flex items-center gap-1.5">
                  <span>🇬🇧</span>
                  <span>English (EN)</span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 min-w-[160px]">
                <div class="flex items-center gap-1.5">
                  <span>🇰🇭</span>
                  <span>Khmer (KM)</span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 min-w-[140px]">
                <div class="flex items-center gap-1.5">
                  <span>🇨🇳</span>
                  <span>Chinese (CN)</span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 min-w-[140px]">
                <div class="flex items-center gap-1.5">
                  <span>🇯🇵</span>
                  <span>Japanese (JP)</span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 min-w-[140px]">
                <div class="flex items-center gap-1.5">
                  <span>🇰🇷</span>
                  <span>Korean (KR)</span>
                </div>
              </th>
              <th scope="col" class="px-3 py-3 min-w-[90px]">Status</th>
              <th scope="col" class="px-4 py-3 text-right min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <!-- Loading Skeletons -->
            <tr v-if="loading" v-for="i in 8" :key="`skeleton-${i}`" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
              <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-14" /></td>
              <td class="px-4 py-3 text-right"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 ml-auto" /></td>
            </tr>

            <!-- Empty State -->
            <tr v-else-if="items.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                <UIcon name="i-heroicons-inbox" class="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <div class="text-sm font-medium">No translation keys found</div>
                <div class="text-xs text-gray-400 mt-1">Try adjusting your search or filters, or add a new key.</div>
              </td>
            </tr>

            <!-- Table Rows -->
            <tr
              v-else
              v-for="item in items"
              :key="item.id"
              class="hover:bg-gray-50/75 dark:hover:bg-gray-800/40 transition-colors"
            >
              <!-- Content Key -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div>
                    <div class="font-mono text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{{ item.table_name }}.{{ item.column_name }}</span>
                    </div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        {{ item.schema_name }}
                      </span>
                      <span v-if="item.note" class="text-[11px] text-gray-400 truncate max-w-[140px]" :title="item.note">
                        {{ item.note }}
                      </span>
                    </div>
                  </div>
                </div>
              </td>

              <!-- English -->
              <td class="px-3 py-3">
                <span class="text-xs text-gray-900 dark:text-white font-medium break-words">
                  {{ item.en || '—' }}
                </span>
              </td>

              <!-- Khmer -->
              <td class="px-3 py-3">
                <span class="text-xs text-gray-900 dark:text-white font-medium break-words">
                  {{ item.km || '—' }}
                </span>
              </td>

              <!-- Chinese -->
              <td class="px-3 py-3">
                <span class="text-xs text-gray-800 dark:text-gray-200 break-words">
                  {{ item.cn || '—' }}
                </span>
              </td>

              <!-- Japanese -->
              <td class="px-3 py-3">
                <span class="text-xs text-gray-800 dark:text-gray-200 break-words">
                  {{ item.jp || '—' }}
                </span>
              </td>

              <!-- Korean -->
              <td class="px-3 py-3">
                <span class="text-xs text-gray-800 dark:text-gray-200 break-words">
                  {{ item.kr || '—' }}
                </span>
              </td>

              <!-- Status -->
              <td class="px-3 py-3">
                <AppBadge :color="item.status_code === 'ACTIVE' ? 'green' : 'default'">
                  {{ item.status_code || 'ACTIVE' }}
                </AppBadge>
              </td>

              <!-- Actions -->
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    class="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    title="Edit Translation"
                    @click="openEditModal(item)"
                  >
                    <UIcon name="i-heroicons-pencil-square" class="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                    title="Delete Key"
                    @click="confirmDeleteItem(item)"
                  >
                    <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex items-center gap-2">
          <span>Showing page <strong>{{ currentPage }}</strong> of <strong>{{ totalPages }}</strong> ({{ totalItems }} items total)</span>
        </div>
        <div class="flex items-center gap-2">
          <AppButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-chevron-left"
            label="Previous"
            :disabled="currentPage <= 1 || loading"
            @click="changePage(currentPage - 1)"
          />
          <AppButton
            variant="ghost"
            size="sm"
            icon="i-heroicons-chevron-right"
            label="Next"
            :disabled="currentPage >= totalPages || loading"
            @click="changePage(currentPage + 1)"
          />
        </div>
      </div>
    </AppCard>

    <!-- Create / Edit Modal -->
    <AppModal
      v-model="showModal"
      :title="isEditing ? 'Edit Content Translation' : 'Add New Content Key'"
      size="lg"
    >
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Schema <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.schema_name"
              type="text"
              required
              placeholder="e.g. admin_front"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Section / Table <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.table_name"
              type="text"
              required
              placeholder="e.g. nav, common, product"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Key / Column <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.column_name"
              type="text"
              required
              placeholder="e.g. settings_btn, title"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Translator Note / Context Description
          </label>
          <input
            v-model="form.note"
            type="text"
            placeholder="e.g. Label displayed on the topbar navigation button"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>

        <!-- Multi-language fields -->
        <div class="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Localized Content (5 Languages)
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <span>🇬🇧</span>
              <span>English (en) <span class="text-red-500">*</span></span>
            </label>
            <input
              v-model="form.en"
              type="text"
              required
              placeholder="English translation text"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
              <span>🇰🇭</span>
              <span>Khmer / ភាសាខ្មែរ (km) <span class="text-red-500">*</span></span>
            </label>
            <input
              v-model="form.km"
              type="text"
              required
              placeholder="អត្ថបទជាភាសាខ្មែរ"
              class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <span>🇨🇳</span>
                <span>Chinese / 中文 (cn)</span>
              </label>
              <input
                v-model="form.cn"
                type="text"
                placeholder="中文翻译"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <span>🇯🇵</span>
                <span>Japanese / 日本語 (jp)</span>
              </label>
              <input
                v-model="form.jp"
                type="text"
                placeholder="日本語の翻訳"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                <span>🇰🇷</span>
                <span>Korean / 한국어 (kr)</span>
              </label>
              <input
                v-model="form.kr"
                type="text"
                placeholder="한국어 번역"
                class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>
        </div>

        <div class="pt-2">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            v-model="form.status_code"
            class="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gray-400"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        <div class="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-gray-700">
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
            :label="isEditing ? 'Save Changes' : 'Create Key'"
          />
        </div>
      </form>
    </AppModal>

    <!-- Delete Confirmation Modal -->
    <AppModal
      v-model="showDeleteModal"
      title="Delete Translation Key"
      size="sm"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Are you sure you want to deactivate translation key
          <strong class="font-mono text-gray-900 dark:text-white">
            {{ selectedItem?.table_name }}.{{ selectedItem?.column_name }}
          </strong>?
          The key will be marked as inactive and removed from live Redis caches.
        </p>

        <div class="flex justify-end gap-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
          <AppButton
            variant="ghost"
            label="Cancel"
            @click="showDeleteModal = false"
          />
          <AppButton
            variant="primary"
            label="Deactivate Key"
            class="bg-red-600 hover:bg-red-700 text-white"
            :loading="isDeleting"
            @click="handleDeleteItem"
          />
        </div>
      </div>
    </AppModal>
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
</script>

