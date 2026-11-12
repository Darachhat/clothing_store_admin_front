<template>
  <AppModal
    v-model="isOpen"
    :title="title"
    size="sm"
  >
    <div class="flex flex-col gap-4">
      <div class="flex items-start gap-3">
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="variantClasses"
        >
          <UIcon
            :name="icon || (variant === 'warning' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-shield-exclamation')"
            class="w-5 h-5"
          />
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-1">
          <p class="text-sm text-ink leading-relaxed m-0">{{ message || description }}</p>
          <p v-if="consequence" class="text-xs text-ink-tertiary leading-normal m-0">{{ consequence }}</p>
          <slot />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-subtle">
        <AppButton
          type="button"
          variant="ghost"
          :label="cancelLabel || 'Cancel'"
          :disabled="loading"
          @click="isOpen = false"
        />
        <AppButton
          type="button"
          :variant="variant === 'warning' ? 'primary' : 'danger'"
          :label="confirmLabel || 'Confirm'"
          :loading="loading"
          @click="$emit('confirm')"
        />
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  message?: string
  description?: string
  consequence?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary' | 'default'
  icon?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'bg-status-amber-bg text-white'
    case 'primary':
      return 'bg-status-blue-bg text-white'
    case 'default':
      return 'bg-surface-bg text-ink-secondary'
    default:
      return 'bg-status-red-bg text-white'
  }
})
</script>
