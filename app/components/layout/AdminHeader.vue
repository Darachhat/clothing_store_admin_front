<template>
  <header class="admin-topbar">
    <!-- Left: Mobile Toggle + Breadcrumb Context -->
    <div class="flex items-center gap-2.5 min-w-0 flex-1">
      <button
        type="button"
        class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-subtle bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer shrink-0"
        aria-label="Open navigation menu"
        @click="toggleMobileSidebar"
      >
        <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
      </button>

      <nav class="flex items-center gap-1.5 text-xs min-w-0 overflow-hidden" aria-label="Current section">
        <span class="hidden sm:inline text-ink-tertiary font-medium whitespace-nowrap">{{ currentRouteContext.groupLabel }}</span>
        <UIcon name="i-heroicons-chevron-right" class="hidden sm:inline w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <NuxtLink :to="currentRouteContext.itemTo" class="inline-flex items-center gap-1.5 text-ink font-semibold whitespace-nowrap truncate min-w-0">
          <UIcon :name="currentRouteContext.icon" class="w-4 h-4 text-ink-tertiary shrink-0" />
          <span class="truncate">{{ currentRouteContext.itemLabel }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Right: Quick Nav + Language Selector + User Menu -->
    <div class="flex items-center gap-1.5 shrink-0">
      <!-- Quick Operational Shortcuts -->
      <div class="hidden sm:flex items-center gap-1.5">
        <NuxtLink
          to="/pos"
          class="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-border-subtle bg-surface-inset text-ink-secondary text-xs font-medium hover:bg-surface-hover hover:text-ink transition-colors"
          title="Open Point of Sale Terminal"
          aria-label="Open Point of Sale Terminal"
        >
          <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden lg:inline">{{ t('common.open_pos', 'Open POS') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/settings/terminals"
          class="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-border-subtle bg-surface-inset text-ink-secondary text-xs font-medium hover:bg-surface-hover hover:text-ink transition-colors"
          :class="[route.path === '/settings/terminals' && 'bg-surface-hover text-ink']"
          title="Monitor POS Registers & Shifts"
          aria-label="Monitor POS Registers & Shifts"
        >
          <UIcon name="i-heroicons-cpu-chip" class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden lg:inline">{{ t('nav.pos_registers', 'POS Registers') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/products/new"
          class="inline-flex items-center justify-center gap-1.5 h-8 px-2.5 rounded-md border border-border-subtle bg-surface-inset text-ink-secondary text-xs font-medium hover:bg-surface-hover hover:text-ink transition-colors"
          title="Create a new product"
          aria-label="Create a new product"
        >
          <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden lg:inline">New Product</span>
        </NuxtLink>
      </div>

      <!-- Language Switcher Dropdown (Zero Emojis per AGENTS.md) -->
      <div ref="langMenuRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-md border border-border-subtle bg-surface-card text-ink text-xs font-medium cursor-pointer hover:bg-surface-hover transition-colors"
          title="Switch display language"
          aria-label="Switch display language"
          @click="langMenuOpen = !langMenuOpen; userMenuOpen = false"
        >
          <UIcon name="i-heroicons-language" class="w-4 h-4 text-ink-tertiary shrink-0" />
          <span class="font-mono font-bold text-[11px] uppercase">{{ activeLocaleOption?.code }}</span>
          <span class="hidden md:inline text-xs">{{ activeLocaleOption?.native }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        </button>

        <div v-if="langMenuOpen" class="absolute right-0 mt-1.5 w-[210px] bg-surface-card border border-border-subtle rounded-lg shadow-md py-1 z-50 max-w-[calc(100vw-24px)]">
          <div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-tertiary border-b border-border-subtle">
            Display Language
          </div>
          <button
            v-for="loc in supportedLocales"
            :key="loc.code"
            type="button"
            class="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors text-left"
            :class="currentLocale === loc.code ? 'bg-surface-hover text-ink font-semibold' : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'"
            @click="selectLanguage(loc.code)"
          >
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6.5 h-5 rounded bg-surface-inset border border-border-subtle font-mono text-[10px] font-bold text-ink">{{ loc.flag }}</span>
              <div class="flex flex-col text-left">
                <span class="font-medium text-xs">{{ loc.native }}</span>
                <span class="text-[10px] text-ink-tertiary">{{ loc.name }}</span>
              </div>
            </div>
            <UIcon
              v-if="currentLocale === loc.code"
              name="i-heroicons-check"
              class="w-4 h-4 text-ink"
            />
          </button>
          <div class="border-t border-border-subtle mt-1 pt-1">
            <NuxtLink
              to="/settings/translations"
              class="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink"
              @click="langMenuOpen = false"
            >
              <UIcon name="i-heroicons-cog-6-tooth" class="w-3.5 h-3.5" />
              <span>Manage Translations CMS</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- User Menu Dropdown -->
      <div ref="userMenuRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-8 px-1.5 sm:px-2 rounded-full border border-border-subtle bg-surface-card cursor-pointer hover:bg-surface-hover transition-colors"
          aria-label="User account menu"
          @click="userMenuOpen = !userMenuOpen; langMenuOpen = false"
        >
          <span class="w-6 h-6 rounded-full bg-ink text-white inline-flex items-center justify-center text-[11px] font-bold shrink-0">{{ userInitial }}</span>
          <span class="hidden md:inline text-xs font-medium text-ink max-w-[120px] truncate">{{ userName }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        </button>

        <div v-if="userMenuOpen" class="absolute right-0 mt-1.5 w-[205px] bg-surface-card border border-border-subtle rounded-lg shadow-md py-1 z-50 max-w-[calc(100vw-24px)]">
          <div class="px-3 py-2.5 border-b border-border-subtle">
            <p class="text-xs font-semibold text-ink truncate">{{ userName }}</p>
            <p class="text-[11px] text-ink-tertiary truncate">{{ authStore.user?.email || userRole }}</p>
          </div>
          <NuxtLink
            to="/pos"
            class="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer transition-colors sm:hidden"
            @click="userMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 text-ink-tertiary" />
              <span>{{ t('common.open_pos', 'Open POS') }}</span>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/settings"
            class="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer transition-colors"
            @click="userMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-ink-tertiary" />
              <span>System Settings</span>
            </span>
          </NuxtLink>
          <NuxtLink
            to="/settings/terminals"
            class="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer transition-colors"
            @click="userMenuOpen = false"
          >
            <span class="flex items-center gap-2">
              <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 text-ink-tertiary" />
              <span>POS Registers</span>
            </span>
          </NuxtLink>
          <div class="border-t border-border-subtle mt-1 pt-1">
            <button
              type="button"
              class="w-full px-3 py-2 flex items-center justify-between gap-2 text-xs text-status-red hover:bg-status-red-bg hover:text-status-red cursor-pointer transition-colors text-left"
              @click="handleLogout"
            >
              <span class="flex items-center gap-2">
                <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
                <span>{{ t('common.sign_out', 'Sign out') }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SupportedLocale } from '~/types'

const route = useRoute()
const authStore = useAuthStore()
const { isCollapsed, currentRouteContext, toggleMobileSidebar } = useSidebar()
const {
  currentLocale,
  supportedLocales,
  activeLocaleOption,
  initLocale,
  fetchTranslations,
  setLocale,
  t,
} = useAppTranslation()

const langMenuOpen = ref(false)
const userMenuOpen = ref(false)
const langMenuRef = ref<HTMLElement | null>(null)
const userMenuRef = ref<HTMLElement | null>(null)

const userName = computed(() => authStore.user?.full_name || 'Admin')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userRole = computed(() => authStore.user?.roles?.[0]?.name || 'Administrator')

function selectLanguage(code: SupportedLocale) {
  setLocale(code)
  langMenuOpen.value = false
}

async function handleLogout() {
  userMenuOpen.value = false
  await authStore.logout()
  await navigateTo('/login')
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (langMenuRef.value && !langMenuRef.value.contains(target)) {
    langMenuOpen.value = false
  }
  if (userMenuRef.value && !userMenuRef.value.contains(target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  initLocale()
  fetchTranslations()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
