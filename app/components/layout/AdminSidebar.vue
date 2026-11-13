<template>
  <div>
    <!-- Mobile Backdrop (offcanvas mode on < md) -->
    <Transition
      enter-active-class="transition-opacity duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileOpen"
        class="fixed inset-0 bg-navy-deep/50 z-45 md:hidden no-print"
        aria-hidden="true"
        @click="closeMobileSidebar"
      />
    </Transition>

    <aside
      :data-state="effectiveRail ? 'collapsed' : 'expanded'"
      :data-collapsible="effectiveRail ? 'icon' : ''"
      class="group/sidebar relative fixed inset-y-0 left-0 z-50 md:z-30 h-dvh flex flex-col shrink-0 bg-navy text-white border-r border-white/10 transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:self-start no-print select-none"
      :class="[
        effectiveRail ? 'w-16' : 'w-[256px]',
        isMobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
        customClass,
      ]"
      :aria-label="ariaLabel || 'Main navigation'"
    >
      <!-- ─── #header Slot: BRAND_MODEL Identity & Collapse Trigger ────────── -->
      <div
        data-slot="header"
        class="h-14 px-3 flex items-center justify-between gap-2 border-b border-white/10 shrink-0"
      >
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-2.5 min-w-0 no-underline flex-1"
          :class="[effectiveRail && 'justify-center']"
          :title="String(config.public.appName || displayName || 'Clothing Store')"
          @click="closeMobileSidebar"
        >
          <div class="w-9 h-9 rounded-md bg-white/10 border border-white/15 text-white flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="brand.logo_url"
              :src="brand.logo_url"
              :alt="displayName"
              class="w-full h-full object-contain p-0.5 rounded"
            />
            <UIcon v-else name="i-heroicons-building-storefront" class="w-4.5 h-4.5 text-white" />
          </div>
          <div v-if="!effectiveRail" class="flex flex-col min-w-0 flex-1">
            <span class="font-medium text-[15px] text-white block truncate font-khmer leading-tight">
              {{ displayName }}
            </span>
            <span class="text-[11px] text-white/60 block truncate leading-tight mt-0.5">
              {{ branchName || 'Store Admin' }}
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop Collapse / Expand Button -->
        <button
          v-if="collapsible && !effectiveRail"
          type="button"
          class="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-md text-white/60 hover:bg-white/10 hover:text-white cursor-pointer shrink-0 transition-colors"
          aria-label="Collapse sidebar"
          title="Collapse sidebar"
          @click="toggleCollapse"
        >
          <UIcon name="i-heroicons-chevron-double-left" class="w-4 h-4" />
        </button>

        <!-- Mobile Close Drawer Button -->
        <button
          type="button"
          class="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-md text-white/80 hover:bg-white/10 hover:text-white cursor-pointer shrink-0"
          aria-label="Close navigation menu"
          @click="closeMobileSidebar"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- ─── #body Slot: Vertical Navigation Menu with Child Dropdowns ─ -->
      <nav
        data-slot="body"
        class="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-0.5"
        :aria-label="ariaLabel || 'Main navigation'"
      >
        <template v-for="(section, idx) in filteredNavSections" :key="section.key || section.title">
          <!-- Section Header -->
          <div
            v-if="!effectiveRail"
            class="px-2.5 pt-3.5 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/45 select-none first:pt-0.5"
          >
            {{ section.title }}
          </div>
          <div v-else-if="idx > 0" class="h-px my-2 bg-white/10 mx-1.5" />

          <template v-for="item in section.items" :key="item.to">
            <!-- Parent Item with Collapsible Child Pages Dropdown -->
            <div v-if="item.children && item.children.length" class="flex flex-col">
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                :class="[
                  isGroupActive(item)
                    ? 'bg-navy-deep text-gold font-medium'
                    : 'text-white/85 hover:bg-white/10 hover:text-white',
                  effectiveRail && 'justify-center px-0',
                ]"
                :aria-expanded="isGroupOpen(item.to)"
                :title="effectiveRail ? item.label : undefined"
                @click="onParentClick(item)"
              >
                <UIcon
                  :name="item.icon"
                  class="w-4.5 h-4.5 shrink-0"
                  :class="isGroupActive(item) ? 'text-gold' : 'text-white/75'"
                />
                <span v-show="!effectiveRail" class="truncate flex-1 text-left">{{ item.label }}</span>
                <span
                  v-if="!effectiveRail && item.badge"
                  class="text-[11px] font-medium bg-gold text-navy-deep px-1.5 py-0.5 rounded"
                >
                  {{ item.badge }}
                </span>
                <UIcon
                  v-show="!effectiveRail"
                  name="i-heroicons-chevron-down"
                  class="w-3.5 h-3.5 shrink-0 text-white/50 transition-transform duration-150"
                  :class="[isGroupOpen(item.to) ? 'rotate-180 text-white/80' : '']"
                />
              </button>

              <!-- Collapsible Child Links (Tree Branch) -->
              <div
                v-show="!effectiveRail && isGroupOpen(item.to)"
                class="ml-4 pl-2.5 mt-0.5 mb-1 border-l border-white/15 flex flex-col gap-0.5"
              >
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.to"
                  :to="child.to"
                  class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-colors no-underline"
                  :class="[
                    isActive(child.to, child.exact)
                      ? 'bg-navy-deep text-gold font-medium'
                      : 'text-white/70 hover:bg-white/10 hover:text-white font-normal',
                  ]"
                  @click="closeMobileSidebar"
                >
                  <UIcon
                    v-if="child.icon"
                    :name="child.icon"
                    class="w-3.5 h-3.5 shrink-0"
                    :class="isActive(child.to, child.exact) ? 'text-gold' : 'text-white/50'"
                  />
                  <span class="truncate flex-1">{{ child.label }}</span>
                </NuxtLink>
              </div>
            </div>

            <!-- Single Leaf Navigation Item -->
            <NuxtLink
              v-else
              :to="item.to"
              class="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors no-underline"
              :class="[
                isActive(item.to, item.exact)
                  ? 'bg-navy-deep text-gold font-medium'
                  : 'text-white/85 hover:bg-white/10 hover:text-white',
                effectiveRail && 'justify-center px-0',
              ]"
              :title="effectiveRail ? `${section.title}: ${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}` : undefined"
              @click="closeMobileSidebar"
            >
              <UIcon
                :name="item.icon"
                class="w-4.5 h-4.5 shrink-0"
                :class="isActive(item.to, item.exact) ? 'text-gold' : 'text-white/75'"
              />
              <span v-show="!effectiveRail" class="truncate flex-1">{{ item.label }}</span>
              <span
                v-if="!effectiveRail && item.badge"
                class="text-[11px] font-medium bg-gold text-navy-deep px-1.5 py-0.5 rounded"
              >
                {{ item.badge }}
              </span>
              <span
                v-else-if="!effectiveRail && item.shortcut"
                class="text-[10px] font-mono bg-white/10 text-white/70 px-1.5 py-0.5 rounded"
              >
                {{ item.shortcut }}
              </span>
            </NuxtLink>
          </template>
        </template>
      </nav>

      <!-- ─── #footer Slot: User Profile & Session Controls ──────────── -->
      <div
        data-slot="footer"
        class="p-2.5 border-t border-white/10 flex flex-col gap-1 shrink-0"
        :class="[effectiveRail && 'items-center']"
      >
        <div
          class="flex items-center gap-2.5 p-1.5 rounded-md w-full"
          :class="[effectiveRail ? 'justify-center p-0' : '']"
          :title="effectiveRail ? `${userName} (${userRole})` : undefined"
        >
          <div class="w-8 h-8 rounded-md bg-white/15 border border-white/20 text-white flex items-center justify-center text-xs font-medium shrink-0">
            {{ userInitials }}
          </div>
          <div v-show="!effectiveRail" class="min-w-0 flex-1">
            <div class="text-sm font-medium text-white truncate leading-tight" :title="userName">
              {{ userName }}
            </div>
            <div class="text-[11px] text-white/60 truncate leading-tight mt-0.5">
              {{ userRole }}
            </div>
          </div>
          <button
            v-if="!effectiveRail && showShortcuts"
            type="button"
            class="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer text-white/70 hover:bg-white/10 hover:text-white shrink-0"
            title="Keyboard Shortcuts [?]"
            @click="$emit('shortcuts')"
          >
            <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium transition-colors text-white/80 hover:bg-status-red-bg hover:text-white cursor-pointer"
          :class="[effectiveRail && 'justify-center px-0']"
          :title="effectiveRail ? t('common.sign_out', 'Sign out') : undefined"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4.5 h-4.5 shrink-0" />
          <span v-show="!effectiveRail">{{ t('common.sign_out', 'Sign out') }}</span>
        </button>
      </div>

      <!-- ─── #rail Slot: Nuxt UI Edge Rail Toggle Handle ────────────── -->
      <button
        v-if="collapsible"
        type="button"
        data-slot="rail"
        aria-label="Toggle Sidebar"
        :tabindex="-1"
        :title="effectiveRail ? 'Expand sidebar' : 'Collapse sidebar'"
        class="hidden md:block absolute inset-y-0 -right-1.5 w-3 z-20 cursor-ew-resize after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-gold/60 transition-colors"
        @click="toggleCollapse"
      />
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useSidebar, type NavItem, type NavSection } from '~/composables/useSidebar'
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
const { brand, displayName, loadBrand } = useBrand()

onMounted(() => {
  loadBrand()
})

const route = useRoute()
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

// Track open/closed state of parent dropdown groups by item.to
const openGroupMap = ref<Record<string, boolean>>({})

function isGroupOpen(to: string): boolean {
  return !!openGroupMap.value[to]
}

function toggleGroup(to: string) {
  openGroupMap.value = {
    ...openGroupMap.value,
    [to]: !openGroupMap.value[to],
  }
}

function isGroupActive(item: NavItem): boolean {
  if (item.children?.length) {
    return item.children.some(c => isActive(c.to, c.exact))
  }
  return isActive(item.to, item.exact)
}

function onParentClick(item: NavItem) {
  if (effectiveRail.value) {
    // When in compact icon rail mode, clicking a parent group expands the sidebar and opens that group
    toggleCollapse()
    openGroupMap.value = {
      ...openGroupMap.value,
      [item.to]: true,
    }
    return
  }
  toggleGroup(item.to)
}

const isRail = computed(() => {
  if (props.mode === 'rail') return true
  if (props.mode === 'full') return false
  if (props.modelValue !== undefined) return props.modelValue
  if (props.defaultCollapsed !== undefined) return internalCollapsed.value
  return globalCollapsed.value
})

// When open as a mobile drawer, always render full labels
const effectiveRail = computed(() => (isMobileOpen.value ? false : isRail.value))

function toggleCollapse() {
  const nextVal = !isRail.value
  internalCollapsed.value = nextVal
  emit('update:modelValue', nextVal)
  if (props.defaultCollapsed === undefined && props.modelValue === undefined) {
    globalToggle()
  }
}

function canAccessItem(item: NavItem): boolean {
  if (authStore.isAdmin) return true
  if (!item.permission) return true
  return authStore.hasPermission(item.permission)
}

const filteredNavSections = computed<NavSection[]>(() => {
  const sections = unref(navSections) || []
  const filtered = sections
    .map((sec) => {
      const items: NavItem[] = []
      for (const item of sec.items) {
        if (item.children?.length) {
          const allowedChildren = item.children.filter(c => canAccessItem(c))
          if (allowedChildren.length > 0) {
            items.push({
              ...item,
              children: allowedChildren,
            })
          }
        } else if (canAccessItem(item)) {
          items.push(item)
        }
      }
      return {
        ...sec,
        items,
      }
    })
    .filter(sec => sec.items.length > 0)

  // On dev showcase routes without an active auth session, display all nav sections for visual inspection
  if (filtered.length === 0 && route.path.startsWith('/dev')) {
    return [
      ...sections,
      {
        key: 'dev',
        title: 'Dev',
        items: [{ label: 'Components', to: '/dev/components', icon: 'i-heroicons-swatch', exact: true }],
      },
    ]
  }
  return filtered
})

// Auto-open the active parent group whenever route changes
watch(
  () => [route.path, filteredNavSections.value] as const,
  ([, sections]) => {
    const nextMap = { ...openGroupMap.value }
    let changed = false
    for (const sec of sections) {
      for (const item of sec.items) {
        if (item.children?.some(c => isActive(c.to, c.exact))) {
          if (!nextMap[item.to]) {
            nextMap[item.to] = true
            changed = true
          }
        }
      }
    }
    if (changed) {
      openGroupMap.value = nextMap
    }
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) internalCollapsed.value = val
  },
)

// Close mobile drawer automatically on route changes
watch(
  () => route.fullPath,
  () => {
    if (isMobileOpen.value) {
      closeMobileSidebar()
    }
  },
)

// Lock body scroll when mobile drawer is open
watch(
  isMobileOpen,
  (open) => {
    if (import.meta.client) {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  },
)

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

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isMobileOpen.value) {
    closeMobileSidebar()
  }
}

onMounted(() => {
  initSidebar()
  if (import.meta.client) {
    window.addEventListener('keydown', handleKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', handleKeydown)
    document.body.style.overflow = ''
  }
})
</script>
