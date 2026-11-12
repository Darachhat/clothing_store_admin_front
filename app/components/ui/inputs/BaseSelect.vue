<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <label v-if="label" :for="id" class="text-sm font-normal text-ink-secondary leading-tight">
      {{ label }}
      <span v-if="required" class="text-status-red ml-0.5">*</span>
    </label>
    <div
      class="relative flex items-center bg-white border rounded-md transition-colors shadow-xs"
      :class="[
        size === 'sm' ? 'h-8 text-xs' : size === 'lg' ? 'h-11 text-sm' : 'h-10 text-sm',
        error ? 'border-status-red' : 'border-border-default hover:border-border-strong focus-within:border-action focus-within:ring-[3px] focus-within:ring-action/20',
        disabled ? 'bg-surface-bg opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <select
        :id="id"
        :value="modelValue ?? ''"
        :disabled="disabled"
        :required="required"
        class="w-full h-full pl-3 pr-8 bg-transparent text-ink outline-none appearance-none cursor-pointer disabled:cursor-not-allowed"
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
      <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 text-ink-tertiary absolute right-2.5 pointer-events-none" />
    </div>
    <p v-if="error" :id="id ? `${id}-error` : undefined" class="text-xs text-status-red m-0" role="alert">{{ error }}</p>
    <p v-else-if="hint" :id="id ? `${id}-hint` : undefined" class="text-xs text-ink-tertiary m-0">{{ hint }}</p>
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