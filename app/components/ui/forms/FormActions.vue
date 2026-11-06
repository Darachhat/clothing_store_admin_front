<template>
  <div class="app-form-actions" :class="[`align-${align || 'end'}`, { 'no-border': noBorder }]">
    <div v-if="$slots.left" class="app-form-actions__left">
      <slot name="left" />
    </div>
    <div class="app-form-actions__right">
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

<style scoped>
.app-form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 14px;
  margin-top: 4px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}

.app-form-actions.no-border {
  border-top: none;
  padding-top: 4px;
}

.app-form-actions.align-start {
  justify-content: flex-start;
}

.app-form-actions.align-between {
  justify-content: space-between;
}

.app-form-actions__left,
.app-form-actions__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 420px) {
  .app-form-actions__right {
    width: 100%;
  }
  .app-form-actions__right :deep(> *) {
    flex: 1 1 auto;
  }
}
</style>

