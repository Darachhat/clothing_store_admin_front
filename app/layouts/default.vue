<template>
  <div class="admin-root">
    <!-- ─── Unified Reusable Sidebar ─────────────────────────────── -->
    <AppSidebar />

    <!-- ─── Admin Main Content ─────────────────────────────────── -->
    <div class="admin-main">
      <!-- Top bar -->
      <header class="admin-topbar">
        <h1 class="admin-topbar__title">{{ pageTitle }}</h1>
        <div class="admin-topbar__actions flex items-center gap-2">
          <!-- ── Language Switcher ── -->
          <UDropdown
            :items="languageMenuItems"
            :popper="{ placement: 'bottom-end' }"
            :ui="{
              background: 'bg-white dark:bg-gray-800',
              ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
              divide: 'divide-gray-100 dark:divide-gray-700',
            }"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors shadow-xs"
              :title="t('common.language', 'Language')"
            >
              <UIcon name="i-heroicons-globe-alt" class="w-4 h-4 text-gray-500" />
              <span>{{ currentLocaleObj?.flag || '🌐' }} {{ currentLocaleObj?.native || 'Language' }}</span>
              <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-gray-400" />
            </button>
          </UDropdown>

          <NuxtLink to="/pos" class="btn btn--sm" style="display:inline-flex; align-items:center; gap:6px;">
            <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5" />
            <span>{{ t('common.open_pos', 'Open POS') }}</span>
          </NuxtLink>
        </div>
      </header>

      <!-- Page content -->
      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
import { useSidebar } from '~/composables/useSidebar'
import { useAppTranslation, type LocaleCode } from '~/composables/useAppTranslation'

const route = useRoute()
const { navSections } = useSidebar()
const { currentLocale, supportedLocales, setLocale, t } = useAppTranslation()

const currentLocaleObj = computed(() => {
  return supportedLocales.find(l => l.code === currentLocale.value) || supportedLocales[0]
})

const languageMenuItems = computed(() => [
  supportedLocales.map(l => ({
    label: `${l.flag} ${l.native} (${l.name})`,
    icon: l.code === currentLocale.value ? 'i-heroicons-check' : undefined,
    click: () => setLocale(l.code as LocaleCode),
  })),
])

const pageTitle = computed(() => {
  const path = route.path
  const sections = unref(navSections) || []
  const allItems = [...sections.flatMap(s => s.items)].sort((a, b) => b.to.length - a.to.length)
  const found = allItems.find(i => i.to === path || (path.startsWith(i.to + '/') && i.to !== '/'))
  return found?.label || 'Clothing Store'
})
</script>
