<template>
  <div class="app-select-group">
    <label v-if="label" :for="id" class="app-select-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="app-select-wrap" :class="[`app-select-wrap--${size || 'md'}`, { 'has-error': !!error }]">
      <select
        :id="id"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :required="required"
        class="app-select"
        @change="onChange"
      >
        <option v-if="placeholder" value="" :disabled="required">{{ placeholder }}</option>
        <slot>
          <option
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.disabled"
          >
            {{ opt.label }}
          </option>
        </slot>
      </select>
      <UIcon name="i-heroicons-chevron-down" class="app-select-chevron" />
    </div>
    <p v-if="error" class="app-select-error">{{ error }}</p>
    <p v-else-if="hint" class="app-select-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '~/types'

export type { SelectOption }

withDefaults(defineProps<{
  modelValue?: string | number | null
  options?: SelectOption[]
  label?: string
  placeholder?: string
  id?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
}>(), {
  options: () => [],
})

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
  min-width: 0;
}

.app-select-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
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
  min-height: var(--input-height-md, 36px);
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

.app-select-wrap--sm .app-select {
  min-height: var(--input-height-sm, 30px);
  padding: 4px 26px 4px 9px;
  font-size: 12px;
}

.app-select-wrap--lg .app-select {
  min-height: var(--input-height-lg, 40px);
  padding: 9px 32px 9px 13px;
  font-size: 14px;
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

.has-error .app-select {
  border-color: var(--border-strong, #9ca3af);
  background-color: var(--status-red-bg, #fef2f2);
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

.app-select-hint {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}
</style>

