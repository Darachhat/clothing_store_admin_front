<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <div v-if="label || $slots['label-right']" class="flex items-center justify-between gap-2">
      <label v-if="label" :for="id" class="text-xs font-semibold text-ink-secondary leading-tight">
        {{ label }}
        <span v-if="required" class="text-status-red ml-0.5">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <div
      class="relative flex items-center bg-white border rounded-md transition-colors shadow-xs"
      :class="[
        size === 'sm' ? 'h-[30px] text-xs' : size === 'lg' ? 'h-[40px] text-sm' : 'h-[36px] text-sm',
        error ? 'border-status-red' : 'border-subtle focus-within:border-brand-900 focus-within:ring-1 focus-within:ring-brand-900',
        disabled ? 'bg-surface-bg opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <UIcon v-if="icon" :name="icon" class="w-4 h-4 text-ink-tertiary ml-2.5 flex-shrink-0" />
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
        :aria-invalid="!!error"
        :aria-describedby="error && id ? `${id}-error` : hint && id ? `${id}-hint` : undefined"
        class="w-full h-full px-3 bg-transparent text-ink placeholder:text-ink-tertiary outline-none disabled:cursor-not-allowed"
        :class="{
          'font-mono': mono,
          'uppercase': uppercase,
          'pl-2': icon,
        }"
        @input="onInput"
        @blur="$emit('blur', $event)"
        @keyup.enter="$emit('enter', $event)"
      />
      <div v-if="(clearable && modelValue) || $slots.trailing" class="flex items-center gap-1 pr-2 flex-shrink-0">
        <button
          v-if="clearable && modelValue && !disabled && !readonly"
          type="button"
          class="p-0.5 text-ink-tertiary hover:text-ink cursor-pointer rounded"
          aria-label="Clear input"
          @click="$emit('update:modelValue', ''); $emit('clear')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
        <slot name="trailing" />
      </div>
    </div>

    <p v-if="error" :id="id ? `${id}-error` : undefined" class="text-xs text-status-red m-0" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="id ? `${id}-hint` : undefined" class="text-xs text-ink-tertiary m-0">{{ hint }}</p>
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
