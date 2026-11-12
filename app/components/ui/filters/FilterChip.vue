<template>
  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy border border-subtle text-sm text-white">
    <span v-if="label" class="text-white/75 font-normal">{{ label }}:</span>
    <span class="font-medium">{{ value }}</span>
    <button
      v-if="removable"
      type="button"
      class="inline-flex items-center justify-center p-0.5 rounded-full text-white/80 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
      :aria-label="`Remove ${label || value} filter`"
      @click="$emit('remove')"
    >
      <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
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