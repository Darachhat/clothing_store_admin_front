<template>
  <div class="app-select-group">
    <label v-if="label" :for="id" class="app-select-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="app-select-wrap">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="app-select"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="opt in options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <UIcon name="i-heroicons-chevron-down" class="app-select-chevron" />
    </div>
    <p v-if="error" class="app-select-error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
export interface SelectOption {
  label: string
  value: string | number
}

defineProps<{
  modelValue?: string | number | null
  options: SelectOption[]
  label?: string
  placeholder?: string
  id?: string
  disabled?: boolean
  required?: boolean
  error?: string
}>()

const emit = defineEmits(['update:modelValue', 'change'])

function onChange(e: Event) {
  const val = (e.target as HTMLSelectElement).value
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<style scoped>
.app-select-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.app-select-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.required {
  color: var(--status-red, #b91c1c);
  margin-left: 2px;
}

.app-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.app-select {
  width: 100%;
  min-height: 36px;
  padding: 7px 30px 7px 11px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background-color: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.12s, background-color 0.12s;
}

.app-select:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.app-select:focus {
  border-color: var(--border-strong, #9ca3af);
  background-color: var(--surface-card, #ffffff);
}

.app-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background-color: var(--surface-inset, #f8fafc);
}

.app-select-chevron {
  position: absolute;
  right: 9px;
  width: 14px;
  height: 14px;
  color: var(--text-tertiary, #64748b);
  pointer-events: none;
}

.app-select-error {
  font-size: 11px;
  color: var(--status-red, #b91c1c);
  margin: 0;
}
</style>
