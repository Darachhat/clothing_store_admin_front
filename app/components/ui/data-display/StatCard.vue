<template>
  <div class="bg-white border border-subtle rounded-lg p-3.5 sm:p-4 flex flex-col gap-1.5 shadow-card min-w-0">
    <div class="flex items-start justify-between gap-2 min-w-0">
      <span class="text-sm font-normal text-ink-secondary truncate">{{ label }}</span>
      <div v-if="icon" class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" :class="toneClasses">
        <UIcon :name="icon" class="w-4 h-4" />
      </div>
    </div>

    <div v-if="loading" class="h-7 w-24 bg-surface-hover animate-pulse rounded my-1" />
    <div v-else class="flex items-baseline justify-between gap-1.5 flex-wrap min-w-0">
      <span class="text-2xl sm:text-3xl font-normal font-mono tabular-nums text-ink tracking-tight break-all" :class="valueClass">
        {{ value }}
      </span>
      <StatusBadge v-if="badge" :color="badgeColor || 'default'" size="sm">{{ badge }}</StatusBadge>
    </div>

    <p v-if="sublabel || $slots.sublabel" class="text-xs text-ink-tertiary m-0 leading-snug break-words">
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
      return 'bg-status-blue-bg text-white'
    default:
      return 'bg-ink-secondary text-white'
  }
})
</script>
