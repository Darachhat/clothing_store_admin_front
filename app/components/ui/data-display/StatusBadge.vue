<template>
  <span class="app-badge" :class="[`app-badge--${normalizedColor}`, `app-badge--${size || 'md'}`]">
    <UIcon v-if="resolvedIcon" :name="resolvedIcon" class="app-badge__icon" />
    <span v-else-if="showDot" class="app-badge__dot" />
    <slot>{{ label || status }}</slot>
  </span>
</template>

<script setup lang="ts">
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

/**
 * Centralized semantic status-to-color mapping so individual pages
 * do not need to duplicate statusColor() switch statements.
 */
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

const resolvedIcon = computed(() => props.icon || '')

const showDot = computed(() => {
  if (props.dot !== undefined) return props.dot
  return normalizedColor.value !== 'default'
})
</script>

<style scoped>
.app-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full, 9999px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  line-height: 1.4;
  white-space: nowrap;
  letter-spacing: 0.01em;
}

.app-badge--sm {
  padding: 1px 7px;
  font-size: 10.5px;
}

.app-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.app-badge__icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.app-badge--default {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-secondary, #475569);
}

.app-badge--green {
  background: var(--status-green-bg, #f0fdf4);
  color: var(--status-green, #15803d);
}

.app-badge--red {
  background: var(--status-red-bg, #fef2f2);
  color: var(--status-red, #b91c1c);
}

.app-badge--yellow {
  background: var(--status-amber-bg, #fffbeb);
  color: var(--status-amber, #b45309);
}

.app-badge--blue {
  background: var(--status-blue-bg, #eff6ff);
  color: var(--status-blue, #1d4ed8);
}
</style>

