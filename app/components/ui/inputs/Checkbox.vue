<template>
  <label
    :for="id"
    class="inline-flex items-start gap-2.5 text-xs select-none cursor-pointer"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
  >
    <input
      :id="id"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      class="w-4 h-4 rounded border-subtle text-brand-900 focus:ring-brand-900 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
      @change="onChange"
    />
    <span class="flex flex-col gap-0.5">
      <span v-if="label || $slots.default" class="font-medium text-ink leading-tight">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="text-ink-secondary text-[11px] leading-tight">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: boolean | Array<string | number>
  value?: string | number
  label?: string
  description?: string
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

const isChecked = computed(() => {
  if (Array.isArray(props.modelValue) && props.value !== undefined) {
    return props.modelValue.includes(props.value)
  }
  return Boolean(props.modelValue)
})

function onChange(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (Array.isArray(props.modelValue) && props.value !== undefined) {
    const next = checked
      ? [...props.modelValue, props.value]
      : props.modelValue.filter(v => v !== props.value)
    emit('update:modelValue', next)
    emit('change', next)
    return
  }
  emit('update:modelValue', checked)
  emit('change', checked)
}
</script>
