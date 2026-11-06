<template>
  <AppModal
    v-model="isOpen"
    :title="title"
    size="sm"
  >
    <div class="confirm-dialog">
      <div class="confirm-dialog__body">
        <div class="confirm-dialog__icon" :class="`confirm-dialog__icon--${variant || 'danger'}`">
          <UIcon
            :name="icon || (variant === 'warning' ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-shield-exclamation')"
            class="w-5 h-5"
          />
        </div>
        <div class="confirm-dialog__content">
          <p class="confirm-dialog__message">{{ message || description }}</p>
          <p v-if="consequence" class="confirm-dialog__consequence">{{ consequence }}</p>
          <slot />
        </div>
      </div>

      <div class="confirm-dialog__actions">
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
</script>

<style scoped>
.confirm-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.confirm-dialog__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.confirm-dialog__icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-lg, 8px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-dialog__icon--danger {
  background: var(--status-red-bg, #fef2f2);
  color: var(--status-red, #b91c1c);
}

.confirm-dialog__icon--warning {
  background: var(--status-amber-bg, #fffbeb);
  color: var(--status-amber, #b45309);
}

.confirm-dialog__icon--primary {
  background: var(--surface-inset, #f8fafc);
  color: var(--text-primary, #0f172a);
}

.confirm-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.confirm-dialog__message {
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  margin: 0;
  line-height: 1.45;
}

.confirm-dialog__consequence {
  font-size: 12px;
  color: var(--text-secondary, #475569);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  padding: 8px 10px;
  margin: 0;
  line-height: 1.4;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}
</style>
