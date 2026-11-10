<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <label v-if="label" :for="id" class="text-xs font-semibold text-ink-secondary leading-tight">
      {{ label }}
      <span v-if="required" class="text-status-red ml-0.5">*</span>
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
      :aria-invalid="!!error"
      :aria-describedby="error && id ? `${id}-error` : hint && id ? `${id}-hint` : undefined"
      class="w-full p-3 bg-white border rounded-md text-sm text-ink placeholder:text-ink-tertiary outline-none transition-colors shadow-xs resize-y disabled:bg-surface-bg disabled:opacity-50 disabled:cursor-not-allowed"
      :class="[
        error ? 'border-status-red focus:border-status-red focus:ring-1 focus:ring-status-red' : 'border-subtle focus:border-brand-900 focus:ring-1 focus:ring-brand-900',
        mono ? 'font-mono' : ''
      ]"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      @blur="$emit('blur', $event)"
    />
    <p v-if="error" :id="id ? `${id}-error` : undefined" class="text-xs text-status-red m-0" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="id ? `${id}-hint` : undefined" class="text-xs text-ink-tertiary m-0">{{ hint }}</p>
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
