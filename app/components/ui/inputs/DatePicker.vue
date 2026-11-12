<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <label v-if="label" :for="id" class="text-xs font-medium text-ink-secondary leading-tight">
      {{ label }}
      <span v-if="required" class="text-status-red ml-0.5">*</span>
    </label>
    <div class="relative w-full">
      <input
        :id="id"
        :type="mode || 'date'"
        :value="modelValue ?? ''"
        :min="min"
        :max="max"
        :disabled="disabled"
        :required="required"
        class="w-full rounded-md border border-border-subtle bg-surface-card text-ink placeholder:text-ink-tertiary focus:border-border-default focus:outline-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-surface-inset"
        :class="[
          size === 'sm' ? 'h-7.5 text-xs px-2' :
          size === 'lg' ? 'h-10 text-sm px-3' :
          'h-9 text-xs sm:text-sm px-2.5',
          error ? 'bg-surface-card border-border-strong' : 'hover:border-border-default'
        ]"
        @input="onInput"
        @change="onInput"
      />
    </div>
    <p v-if="error" class="text-[11px] text-status-red m-0">{{ error }}</p>
    <p v-else-if="hint" class="text-[11px] text-ink-tertiary m-0">{{ hint }}</p>
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

