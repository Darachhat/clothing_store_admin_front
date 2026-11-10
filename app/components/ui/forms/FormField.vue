<template>
  <div class="app-form-field">
    <div v-if="label || $slots.label || $slots['label-right']" class="app-form-field__header">
      <label v-if="label || $slots.label" :for="htmlFor" class="app-form-field__label">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="app-form-field__req">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <div class="app-form-field__control">
      <slot />
    </div>

    <p
      v-if="error"
      :id="htmlFor ? `${htmlFor}-error` : undefined"
      class="app-form-field__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="htmlFor ? `${htmlFor}-hint` : undefined"
      class="app-form-field__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label?: string
  htmlFor?: string
  required?: boolean
  hint?: string
  error?: string
}>()
</script>

<style scoped>
.app-form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.app-form-field__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.app-form-field__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
}

.app-form-field__req {
  color: var(--status-red, #b91c1c);
  margin-left: 2px;
}

.app-form-field__control {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-form-field__error {
  font-size: 11px;
  color: var(--status-red, #b91c1c);
  margin: 0;
  line-height: 1.35;
}

.app-form-field__hint {
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
  line-height: 1.35;
}
</style>

