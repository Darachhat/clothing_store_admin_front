<template>
  <div
    class="flex items-center gap-2 flex-wrap pt-3.5"
    :class="[
      noBorder ? '' : 'border-t border-subtle',
      align === 'start' ? 'justify-start' : align === 'between' ? 'justify-between' : 'justify-end'
    ]"
  >
    <div v-if="$slots.left" class="flex items-center gap-2 mr-auto">
      <slot name="left" />
    </div>
    <div class="flex items-center gap-2">
      <slot>
        <BaseButton
          v-if="showCancel"
          type="button"
          variant="ghost"
          :label="cancelLabel || 'Cancel'"
          :disabled="loading"
          @click="$emit('cancel')"
        />
        <BaseButton
          v-if="submitLabel"
          type="submit"
          :variant="submitVariant || 'primary'"
          :icon="submitIcon"
          :label="submitLabel"
          :loading="loading"
          :disabled="disabled"
          @click="$emit('submit')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ButtonVariant } from '~/types'

withDefaults(defineProps<{
  cancelLabel?: string
  submitLabel?: string
  submitIcon?: string
  submitVariant?: ButtonVariant
  showCancel?: boolean
  loading?: boolean
  disabled?: boolean
  align?: 'start' | 'end' | 'between'
  noBorder?: boolean
}>(), {
  showCancel: true,
})

defineEmits<{
  cancel: []
  submit: []
}>()
</script>
