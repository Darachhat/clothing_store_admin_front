<template>
  <div class="app-input-group">
    <label v-if="label" :for="id" class="app-input-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="app-input-wrap" :class="{ 'has-error': error, 'has-icon-left': !!icon }">
      <UIcon v-if="icon" :name="icon" class="app-input-icon" />
      <input
        :id="id"
        :type="type || 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        class="app-input"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <p v-if="error" class="app-input-error">{{ error }}</p>
    <p v-else-if="hint" class="app-input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  id?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: string
  min?: string | number
  max?: string | number
  step?: string | number
}>()

defineEmits(['update:modelValue'])
</script>

<style scoped>
.app-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.app-input-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.required {
  color: var(--status-red, #b91c1c);
  margin-left: 2px;
}

.app-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.app-input-icon {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  color: var(--text-tertiary, #64748b);
  pointer-events: none;
}

.app-input {
  width: 100%;
  min-height: 36px;
  padding: 7px 11px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.has-icon-left .app-input {
  padding-left: 32px;
}

.app-input::placeholder {
  color: var(--text-muted, #94a3b8);
}

.app-input:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.app-input:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.app-input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--surface-inset, #f8fafc);
}

.has-error .app-input {
  border-color: var(--border-strong, #9ca3af);
  background: var(--status-red-bg, #fef2f2);
}

.app-input-error {
  font-size: 11px;
  color: var(--status-red, #b91c1c);
  margin: 0;
}

.app-input-hint {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}
</style>
