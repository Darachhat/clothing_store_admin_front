<template>
  <div class="app-textarea-group">
    <label v-if="label" :for="id" class="app-textarea-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <textarea
      :id="id"
      :rows="rows || 3"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :maxlength="maxlength"
      class="app-textarea"
      :class="{ 'has-error': !!error, 'font-mono': mono }"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur', $event)"
    />
    <p v-if="error" class="app-textarea-error">{{ error }}</p>
    <p v-else-if="hint" class="app-textarea-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | null
  label?: string
  placeholder?: string
  rows?: number | string
  id?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  maxlength?: number | string
  error?: string
  hint?: string
  mono?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
}>()
</script>

<style scoped>
.app-textarea-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.app-textarea-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
}

.required {
  color: var(--status-red, #b91c1c);
  margin-left: 2px;
}

.app-textarea {
  width: 100%;
  min-height: 72px;
  padding: 8px 11px;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.45;
  color: var(--text-primary, #0f172a);
  background: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  resize: vertical;
  transition: border-color 0.12s, background 0.12s;
}

.app-textarea.font-mono {
  font-family: var(--font-mono);
  font-size: 12px;
}

.app-textarea::placeholder {
  color: var(--text-muted, #94a3b8);
}

.app-textarea:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.app-textarea:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.app-textarea:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--surface-inset, #f8fafc);
}

.app-textarea.has-error {
  border-color: var(--border-strong, #9ca3af);
  background: var(--status-red-bg, #fef2f2);
}

.app-textarea-error {
  font-size: 11px;
  color: var(--status-red, #b91c1c);
  margin: 0;
}

.app-textarea-hint {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}
</style>

