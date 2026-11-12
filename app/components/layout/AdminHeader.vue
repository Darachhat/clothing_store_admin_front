<template>
  <header class="admin-topbar">
    <!-- Left: Mobile Toggle + App Name | Role Context (per Reference Header) -->
    <div class="flex items-center gap-2.5 min-w-0 flex-1">
      <button
        type="button"
        class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-subtle bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer shrink-0"
        aria-label="Open navigation menu"
        @click="toggleMobileSidebar"
      >
        <UIcon name="i-heroicons-bars-3" class="w-5 h-5" />
      </button>

      <nav class="flex items-center gap-2 text-sm min-w-0 overflow-hidden" aria-label="Current section">
        <span class="hidden lg:inline text-ink font-medium whitespace-nowrap font-khmer">{{ displayName }}</span>
        <span class="hidden lg:inline text-border-default">|</span>
        <span class="hidden sm:inline text-ink-secondary font-normal whitespace-nowrap">{{ currentRouteContext.groupLabel }}</span>
        <UIcon name="i-heroicons-chevron-right" class="hidden sm:inline w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        <NuxtLink :to="currentRouteContext.itemTo" class="inline-flex items-center gap-1.5 text-ink font-medium text-base whitespace-nowrap truncate min-w-0 no-underline">
          <UIcon :name="currentRouteContext.icon" class="w-4 h-4 text-ink-secondary shrink-0" />
          <span class="truncate">{{ currentRouteContext.itemLabel }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Right: Quick Nav + Notification Bell + Language Selector + User Menu (per Screenshots 1–9) -->
    <div class="flex items-center gap-2 shrink-0">
      <!-- Quick Operational Shortcuts -->
      <div class="hidden sm:flex items-center gap-1.5">
        <NuxtLink
          to="/pos"
          class="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle bg-surface-card text-ink-secondary text-sm font-medium hover:bg-surface-hover hover:text-ink transition-colors no-underline"
          title="Open Point of Sale Terminal"
          aria-label="Open Point of Sale Terminal"
        >
          <UIcon name="i-heroicons-computer-desktop" class="w-4 h-4 shrink-0" />
          <span class="hidden xl:inline">{{ t('common.open_pos', 'Open POS') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/settings/terminals"
          class="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-border-subtle bg-surface-card text-ink-secondary text-sm font-medium hover:bg-surface-hover hover:text-ink transition-colors no-underline"
          :class="[route.path === '/settings/terminals' && 'bg-navy text-white']"
          title="Monitor POS Registers & Shifts"
          aria-label="Monitor POS Registers & Shifts"
        >
          <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4 shrink-0" />
          <span class="hidden xl:inline">{{ t('nav.pos_registers', 'POS Registers') }}</span>
        </NuxtLink>
        <NuxtLink
          to="/products/new"
          class="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-action text-white text-sm font-medium hover:bg-action-hover transition-colors no-underline"
          title="Create a new product"
          aria-label="Create a new product"
        >
          <UIcon name="i-heroicons-plus" class="w-4 h-4 shrink-0" />
          <span class="hidden xl:inline">New Product</span>
        </NuxtLink>
      </div>

      <!-- Notification Bell Button (opens Notification Drawer per Screenshots 5 & 6) -->
      <button
        type="button"
        class="relative inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-subtle bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer transition-colors"
        title="Notifications"
        aria-label="Open notifications drawer"
        @click="openNotifDrawer"
      >
        <UIcon name="i-heroicons-bell" class="w-4.5 h-4.5" />
        <span
          v-if="unreadNotifications.length > 0"
          class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-red"
          aria-hidden="true"
        />
      </button>

      <!-- Language Switcher Dropdown -->
      <div ref="langMenuRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md border border-border-subtle bg-surface-card text-ink text-sm font-medium cursor-pointer hover:bg-surface-hover transition-colors"
          title="Switch display language"
          aria-label="Switch display language"
          @click="langMenuOpen = !langMenuOpen; userMenuOpen = false"
        >
          <UIcon name="i-heroicons-language" class="w-4 h-4 text-ink-tertiary shrink-0" />
          <span class="font-mono font-medium text-xs uppercase">{{ activeLocaleOption?.code }}</span>
          <span class="hidden md:inline text-xs">{{ activeLocaleOption?.native }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        </button>

        <div v-if="langMenuOpen" class="absolute right-0 mt-1.5 w-[220px] bg-surface-card border border-border-subtle rounded-lg shadow-menu py-1 z-50 max-w-[calc(100vw-24px)]">
          <div class="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-ink-tertiary border-b border-border-subtle">
            Display Language
          </div>
          <button
            v-for="loc in supportedLocales"
            :key="loc.code"
            type="button"
            class="w-full px-3 py-2.5 flex items-center justify-between gap-2 text-sm cursor-pointer transition-colors text-left"
            :class="currentLocale === loc.code ? 'bg-surface-hover text-ink font-medium' : 'text-ink-secondary hover:bg-surface-hover hover:text-ink'"
            @click="selectLanguage(loc.code)"
          >
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center justify-center w-6.5 h-5 rounded bg-surface-inset border border-border-subtle font-mono text-xs font-medium text-ink">{{ loc.flag }}</span>
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
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink no-underline"
              @click="langMenuOpen = false"
            >
              <UIcon name="i-heroicons-cog-6-tooth" class="w-3.5 h-3.5" />
              <span>Manage Translations CMS</span>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- User Menu Dropdown (per Screenshot 8) -->
      <div ref="userMenuRef" class="relative">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 h-9 pl-1 pr-2 sm:pr-2.5 rounded-full border border-border-subtle bg-surface-card cursor-pointer hover:bg-surface-hover transition-colors"
          aria-label="User account menu"
          @click="userMenuOpen = !userMenuOpen; langMenuOpen = false"
        >
          <span class="w-7 h-7 rounded-full bg-action text-white inline-flex items-center justify-center text-xs font-medium shrink-0">{{ userInitial }}</span>
          <span class="hidden md:inline text-sm font-medium text-ink max-w-[140px] truncate">{{ userName }}</span>
          <UIcon name="i-heroicons-chevron-down" class="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
        </button>

        <div v-if="userMenuOpen" class="absolute right-0 mt-1.5 w-[230px] bg-surface-card border border-border-subtle rounded-lg shadow-menu py-1.5 z-50 max-w-[calc(100vw-24px)]">
          <div class="px-3.5 py-2.5 border-b border-border-subtle">
            <p class="text-base font-medium text-ink truncate m-0">{{ userName }}</p>
            <p class="text-xs text-ink-tertiary truncate m-0 mt-0.5">{{ authStore.user?.email || userRole }}</p>
          </div>
          <NuxtLink
            to="/users"
            class="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-sm text-ink hover:bg-surface-hover cursor-pointer transition-colors no-underline"
            @click="userMenuOpen = false"
          >
            <UIcon name="i-heroicons-user-circle" class="w-4.5 h-4.5 text-ink-secondary" />
            <span>{{ t('common.account', 'Account & Users') }}</span>
          </NuxtLink>
          <NuxtLink
            to="/pos"
            class="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-sm text-ink hover:bg-surface-hover cursor-pointer transition-colors no-underline"
            @click="userMenuOpen = false"
          >
            <UIcon name="i-heroicons-arrows-right-left" class="w-4.5 h-4.5 text-ink-secondary" />
            <span>{{ t('common.open_pos', 'Switch to POS') }}</span>
          </NuxtLink>
          <button
            type="button"
            class="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-sm text-ink hover:bg-surface-hover cursor-pointer transition-colors text-left"
            @click="userMenuOpen = false; quickSettingsOpen = true"
          >
            <UIcon name="i-heroicons-cog-6-tooth" class="w-4.5 h-4.5 text-ink-secondary" />
            <span>{{ t('common.settings', 'Quick Settings') }}</span>
          </button>
          <div class="border-t border-border-subtle mt-1 pt-1">
            <button
              type="button"
              class="w-full px-3.5 py-2.5 flex items-center gap-2.5 text-sm text-status-red hover:bg-status-red-bg hover:text-white cursor-pointer transition-colors text-left"
              @click="handleLogout"
            >
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4.5 h-4.5" />
              <span>{{ t('common.sign_out', 'Sign out') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Notification Drawer (per Reference Screenshots 5 & 6) ──────────── -->
    <AppDetailDrawer
      v-model="notifDrawerOpen"
      title="Notifications"
      width="420px"
    >
      <div class="flex flex-col gap-3 -mt-1">
        <!-- All / Unread Pill Tabs + Actions Menu (Screenshot 5 & 6) -->
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-border-subtle">
          <div class="inline-flex items-center gap-1 p-1 bg-surface-inset rounded-full border border-border-subtle">
            <button
              type="button"
              class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
              :class="notifTab === 'all' ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
              @click="notifTab = 'all'"
            >
              All ({{ notifications.length }})
            </button>
            <button
              type="button"
              class="px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors"
              :class="notifTab === 'unread' ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
              @click="notifTab = 'unread'"
            >
              Unread ({{ unreadNotifications.length }})
            </button>
          </div>

          <div class="flex items-center gap-1">
            <button
              v-if="unreadNotifications.length > 0"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink cursor-pointer"
              title="Mark all as read"
              @click="markAllRead"
            >
              <UIcon name="i-heroicons-eye" class="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <NuxtLink
              to="/audit-logs"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink no-underline"
              @click="notifDrawerOpen = false"
            >
              <span>View all</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Notification Items List -->
        <div v-if="notifLoading" class="flex flex-col gap-2 py-4">
          <div v-for="i in 5" :key="i" class="h-14 bg-surface-inset animate-pulse rounded-lg" />
        </div>
        <div v-else-if="displayedNotifications.length === 0" class="py-12 text-center">
          <div class="w-11 h-11 rounded-full bg-surface-inset flex items-center justify-center mx-auto mb-2 text-ink-tertiary">
            <UIcon name="i-heroicons-bell-slash" class="w-5 h-5" />
          </div>
          <p class="text-sm font-medium text-ink m-0">No notifications</p>
          <p class="text-xs text-ink-tertiary m-0 mt-0.5">Recent sales, stock adjustments, and system events appear here.</p>
        </div>
        <div v-else class="flex flex-col divide-y divide-border-subtle -mx-2">
          <div
            v-for="item in displayedNotifications"
            :key="item.id"
            class="flex items-start gap-3 px-2.5 py-3 rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
            @click="markRead(item.id)"
          >
            <div class="relative shrink-0">
              <div class="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-xs font-medium">
                {{ (item.actor || 'S').charAt(0).toUpperCase() }}
              </div>
              <span
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                :class="item.tone === 'green' ? 'bg-status-green-bg' : item.tone === 'red' ? 'bg-status-red-bg' : 'bg-status-amber-bg'"
              >
                <UIcon :name="item.icon" class="w-2.5 h-2.5" />
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-normal text-ink m-0 leading-snug">
                <span class="font-medium">{{ item.actor }}</span>
                {{ ' ' + item.summary }}
              </p>
              <span class="text-xs text-ink-tertiary block mt-0.5">{{ item.timeAgo }}</span>
            </div>
            <span v-if="!readIds.includes(item.id)" class="w-2 h-2 rounded-full bg-status-green-bg shrink-0 mt-2" />
          </div>
        </div>
      </div>
    </AppDetailDrawer>

    <!-- ─── Quick Settings Drawer (per Reference Screenshot 7) ─────────────── -->
    <AppDetailDrawer
      v-model="quickSettingsOpen"
      title="System Preferences"
      subtitle="Language, display scale, and store configuration"
      width="420px"
    >
      <div class="flex flex-col border border-border-subtle rounded-xl divide-y divide-border-subtle bg-surface-card overflow-hidden">
        <!-- Row 1: Language -->
        <div class="flex items-center justify-between gap-3 p-4">
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-heroicons-language" class="w-5 h-5 text-ink-secondary shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink">Display Language</div>
              <div class="text-xs text-ink-tertiary">Khmer or English interface</div>
            </div>
          </div>
          <div class="inline-flex items-center gap-1 p-0.5 bg-surface-inset border border-border-subtle rounded-md shrink-0">
            <button
              v-for="loc in supportedLocales"
              :key="loc.code"
              type="button"
              class="px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-colors"
              :class="currentLocale === loc.code ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink'"
              @click="selectLanguage(loc.code)"
            >
              {{ loc.flag }}
            </button>
          </div>
        </div>

        <!-- Row 2: Sidebar Mode -->
        <div class="flex items-center justify-between gap-3 p-4">
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-heroicons-view-columns" class="w-5 h-5 text-ink-secondary shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink">Navigation Rail</div>
              <div class="text-xs text-ink-tertiary">Expand or collapse sidebar</div>
            </div>
          </div>
          <button
            type="button"
            class="px-3 py-1.5 rounded-md border border-border-default bg-surface-card text-xs font-medium text-ink hover:bg-surface-hover cursor-pointer"
            @click="toggleSidebar()"
          >
            {{ isCollapsed ? 'Expanded' : 'Compact Rail' }}
          </button>
        </div>

        <!-- Row 3: Font Scale -->
        <div class="flex items-center justify-between gap-3 p-4">
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-heroicons-bars-3-bottom-left" class="w-5 h-5 text-ink-secondary shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink">Font Size</div>
              <div class="text-xs text-ink-tertiary">Adjust system text scale</div>
            </div>
          </div>
          <select
            v-model="fontScale"
            aria-label="System font size"
            class="h-8 px-2.5 rounded-md border border-border-default bg-surface-card text-xs font-medium text-ink outline-none cursor-pointer"
            @change="applyFontScale"
          >
            <option value="13px">13px (Compact)</option>
            <option value="14px">14px (Default)</option>
            <option value="15px">15px (Comfortable)</option>
            <option value="16px">16px (Large)</option>
          </select>
        </div>

        <!-- Row 4: Brand & Receipt Settings Link -->
        <NuxtLink
          to="/settings/brand"
          class="flex items-center justify-between gap-3 p-4 hover:bg-surface-hover transition-colors no-underline"
          @click="quickSettingsOpen = false"
        >
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-heroicons-sparkles" class="w-5 h-5 text-ink-secondary shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink">Brand &amp; Identity</div>
              <div class="text-xs text-ink-tertiary">Store name, logo, and receipt header</div>
            </div>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
        </NuxtLink>

        <!-- Row 5: System Settings Link -->
        <NuxtLink
          to="/settings"
          class="flex items-center justify-between gap-3 p-4 hover:bg-surface-hover transition-colors no-underline"
          @click="quickSettingsOpen = false"
        >
          <div class="flex items-center gap-3 min-w-0">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-5 h-5 text-ink-secondary shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-ink">All System Settings</div>
              <div class="text-xs text-ink-tertiary">Currency, tax, branches, and integrations</div>
            </div>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
        </NuxtLink>
      </div>
    </AppDetailDrawer>
  </header>
</template>

<script setup lang="ts">
import type { SupportedLocale } from '~/types'

const route = useRoute()
const authStore = useAuthStore()
const { displayName } = useBrand()
const { isCollapsed, currentRouteContext, toggleMobileSidebar, toggleSidebar } = useSidebar()
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
const notifDrawerOpen = ref(false)
const quickSettingsOpen = ref(false)
const notifTab = ref<'all' | 'unread'>('all')
const notifLoading = ref(false)
const fontScale = ref('14px')

const langMenuRef = ref<HTMLElement | null>(null)
const userMenuRef = ref<HTMLElement | null>(null)

interface NotifItem {
  id: string
  actor: string
  summary: string
  timeAgo: string
  tone: 'green' | 'amber' | 'red'
  icon: string
}

const notifications = ref<NotifItem[]>([])
const readIds = ref<string[]>([])

const unreadNotifications = computed(() =>
  notifications.value.filter(n => !readIds.value.includes(n.id)),
)

const displayedNotifications = computed(() =>
  notifTab.value === 'unread' ? unreadNotifications.value : notifications.value,
)

const userName = computed(() => authStore.user?.full_name || 'Admin')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userRole = computed(() => authStore.user?.roles?.[0]?.name || 'Administrator')

function formatTimeAgo(dateStr?: string) {
  if (!dateStr) return 'just now'
  const diffSec = Math.max(1, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000))
  if (diffSec < 60) return `${diffSec}s`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`
  return `${Math.floor(diffSec / 86400)}d`
}

async function loadNotifications() {
  if (!authStore.accessToken) return
  notifLoading.value = true
  try {
    const auditApi = useAuditApi()
    const res = await auditApi.listAuditLogs({ limit: 15 }).catch(() => [])
    const rows = Array.isArray(res) ? res : []
    notifications.value = rows.map((r: any, idx: number) => {
      const action = String(r.action || 'EVENT')
      const isSale = action.includes('SALE') || action.includes('PAID') || action.includes('RECEIVE')
      const isErr = action.includes('CANCEL') || action.includes('DELETE') || action.includes('VOID')
      return {
        id: String(r.id || idx),
        actor: r.user_name || (r.user_id ? `User ${String(r.user_id).slice(0, 6)}` : userName.value),
        summary: `${action.replace(/_/g, ' ').toLowerCase()} ${r.entity_type ? `(${r.entity_type})` : ''}`,
        timeAgo: formatTimeAgo(r.created_at),
        tone: isErr ? 'red' : isSale ? 'green' : 'amber',
        icon: isErr ? 'i-heroicons-exclamation-triangle' : isSale ? 'i-heroicons-banknotes' : 'i-heroicons-plus',
      }
    })
  } finally {
    notifLoading.value = false
  }
}

function openNotifDrawer() {
  langMenuOpen.value = false
  userMenuOpen.value = false
  notifDrawerOpen.value = true
  loadNotifications()
}

function markRead(id: string) {
  if (!readIds.value.includes(id)) {
    readIds.value.push(id)
  }
}

function markAllRead() {
  readIds.value = notifications.value.map(n => n.id)
}

function applyFontScale() {
  if (import.meta.client) {
    document.documentElement.style.fontSize = fontScale.value
    localStorage.setItem('admin-font-scale', fontScale.value)
  }
}

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
  if (import.meta.client) {
    const savedScale = localStorage.getItem('admin-font-scale')
    if (savedScale) {
      fontScale.value = savedScale
      document.documentElement.style.fontSize = savedScale
    }
  }
  loadNotifications()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
