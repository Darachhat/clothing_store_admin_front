<template>
  <NuxtLink
    v-if="to && !disabled && !loading"
    :to="to"
    :target="target"
    class="inline-flex items-center justify-center gap-1.5 font-medium rounded-md border transition-colors select-none whitespace-nowrap cursor-pointer text-decoration-none"
    :class="[sizeClasses, variantClasses, { 'w-full flex': block || fullWidth }]"
    :aria-label="ariaLabel || label"
  >
    <slot name="icon-left">
      <UIcon v-if="icon" :name="icon" :class="iconClasses" />
    </slot>
    <span v-if="$slots.default || label" class="truncate">
      <slot>{{ label }}</slot>
    </span>
    <slot name="icon-right">
      <UIcon v-if="trailingIcon || iconRight" :name="(trailingIcon || iconRight)!" :class="iconClasses" />
    </slot>
  </NuxtLink>
  <button
    v-else
    :type="type || 'button'"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="ariaLabel || label"
    class="inline-flex items-center justify-center gap-1.5 font-medium rounded-md border transition-colors select-none whitespace-nowrap cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
    :class="[sizeClasses, variantClasses, { 'w-full flex': block || fullWidth }]"
    @click="onClick"
  >
    <span v-if="loading" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
    <slot v-else name="icon-left">
      <UIcon v-if="icon" :name="icon" :class="iconClasses" />
    </slot>
    <span v-if="$slots.default || label" class="truncate">
      <slot>{{ label }}</slot>
    </span>
    <slot v-if="!loading" name="icon-right">
      <UIcon v-if="trailingIcon || iconRight" :name="(trailingIcon || iconRight)!" :class="iconClasses" />
    </slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize } from '~/types'

const props = defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
  target?: string
  label?: string
  ariaLabel?: string
  icon?: string
  trailingIcon?: string
  iconRight?: string
  color?: string
  block?: boolean
  fullWidth?: boolean
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function onClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'px-2 py-1 text-xs min-h-[26px]'
    case 'sm': return 'px-2.5 py-1 text-xs min-h-[30px]'
    case 'lg': return 'px-4.5 py-2 text-sm min-h-[40px]'
    default: return 'px-3.5 py-1.5 text-sm min-h-[36px]'
  }
})

const iconClasses = computed(() => {
  switch (props.size) {
    case 'xs':
    case 'sm':
      return 'w-3.5 h-3.5 flex-shrink-0'
    default:
      return 'w-4 h-4 flex-shrink-0'
  }
})

const variantClasses = computed(() => {
  if (props.color === 'red' || props.variant === 'danger') {
    return 'bg-status-red text-white border-transparent hover:opacity-90'
  }
  if (props.color === 'green' || props.variant === 'success') {
    return 'bg-status-green text-white border-transparent hover:opacity-90'
  }
  if (props.variant === 'primary' || props.color === 'primary') {
    return 'bg-brand-900 text-white border-transparent hover:bg-brand-800'
  }
  if (props.variant === 'outline') {
    return 'bg-transparent text-ink border-subtle hover:bg-surface-hover'
  }
  if (props.variant === 'ghost') {
    return 'bg-transparent text-ink-secondary border-transparent hover:bg-surface-hover hover:text-ink'
  }
  if (props.variant === 'link') {
    return 'bg-transparent text-brand-900 border-transparent underline hover:text-brand-800 p-0 min-h-0'
  }
  // default / secondary
  return 'bg-white text-ink border-subtle hover:bg-surface-hover hover:border-border-default shadow-xs'
})
</script>
