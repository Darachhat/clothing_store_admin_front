<template>
  <div>
    <!-- Mobile Backdrop -->
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
      class="fixed inset-y-0 left-0 z-50 md:z-30 h-dvh flex flex-col shrink-0 bg-navy text-white transition-all duration-200 md:sticky md:top-0 md:self-start no-print"
      :class="[
        effectiveRail ? 'w-16' : 'w-[248px]',
        isMobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
        customClass,
      ]"
      :aria-label="ariaLabel || 'Main navigation'"
    >
      <!-- ─── Header: Brand Logo & Title ─────────────────────────────── -->
      <div class="h-14 px-3 flex items-center justify-between border-b border-white/10 shrink-0">
        <NuxtLink
          to="/dashboard"
          class="flex items-center gap-2.5 min-w-0 no-underline flex-1"
          :title="String(config.public.appName || 'Clothing Store')"
          @click="closeMobileSidebar"
        >
          <div class="w-9 h-9 rounded-md bg-white/10 text-white flex items-center justify-center shrink-0 overflow-hidden">
            <img
              v-if="brand.logo_url"
              :src="brand.logo_url"
              :alt="displayName"
              class="w-full h-full object-contain p-0.5 rounded"
            />
            <UIcon v-else name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
          </div>
          <div v-if="!effectiveRail" class="flex flex-col min-w-0">
            <span class="font-medium text-[15px] text-white block truncate font-khmer">
              {{ displayName }}
            </span>
            <span v-if="branchName" class="text-[11px] text-white/60 block truncate leading-tight">
              {{ branchName }}
            </span>
          </div>
        </NuxtLink>

        <!-- Desktop/Tablet Collapse / Expand Toggle Button -->
        <button
          v-if="collapsible"
          type="button"
          class="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-md text-white/70 hover:bg-white/10 hover:text-white cursor-pointer shrink-0"
          :aria-label="effectiveRail ? 'Expand sidebar' : 'Collapse sidebar'"
          :title="effectiveRail ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleCollapse"
        >
          <UIcon
            :name="effectiveRail ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
            class="w-3.5 h-3.5"
          />
        </button>

        <!-- Mobile Close Drawer Button -->
        <button
          type="button"
          class="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md text-white/80 hover:bg-white/10 hover:text-white cursor-pointer shrink-0"
          aria-label="Close navigation menu"
          @click="closeMobileSidebar"
        >
          <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
        </button>
      </div>

      <!-- ─── Navigation Sections ────────────────────────────────────── -->
      <nav class="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5" :aria-label="ariaLabel || 'Main navigation'">
        <template v-for="(section, idx) in filteredNavSections" :key="section.title">
          <div v-if="!effectiveRail" class="px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-white/50 select-none">
            {{ section.title }}
          </div>
          <div v-else-if="idx > 0" class="h-px my-2 bg-white/10 mx-2" />

          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="[
              isActive(item.to, item.exact)
                ? 'bg-navy-deep text-gold font-medium'
                : 'text-white/80 hover:bg-white/10 hover:text-white',
              effectiveRail && 'justify-center px-0'
            ]"
            :title="effectiveRail ? `${section.title}: ${item.label}${item.shortcut ? ` [${item.shortcut}]` : ''}` : undefined"
            @click="closeMobileSidebar"
          >
            <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
            <span v-show="!effectiveRail" class="truncate flex-1">{{ item.label }}</span>
            <span v-if="!effectiveRail && item.badge" class="text-xs font-medium bg-gold text-navy-deep px-1.5 py-0.5 rounded-full">{{ item.badge }}</span>
            <span v-else-if="!effectiveRail && item.shortcut" class="text-[10px] font-mono bg-white/10 text-white/70 px-1 py-0.5 rounded">{{ item.shortcut }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- ─── Bottom Footer Actions ──────────────────────────────────── -->
      <div class="p-2 border-t border-white/10 flex flex-col gap-1 shrink-0" :class="[effectiveRail && 'items-center']">
        <div
          class="flex items-center gap-2 p-1.5 rounded-md mb-1 w-full"
          :class="[effectiveRail ? 'justify-center p-0' : '']"
          :title="effectiveRail ? `${userName} (${userRole})` : undefined"
        >
          <div class="w-8 h-8 rounded-full bg-action text-white flex items-center justify-center text-sm font-medium shrink-0">
            {{ userInitials }}
          </div>
          <div v-show="!effectiveRail" class="min-w-0 flex-1">
            <div class="text-[15px] font-medium text-white truncate" :title="userName">
              {{ userName }}
            </div>
            <div class="text-[11px] text-white/60 truncate">
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
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
          :class="[effectiveRail && 'justify-center px-0']"
          :title="effectiveRail ? t('common.sign_out', 'Sign out') : undefined"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4 shrink-0" />
          <span v-show="!effectiveRail">{{ t('common.sign_out', 'Sign out') }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#app'
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

const filteredNavSections = computed(() => {
  const sections = unref(navSections) || []
  const filtered = sections
    .map(sec => ({
      ...sec,
      items: sec.items.filter(item => !item.permission || authStore.hasPermission(item.permission)),
    }))
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