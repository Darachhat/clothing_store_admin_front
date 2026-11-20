<!-- MobileTabBar — CDC-style bottom tab navigation with expandable "More" tray (< md) -->
<template>
  <nav
    class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-card border-t border-subtle shadow-[0_-4px_16px_rgba(15,23,42,0.08)] no-print select-none"
    aria-label="Mobile quick navigation"
  >
    <!-- Expandable "More" Secondary Row -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="moreOpen && overflowTabs.length > 0"
        class="grid grid-cols-4 border-b border-subtle bg-surface-inset px-1 py-1.5"
      >
        <NuxtLink
          v-for="item in overflowTabs"
          :key="item.to"
          :to="item.to"
          class="relative flex flex-col items-center justify-center py-1.5 px-1 gap-1 no-underline rounded-lg transition-colors"
          :class="isActive(item.to, item.exact) ? 'text-navy font-semibold' : 'text-ink-secondary hover:text-ink'"
          @click="moreOpen = false"
        >
          <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
          <span class="text-[11px] leading-tight truncate max-w-full">{{ item.label }}</span>
          <span
            v-if="isActive(item.to, item.exact)"
            class="absolute bottom-0 inset-x-1/4 h-0.5 rounded-t bg-navy"
          />
        </NuxtLink>
      </div>
    </Transition>

    <!-- Primary 4-Column Bottom Bar -->
    <div class="grid grid-cols-4 px-1 py-1">
      <NuxtLink
        v-for="item in primaryTabs"
        :key="item.to"
        :to="item.to"
        class="relative flex flex-col items-center justify-center py-1.5 px-1 gap-1 no-underline rounded-lg transition-colors"
        :class="isActive(item.to, item.exact) ? 'text-navy font-semibold' : 'text-ink-secondary hover:text-ink'"
        @click="moreOpen = false"
      >
        <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
        <span class="text-[11px] leading-tight truncate max-w-full">{{ item.label }}</span>
        <span
          v-if="isActive(item.to, item.exact)"
          class="absolute bottom-0 inset-x-1/4 h-0.5 rounded-t bg-navy"
        />
      </NuxtLink>

      <!-- "More" Toggle Button -->
      <button
        type="button"
        class="relative flex flex-col items-center justify-center py-1.5 px-1 gap-1 bg-transparent border-0 cursor-pointer rounded-lg transition-colors border-l border-subtle"
        :class="moreActive ? 'text-navy font-semibold' : 'text-ink-secondary hover:text-ink'"
        :aria-expanded="moreOpen"
        @click="moreOpen = !moreOpen"
      >
        <UIcon name="i-heroicons-squares-plus" class="w-5 h-5 shrink-0" />
        <span class="inline-flex items-center gap-0.5 text-[11px] leading-tight">
          <span>{{ t('common.more', 'More') }}</span>
          <UIcon
            name="i-heroicons-chevron-up"
            class="w-3 h-3 transition-transform duration-200"
            :class="moreOpen ? 'rotate-180' : ''"
          />
        </span>
        <span
          v-if="moreActive"
          class="absolute bottom-0 inset-x-1/4 h-0.5 rounded-t bg-navy"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from '#app'
import { useSidebar } from '~/composables/useSidebar'
import { useAppTranslation } from '~/composables/useAppTranslation'

const route = useRoute()
const { isActive } = useSidebar()
const { t } = useAppTranslation()

const moreOpen = ref(false)

const primaryTabs = computed(() => [
  { label: t('nav.dashboard', 'Dashboard'), to: '/dashboard', icon: 'i-heroicons-squares-2x2', exact: true },
  { label: t('nav.sales_orders', 'Sales'), to: '/sales', icon: 'i-heroicons-receipt-percent', exact: false },
  { label: t('nav.products', 'Products'), to: '/products', icon: 'i-heroicons-tag', exact: false },
])

const overflowTabs = computed(() => [
  { label: t('nav.stock_levels', 'Inventory'), to: '/inventory', icon: 'i-heroicons-cube', exact: false },
  { label: t('nav.customers', 'Customers'), to: '/customers', icon: 'i-heroicons-users', exact: false },
  { label: t('nav.reports', 'Reports'), to: '/reports', icon: 'i-heroicons-presentation-chart-line', exact: false },
  { label: t('nav.settings', 'Settings'), to: '/settings', icon: 'i-heroicons-cog-6-tooth', exact: false },
])

const moreActive = computed(() =>
  moreOpen.value || overflowTabs.value.some(item => isActive(item.to, item.exact)),
)

watch(() => route.fullPath, () => {
  moreOpen.value = false
})
</script>
