<template>
  <label :for="id" class="app-checkbox" :class="{ 'is-disabled': disabled }">
    <input
      :id="id"
      type="checkbox"
      :checked="isChecked"
      :disabled="disabled"
      class="app-checkbox__input"
      @change="onChange"
    />
    <span class="app-checkbox__content">
      <span v-if="label || $slots.default" class="app-checkbox__label">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="description" class="app-checkbox__desc">{{ description }}</span>
    </span>
  </label>
</template>

<script setup lang="ts">
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

<style scoped>
.app-checkbox {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--text-primary, #0f172a);
}

.app-checkbox.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.app-checkbox__input {
  width: 15px;
  height: 15px;
  margin-top: 2px;
  accent-color: var(--accent-primary, #0f172a);
  border-radius: var(--radius-sm, 4px);
  cursor: inherit;
  flex-shrink: 0;
}

.app-checkbox__content {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.app-checkbox__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary, #0f172a);
  line-height: 1.35;
}

.app-checkbox__desc {
  font-size: 11.5px;
  color: var(--text-tertiary, #64748b);
  line-height: 1.35;
}
</style>

