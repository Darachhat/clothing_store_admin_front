<template>
  <NuxtLink
    v-if="to && !disabled && !loading"
    :to="to"
    :title="title || label"
    :aria-label="label || title || 'Icon action'"
    class="inline-flex items-center justify-center rounded-md border flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
    :class="[sizeClasses, variantClasses]"
  >
    <UIcon :name="icon" :class="glyphClasses" />
  </NuxtLink>
  <button
    v-else
    :type="type || 'button'"
    :disabled="disabled || loading"
    :title="title || label"
    :aria-label="label || title || 'Icon action'"
    class="inline-flex items-center justify-center rounded-md border flex-shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer"
    :class="[sizeClasses, variantClasses]"
    @click="onClick"
  >
    <span v-if="loading" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
    <UIcon v-else :name="icon" :class="glyphClasses" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize } from '~/types'

const props = defineProps<{
  icon: string
  label?: string
  title?: string
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
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
    case 'xs': return 'w-[26px] h-[26px]'
    case 'md': return 'w-9 h-9'
    case 'lg': return 'w-10 h-10'
    default: return 'w-[30px] h-[30px]'
  }
})

const glyphClasses = computed(() => {
  switch (props.size) {
    case 'xs': return 'w-3.5 h-3.5'
    case 'lg': return 'w-5 h-5'
    default: return 'w-4 h-4'
  }
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-900 text-white border-transparent hover:bg-brand-800'
    case 'default':
    case 'secondary':
    case 'outline':
      return 'bg-white text-ink border-subtle hover:bg-surface-hover hover:border-border-default'
    case 'danger':
      return 'bg-transparent text-status-red border-transparent hover:bg-status-red-bg hover:text-white hover:border-subtle'
    default:
      return 'bg-transparent text-ink-secondary border-transparent hover:bg-surface-hover hover:text-ink'
  }
})
</script>
