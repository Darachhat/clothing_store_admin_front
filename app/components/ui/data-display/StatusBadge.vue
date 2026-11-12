<template>
  <span
    class="inline-flex items-center justify-center gap-1.5 rounded-[6px] font-medium leading-normal whitespace-nowrap"
    :class="[
      size === 'sm' ? 'min-h-[28px] px-3 py-1 text-xs' : 'min-h-[32px] px-3.5 py-1.5 text-xs sm:text-sm',
      badgeColorClasses
    ]"
  >
    <UIcon v-if="resolvedIcon" :name="resolvedIcon" class="w-3.5 h-3.5 flex-shrink-0" />
    <span v-else-if="showDot" class="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
    <slot>{{ label || status }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  color?: string
  variant?: string
  status?: string
  label?: string
  size?: 'sm' | 'md'
  dot?: boolean
  icon?: string
}>()

const COLOR_ALIAS_MAP: Record<string, string> = {
  green: 'green',
  emerald: 'green',
  success: 'green',
  red: 'red',
  danger: 'red',
  error: 'red',
  yellow: 'yellow',
  amber: 'yellow',
  orange: 'yellow',
  warning: 'yellow',
  blue: 'blue',
  sky: 'blue',
  indigo: 'blue',
  purple: 'blue',
  violet: 'blue',
  info: 'blue',
  gray: 'default',
  neutral: 'default',
  default: 'default',
}

const STATUS_SEMANTIC_MAP: Record<string, string> = {
  ACTIVE: 'green',
  PAID: 'green',
  COMPLETED: 'green',
  APPROVED: 'green',
  RECEIVED: 'green',
  ONLINE: 'green',
  OPEN: 'green',
  IN_STOCK: 'green',
  SYNCHRONIZED: 'green',
  SUCCESS: 'green',

  PENDING: 'yellow',
  IN_TRANSIT: 'yellow',
  DISPATCHED: 'yellow',
  PARTIAL: 'yellow',
  PARTIALLY_RECEIVED: 'yellow',
  MAINTENANCE: 'yellow',
  LOW_STOCK: 'yellow',
  HELD: 'yellow',
  WARNING: 'yellow',

  ORDERED: 'blue',
  PROCESSING: 'blue',
  PERCENTAGE: 'blue',
  INFO: 'blue',

  CANCELLED: 'red',
  FAILED: 'red',
  REJECTED: 'red',
  VOID: 'red',
  OUT_OF_STOCK: 'red',
  UNPAID: 'red',
  FULL: 'red',
  DELETE: 'red',
  ERROR: 'red',

  INACTIVE: 'default',
  DRAFT: 'default',
  CLOSED: 'default',
  OFFLINE: 'default',
}

const normalizedColor = computed(() => {
  if (props.color && COLOR_ALIAS_MAP[props.color]) {
    return COLOR_ALIAS_MAP[props.color]
  }
  if (props.variant && COLOR_ALIAS_MAP[props.variant]) {
    return COLOR_ALIAS_MAP[props.variant]
  }
  const rawStatus = String(props.status || props.label || '').trim().toUpperCase()
  if (rawStatus && STATUS_SEMANTIC_MAP[rawStatus]) {
    return STATUS_SEMANTIC_MAP[rawStatus]
  }
  return 'default'
})

const badgeColorClasses = computed(() => {
  switch (normalizedColor.value) {
    case 'green':
      return 'bg-status-green-bg text-white'
    case 'red':
      return 'bg-status-red-bg text-white'
    case 'yellow':
      return 'bg-status-amber-bg text-white'
    case 'blue':
      return 'bg-status-blue-bg text-white'
    default:
      return 'bg-ink-secondary text-white'
  }
})

const resolvedIcon = computed(() => props.icon || '')

const showDot = computed(() => {
  if (props.dot !== undefined) return props.dot
  return normalizedColor.value !== 'default'
})
</script>
