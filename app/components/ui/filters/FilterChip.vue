<template>
  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-hover border border-subtle text-xs text-ink">
    <span v-if="label" class="text-ink-tertiary font-medium">{{ label }}:</span>
    <span class="font-semibold">{{ value }}</span>
    <button
      v-if="removable"
      type="button"
      class="inline-flex items-center justify-center p-0.5 rounded-full text-ink-tertiary hover:text-ink hover:bg-surface-active cursor-pointer transition-colors"
      :aria-label="`Remove ${label || value} filter`"
      @click="$emit('remove')"
    >
      <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
    </button>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  label?: string
  value: string
  removable?: boolean
}>(), {
  removable: true,
})

defineEmits<{
  remove: []
}>()
</script>
