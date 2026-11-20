<template>
  <div
    class="relative border border-subtle rounded-xl p-4 flex flex-col justify-between gap-2.5 shadow-card min-w-0 overflow-hidden transition-shadow hover:shadow-menu"
    :class="cardSurfaceClasses"
  >
    <!-- CDC-style Decorative Translucent Watermark Circles (when gradient is enabled) -->
    <template v-if="gradient">
      <div
        class="pointer-events-none absolute w-28 h-28 right-0 top-0 translate-x-7 -translate-y-1/2 rounded-full"
        :class="watermarkPrimaryClass"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute w-16 h-16 right-0 top-0 -translate-x-14 -translate-y-1/2 rounded-full"
        :class="watermarkSecondaryClass"
        aria-hidden="true"
      />
    </template>

    <!-- Header Row -->
    <div class="relative z-10 flex items-center justify-between gap-2 min-w-0">
      <div class="flex items-center gap-2 min-w-0">
        <div
          v-if="icon"
          class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          :class="toneClasses"
        >
          <UIcon :name="icon" class="w-4 h-4" />
        </div>
        <span class="text-sm font-medium text-ink-secondary truncate">{{ label }}</span>
      </div>
      <StatusBadge v-if="badge" :color="badgeColor || 'default'" size="sm">{{ badge }}</StatusBadge>
    </div>

    <!-- Metric Value -->
    <div v-if="loading" class="relative z-10 h-8 w-28 rounded skeleton my-0.5" />
    <div v-else class="relative z-10 flex items-baseline justify-between gap-1.5 flex-wrap min-w-0">
      <span
        class="text-2xl sm:text-3xl font-semibold font-mono tabular-nums text-ink tracking-tight break-all"
        :class="[valueClass, gradient && 'ml-auto text-right']"
      >
        {{ value }}
      </span>
    </div>

    <!-- Optional CDC Meta Split Row & Progress Bar -->
    <div v-if="metaLeft || metaRight || progress !== undefined" class="relative z-10 space-y-1.5">
      <div v-if="metaLeft || metaRight" class="flex items-center justify-between gap-2 text-xs text-ink-secondary">
        <span class="truncate">{{ metaLeft }}</span>
        <span class="truncate text-right">{{ metaRight }}</span>
      </div>
      <div v-if="progress !== undefined" class="w-full h-1.5 bg-black/5 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-700"
          :class="progressBarClass"
          :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
        />
      </div>
    </div>

    <!-- Sublabel -->
    <p v-if="sublabel || $slots.sublabel" class="relative z-10 text-xs text-ink-tertiary m-0 leading-snug break-words">
      <slot name="sublabel">{{ sublabel }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  sublabel?: string
  icon?: string
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  badge?: string
  badgeColor?: string
  valueClass?: string
  loading?: boolean
  gradient?: boolean
  progress?: number
  metaLeft?: string
  metaRight?: string
}>()

const toneClasses = computed(() => {
  switch (props.tone) {
    case 'green':
    case 'success':
      return 'bg-status-green-bg text-white'
    case 'amber':
    case 'warning':
      return 'bg-status-amber-bg text-white'
    case 'red':
    case 'danger':
      return 'bg-status-red-bg text-white'
    case 'blue':
    case 'info':
    case 'primary':
      return 'bg-navy text-white'
    default:
      return 'bg-ink-secondary text-white'
  }
})

const cardSurfaceClasses = computed(() => {
  if (!props.gradient) return 'bg-surface-card'
  switch (props.tone) {
    case 'green':
    case 'success':
      return 'bg-gradient-to-r from-emerald-500/12 via-emerald-500/5 to-surface-card'
    case 'amber':
    case 'warning':
      return 'bg-gradient-to-r from-amber-500/12 via-amber-500/5 to-surface-card'
    case 'red':
    case 'danger':
      return 'bg-gradient-to-r from-red-500/12 via-red-500/5 to-surface-card'
    case 'blue':
    case 'info':
    case 'primary':
      return 'bg-gradient-to-r from-[#102D71]/12 via-[#102D71]/5 to-surface-card'
    default:
      return 'bg-surface-card'
  }
})

const watermarkPrimaryClass = computed(() => {
  switch (props.tone) {
    case 'green':
    case 'success':
      return 'bg-emerald-500/15'
    case 'amber':
    case 'warning':
      return 'bg-amber-500/15'
    case 'red':
    case 'danger':
      return 'bg-red-500/15'
    default:
      return 'bg-[#102D71]/15'
  }
})

const watermarkSecondaryClass = computed(() => {
  switch (props.tone) {
    case 'green':
    case 'success':
      return 'bg-emerald-500/10'
    case 'amber':
    case 'warning':
      return 'bg-amber-500/10'
    case 'red':
    case 'danger':
      return 'bg-red-500/10'
    default:
      return 'bg-[#102D71]/10'
  }
})

const progressBarClass = computed(() => {
  switch (props.tone) {
    case 'green':
    case 'success':
      return 'bg-status-green-bg'
    case 'amber':
    case 'warning':
      return 'bg-status-amber-bg'
    case 'red':
    case 'danger':
      return 'bg-status-red-bg'
    default:
      return 'bg-navy'
  }
})
</script>
