<template>
  <div class="filter-dropdown" :style="minWidth ? { minWidth } : undefined">
    <BaseSelect
      :model-value="modelValue"
      :options="options"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      @update:model-value="onUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import type { SelectOption } from '~/types'

defineProps<{
  modelValue?: string | number | null
  options: SelectOption[]
  placeholder?: string
  minWidth?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

function onUpdate(val: any) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<style scoped>
.filter-dropdown {
  min-width: 145px;
}

@media (max-width: 639px) {
  .filter-dropdown {
    min-width: 0 !important;
    width: 100%;
  }
}
</style>

