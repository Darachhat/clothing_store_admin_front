<template>
  <div class="date-picker-group">
    <label v-if="label" :for="id" class="date-picker-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="date-picker-wrap" :class="[`date-picker-wrap--${size || 'md'}`, { 'has-error': !!error }]">
      <input
        :id="id"
        :type="mode || 'date'"
        :value="modelValue ?? ''"
        :min="min"
        :max="max"
        :disabled="disabled"
        :required="required"
        class="date-picker-input"
        @input="onInput"
        @change="onInput"
      />
    </div>
    <p v-if="error" class="date-picker-error">{{ error }}</p>
    <p v-else-if="hint" class="date-picker-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | null
  label?: string
  mode?: 'date' | 'datetime-local' | 'month'
  id?: string
  size?: 'sm' | 'md' | 'lg'
  min?: string
  max?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

function onInput(event: Event) {
  const val = (event.target as HTMLInputElement).value
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<style scoped>
.date-picker-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.date-picker-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
}

.required {
  color: var(--status-red, #b91c1c);
  margin-left: 2px;
}

.date-picker-input {
  width: 100%;
  min-height: var(--input-height-md, 36px);
  padding: 6px 10px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.date-picker-wrap--sm .date-picker-input {
  min-height: var(--input-height-sm, 30px);
  padding: 4px 8px;
  font-size: 12px;
}

.date-picker-input:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.date-picker-input:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.date-picker-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--surface-inset, #f8fafc);
}

.has-error .date-picker-input {
  border-color: var(--border-strong, #9ca3af);
  background: var(--status-red-bg, #fef2f2);
}

.date-picker-error {
  font-size: 11px;
  color: var(--status-red, #b91c1c);
  margin: 0;
}

.date-picker-hint {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}
</style>

