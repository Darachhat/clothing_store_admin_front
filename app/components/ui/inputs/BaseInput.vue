<template>
  <div class="app-input-group">
    <div v-if="label || $slots['label-right']" class="app-input-label-row">
      <label v-if="label" :for="id" class="app-input-label">
        {{ label }}
        <span v-if="required" class="required">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <div
      class="app-input-wrap"
      :class="[
        `app-input-wrap--${size || 'md'}`,
        {
          'has-error': !!error,
          'has-icon-left': !!icon,
          'has-trailing': clearable || !!$slots.trailing,
        },
      ]"
    >
      <UIcon v-if="icon" :name="icon" class="app-input-icon" />
      <input
        :id="id"
        :type="type || 'text'"
        :value="modelValue ?? ''"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :minlength="minlength"
        :maxlength="maxlength"
        :autocomplete="autocomplete"
        class="app-input"
        :class="{
          'font-mono': mono,
          'uppercase': uppercase,
        }"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @keyup.enter="$emit('enter', $event)"
      />
      <div v-if="(clearable && modelValue) || $slots.trailing" class="app-input-trailing">
        <button
          v-if="clearable && modelValue && !disabled && !readonly"
          type="button"
          class="app-input-clear"
          aria-label="Clear input"
          @click="$emit('update:modelValue', ''); $emit('clear')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
        <slot name="trailing" />
      </div>
    </div>

    <p v-if="error" class="app-input-error">{{ error }}</p>
    <p v-else-if="hint" class="app-input-hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue?: string | number | null
  label?: string
  placeholder?: string
  type?: string
  id?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  error?: string
  hint?: string
  icon?: string
  min?: string | number
  max?: string | number
  step?: string | number
  minlength?: string | number
  maxlength?: string | number
  autocomplete?: string
  mono?: boolean
  uppercase?: boolean
  clearable?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'blur': [event: FocusEvent]
  'enter': [event: KeyboardEvent]
  'clear': []
}>()

function onInput(event: Event) {
  const raw = (event.target as HTMLInputElement).value
  if (props.type === 'number') {
    const parsed = raw === '' ? '' : Number(raw)
    emit('update:modelValue', parsed)
    return
  }
  emit('update:modelValue', props.uppercase ? raw.toUpperCase() : raw)
}
</script>

<style scoped>
.app-input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.app-input-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.app-input-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
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
  min-height: var(--input-height-md, 36px);
  padding: 7px var(--input-padding-x, 11px);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.app-input-wrap--sm .app-input {
  min-height: var(--input-height-sm, 30px);
  padding: 4px 9px;
  font-size: 12px;
}

.app-input-wrap--lg .app-input {
  min-height: var(--input-height-lg, 40px);
  padding: 9px 13px;
  font-size: 14px;
}

.has-icon-left .app-input {
  padding-left: 32px;
}

.has-trailing .app-input {
  padding-right: 32px;
}

.app-input-trailing {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.app-input-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm, 4px);
  border: none;
  background: transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
}

.app-input-clear:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-hover, #f1f5f9);
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

