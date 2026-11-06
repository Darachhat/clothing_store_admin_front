<template>
  <div class="admin-shell">
    <!-- Unified Sidebar Component -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="admin-main" :class="{ 'is-sidebar-collapsed': isCollapsed }">
      <header class="admin-topbar">
        <!-- Left: Mobile Toggle + Breadcrumb Context -->
        <div class="topbar-left">
          <button
            type="button"
            class="topbar-mobile-btn"
            aria-label="Open navigation menu"
            @click="toggleMobileSidebar"
          >
            <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
          </button>

          <nav class="topbar-context" aria-label="Current section">
            <span class="topbar-context__group">{{ currentRouteContext.groupLabel }}</span>
            <UIcon name="i-heroicons-chevron-right" class="w-3.5 h-3.5 text-gray-400" />
            <NuxtLink :to="currentRouteContext.itemTo" class="topbar-context__page">
              <UIcon :name="currentRouteContext.icon" class="w-4 h-4 text-gray-500" />
              <span>{{ currentRouteContext.itemLabel }}</span>
            </NuxtLink>
          </nav>
        </div>

        <!-- Right: Quick Nav + Language Selector + User Menu -->
        <div class="topbar-right">
          <!-- Quick Operational Shortcuts -->
          <div class="topbar-quick-links">
            <NuxtLink
              to="/settings/terminals"
              class="topbar-pill"
              :class="{ 'is-active': route.path === '/settings/terminals' }"
              title="Monitor POS Registers & Shifts"
            >
              <UIcon name="i-heroicons-computer-desktop" class="w-3.5 h-3.5" />
              <span>POS Registers</span>
            </NuxtLink>
            <NuxtLink
              to="/products/new"
              class="topbar-pill"
              title="Create a new product"
            >
              <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5" />
              <span>New Product</span>
            </NuxtLink>
          </div>

          <!-- Language Switcher Dropdown (Zero Emojis per AGENTS.md) -->
          <div ref="langMenuRef" class="relative">
            <button
              type="button"
              class="topbar-btn"
              title="Switch display language"
              @click="langMenuOpen = !langMenuOpen; userMenuOpen = false"
            >
              <UIcon name="i-heroicons-language" class="w-4 h-4 text-gray-500" />
              <span class="font-mono font-bold text-[11px] uppercase">{{ activeLocaleOption?.code }}</span>
              <span class="hidden sm:inline text-xs">{{ activeLocaleOption?.native }}</span>
              <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-gray-400" />
            </button>

            <div v-if="langMenuOpen" class="topbar-dropdown topbar-dropdown--lang">
              <div class="topbar-dropdown__header">
                Display Language
              </div>
              <button
                v-for="loc in supportedLocales"
                :key="loc.code"
                type="button"
                class="topbar-dropdown__item"
                :class="{ 'is-selected': currentLocale === loc.code }"
                @click="selectLanguage(loc.code)"
              >
                <div class="flex items-center gap-2">
                  <span class="lang-code-badge">{{ loc.flag }}</span>
                  <div class="flex flex-col text-left">
                    <span class="font-medium text-xs">{{ loc.native }}</span>
                    <span class="text-[10px] text-gray-400">{{ loc.name }}</span>
                  </div>
                </div>
                <UIcon
                  v-if="currentLocale === loc.code"
                  name="i-heroicons-check"
                  class="w-4 h-4 text-gray-900"
                />
              </button>
              <div class="topbar-dropdown__footer">
                <NuxtLink
                  to="/settings/translations"
                  class="topbar-dropdown__footer-link"
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
              class="topbar-user-trigger"
              aria-label="User account menu"
              @click="userMenuOpen = !userMenuOpen; langMenuOpen = false"
            >
              <span class="topbar-user-avatar">{{ userInitial }}</span>
              <span class="hidden md:inline text-xs font-medium text-gray-700 max-w-[120px] truncate">{{ userName }}</span>
              <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-gray-400" />
            </button>

            <div v-if="userMenuOpen" class="topbar-dropdown topbar-dropdown--user">
              <div class="px-3 py-2.5 border-b border-gray-100">
                <p class="text-xs font-semibold text-gray-900 truncate">{{ userName }}</p>
                <p class="text-[11px] text-gray-500 truncate">{{ authStore.user?.email || userRole }}</p>
              </div>
              <NuxtLink
                to="/settings"
                class="topbar-dropdown__item"
                @click="userMenuOpen = false"
              >
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-gray-500" />
                  <span>System Settings</span>
                </span>
              </NuxtLink>
              <NuxtLink
                to="/settings/terminals"
                class="topbar-dropdown__item"
                @click="userMenuOpen = false"
              >
                <span class="flex items-center gap-2">
                  <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 text-gray-500" />
                  <span>POS Registers</span>
                </span>
              </NuxtLink>
              <div class="border-t border-gray-100 mt-1 pt-1">
                <button
                  type="button"
                  class="topbar-dropdown__item text-red-600 w-full"
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

      <main class="admin-content">
        <slot />
      </main>
    </div>

    <!-- Global Toast Notification Container -->
    <AppToast />
  </div>
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

<style scoped>
.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.topbar-mobile-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  color: var(--text-secondary, #475569);
  cursor: pointer;
}

@media (max-width: 768px) {
  .topbar-mobile-btn {
    display: inline-flex;
  }
}

.topbar-context {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  min-width: 0;
}

.topbar-context__group {
  color: var(--text-tertiary, #64748b);
  font-weight: 500;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .topbar-context__group {
    display: none;
  }
}

.topbar-context__page {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.topbar-quick-links {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 900px) {
  .topbar-quick-links {
    display: none;
  }
}

.topbar-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
  color: var(--text-secondary, #475569);
  font-size: 12px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
}

.topbar-pill:hover,
.topbar-pill.is-active {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.topbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.12s;
}

.topbar-btn:hover {
  background: var(--surface-hover, #f1f5f9);
}

.topbar-user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 8px 0 4px;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-card, #ffffff);
  cursor: pointer;
  transition: background 0.12s;
}

.topbar-user-trigger:hover {
  background: var(--surface-hover, #f1f5f9);
}

.topbar-user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.topbar-dropdown {
  position: absolute;
  right: 0;
  margin-top: 6px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08));
  padding: 4px 0;
  z-index: 50;
}

.topbar-dropdown--lang {
  width: 210px;
}

.topbar-dropdown--user {
  width: 200px;
}

.topbar-dropdown__header {
  padding: 6px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-tertiary, #64748b);
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}

.topbar-dropdown__item {
  width: 100%;
  padding: 7px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary, #475569);
  background: transparent;
  border: none;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.topbar-dropdown__item:hover,
.topbar-dropdown__item.is-selected {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.lang-code-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 20px;
  border-radius: var(--radius-sm, 4px);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.topbar-dropdown__footer {
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  margin-top: 4px;
  padding-top: 4px;
}

.topbar-dropdown__footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  text-decoration: none;
}

.topbar-dropdown__footer-link:hover {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}
</style>
