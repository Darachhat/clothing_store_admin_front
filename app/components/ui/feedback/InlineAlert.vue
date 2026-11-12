<template>
  <div v-if="!dismissed" class="flex items-start gap-2.5 p-3 rounded-lg border border-subtle text-sm leading-normal" :class="alertVariantClasses" role="alert">
    <UIcon :name="iconName" class="w-4 h-4 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <p v-if="title" class="m-0 text-base font-medium text-white">{{ title }}</p>
      <p v-if="description" class="m-0 text-white/85 mt-0.5">{{ description }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-1.5 flex-shrink-0">
      <slot name="actions" />
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="text-inherit opacity-70 hover:opacity-100 p-0.5 cursor-pointer transition-opacity"
      aria-label="Dismiss"
      @click="dismiss"
    >
      <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  description?: string
  icon?: string
  dismissible?: boolean
}>(), {
  variant: 'info',
})

const emit = defineEmits<{ dismiss: [] }>()

const dismissed = ref(false)

const alertVariantClasses = computed(() => {
  switch (props.variant) {
    case 'success':
      return 'bg-status-green-bg text-white'
    case 'warning':
      return 'bg-status-amber-bg text-white'
    case 'danger':
      return 'bg-status-red-bg text-white'
    default:
      return 'bg-status-blue-bg text-white'
  }
})

const iconName = computed(() => {
  if (props.icon) return props.icon
  switch (props.variant) {
    case 'success': return 'i-heroicons-check-circle'
    case 'warning': return 'i-heroicons-exclamation-triangle'
    case 'danger': return 'i-heroicons-x-circle'
    default: return 'i-heroicons-information-circle'
  }
})

function dismiss() {
  dismissed.value = true
  emit('dismiss')
}
</script>