<template>
  <div>
    <!-- Mobile Backdrop -->
    <Transition name="fade">
      <div
        v-if="isMobileOpen"
        class="sidebar-mobile-backdrop no-print"
        @click="closeMobileSidebar"
      />
    </Transition>

    <aside
      class="admin-sidebar app-sidebar no-print"
      :class="[
        isRail ? 'is-collapsed app-sidebar--rail' : 'app-sidebar--full',
        { 'is-mobile-open': isMobileOpen },
        customClass,
      ]"
      :aria-label="ariaLabel || 'Main navigation'"
    >
      <!-- ─── Header: Brand Logo & Title ─────────────────────────────── -->
      <div class="sidebar-brand app-sidebar__header">
        <NuxtLink
          to="/dashboard"
          class="app-sidebar__brand flex items-center gap-2.5 min-w-0 no-underline flex-1"
          :title="String(config.public.appName || 'Clothing Store')"
          @click="closeMobileSidebar"
        >
          <div class="sidebar-brand-mark app-sidebar__logo-mark">
            <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
          </div>
          <div v-if="!isRail" class="app-sidebar__brand-meta min-w-0">
            <span class="sidebar-brand-name app-sidebar__brand-name block truncate">
              {{ config.public.appName || 'Clothing Store' }}
            </span>
            <span v-if="branchName" class="app-sidebar__brand-branch block truncate">
              {{ branchName }}
            </span>
          </div>
        </NuxtLink>

        <!-- Collapse / Expand Toggle Button -->
        <button
          v-if="collapsible"
          type="button"
          class="sidebar-collapse-btn app-sidebar__toggle-btn"
          :title="isRail ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleCollapse"
        >
          <UIcon
            :name="isRail ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
            class="w-3.5 h-3.5"
          />
        </button>
      </div>

      <!-- ─── Navigation Sections ────────────────────────────────────── -->
      <nav class="sidebar-nav app-sidebar__full-nav" :aria-label="ariaLabel || 'Main navigation'">
        <template v-for="(section, idx) in filteredNavSections" :key="section.title">
          <div v-if="!isRail" class="sidebar-section-label app-sidebar__section-title">
            {{ section.title }}
          </div>
          <div v-else-if="idx > 0" class="sidebar-section-divider" />

          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="nav-item app-sidebar__nav-link"
            :class="{ active: isActive(item.to, item.exact), 'is-active': isActive(item.to, item.exact) }"
            :title="isRail ? `${section.title}: ${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}` : undefined"
            @click="closeMobileSidebar"
          >
            <UIcon :name="item.icon" class="nav-icon" />
            <span v-show="!isRail" class="app-sidebar__nav-label truncate flex-1">{{ item.label }}</span>
            <span v-if="!isRail && item.badge" class="app-sidebar__nav-badge">{{ item.badge }}</span>
            <span v-else-if="!isRail && item.shortcut" class="app-sidebar__nav-shortcut">{{ item.shortcut }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- ─── Bottom Footer Actions ──────────────────────────────────── -->
      <div class="sidebar-footer app-sidebar__footer" :class="{ 'is-rail': isRail }">
        <div
          class="sidebar-user-card"
          :class="{ 'is-collapsed': isRail }"
          :title="isRail ? `${userName} (${userRole})` : undefined"
        >
          <div class="sidebar-user-avatar app-sidebar__user-avatar">
            {{ userInitials }}
          </div>
          <div v-show="!isRail" class="min-w-0 flex-1">
            <div class="sidebar-user-name truncate" :title="userName">
              {{ userName }}
            </div>
            <div class="sidebar-user-role truncate">
              {{ userRole }}
            </div>
          </div>
          <button
            v-if="!isRail && showShortcuts"
            type="button"
            class="app-sidebar__logout-btn"
            title="Keyboard Shortcuts [?]"
            @click="$emit('shortcuts')"
          >
            <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          class="nav-item sidebar-signout-btn"
          :title="isRail ? t('common.sign_out', 'Sign out') : undefined"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="nav-icon" />
          <span v-show="!isRail">{{ t('common.sign_out', 'Sign out') }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch, onMounted } from 'vue'
import { useRouter, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useSidebar } from '~/composables/useSidebar'
import { useAppTranslation } from '~/composables/useAppTranslation'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    mode?: 'full' | 'rail' | 'auto'
    defaultCollapsed?: boolean
    collapsible?: boolean
    customClass?: string
    showShortcuts?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: undefined,
    mode: 'auto',
    defaultCollapsed: undefined,
    collapsible: true,
    customClass: '',
    showShortcuts: false,
    ariaLabel: 'Main navigation',
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shortcuts'): void
  (e: 'logout'): void
}>()

const config = useRuntimeConfig()
const authStore = useAuthStore()
const router = useRouter()
const { t } = useAppTranslation()
const {
  isCollapsed: globalCollapsed,
  isMobileOpen,
  navSections,
  initSidebar,
  toggleSidebar: globalToggle,
  closeMobileSidebar,
  isActive,
} = useSidebar()

const internalCollapsed = ref(
  props.defaultCollapsed !== undefined ? props.defaultCollapsed : globalCollapsed.value,
)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) internalCollapsed.value = val
  },
)

const isRail = computed(() => {
  if (props.mode === 'rail') return true
  if (props.mode === 'full') return false
  if (props.modelValue !== undefined) return props.modelValue
  if (props.defaultCollapsed !== undefined) return internalCollapsed.value
  return globalCollapsed.value
})

function toggleCollapse() {
  const nextVal = !isRail.value
  internalCollapsed.value = nextVal
  emit('update:modelValue', nextVal)
  if (props.defaultCollapsed === undefined && props.modelValue === undefined) {
    globalToggle()
  }
}

const filteredNavSections = computed(() => {
  const sections = unref(navSections) || []
  return sections
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => !item.permission || authStore.hasPermission(item.permission)),
    }))
    .filter(sec => sec.items.length > 0)
})

const branchName = computed(() => {
  return (authStore.currentUser as any)?.branch?.name || ''
})

const userName = computed(() => {
  return authStore.currentUser?.full_name || authStore.currentUser?.username || 'Admin'
})

const userRole = computed(() => {
  const roles = authStore.currentUser?.roles?.map((r: any) => r.name) ?? []
  return roles.length > 0 ? roles.join(', ') : 'Administrator'
})

const userInitials = computed(() => {
  const name = userName.value
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0])
      .join('')
      .toUpperCase() || 'A'
  )
})

async function onLogout() {
  closeMobileSidebar()
  emit('logout')
  try {
    await authStore.logout()
  } catch (err) {
    console.error('Logout error:', err)
  }
  await router.push('/login')
}

onMounted(() => {
  initSidebar()
})
</script>

<style scoped>
.sidebar-mobile-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sidebar-mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(1px);
    z-index: 35;
  }
}

.app-sidebar__brand-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-sidebar__brand-branch {
  font-size: 10px;
  color: var(--text-tertiary, #64748b);
  line-height: 1.2;
}

.app-sidebar__nav-shortcut {
  font-size: 10px;
  font-family: var(--font-mono, monospace);
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-tertiary, #64748b);
  padding: 1px 4px;
  border-radius: 3px;
}

.app-sidebar__nav-badge {
  font-size: 10px;
  font-weight: 600;
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  padding: 1px 6px;
  border-radius: 999px;
}

.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-md, 6px);
}

.sidebar-user-card.is-collapsed {
  justify-content: center;
  padding: 6px 0;
}

.sidebar-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.sidebar-user-role {
  font-size: 10.5px;
  color: var(--text-tertiary, #64748b);
}

.app-sidebar__logout-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm, 4px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary, #64748b);
  background: none;
  border: none;
  flex-shrink: 0;
}

.app-sidebar__logout-btn:hover {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.sidebar-signout-btn {
  color: var(--status-red, #b91c1c) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
