<template>
  <div class="flex flex-col gap-1.5 min-w-0">
    <div v-if="label || $slots.label || $slots['label-right']" class="flex items-center justify-between gap-2">
      <label v-if="label || $slots.label" :for="htmlFor" class="text-xs font-semibold text-ink-secondary leading-tight">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="text-status-red ml-0.5">*</span>
      </label>
      <slot name="label-right" />
    </div>

    <div class="flex flex-col min-w-0">
      <slot />
    </div>

    <p
      v-if="error"
      :id="htmlFor ? `${htmlFor}-error` : undefined"
      class="text-[11px] text-status-red m-0 leading-snug"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="htmlFor ? `${htmlFor}-hint` : undefined"
      class="text-[11px] text-ink-tertiary m-0 leading-snug"
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

