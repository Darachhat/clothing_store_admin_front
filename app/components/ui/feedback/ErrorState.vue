<template>
  <div class="flex flex-col items-center justify-center text-center p-8 gap-2 bg-white border border-subtle rounded-lg">
    <div class="w-10 h-10 rounded-lg bg-status-red-bg text-white border border-subtle flex items-center justify-center mb-1">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
    </div>
    <h4 class="text-base font-medium text-ink m-0">{{ title || 'Unable to load data' }}</h4>
    <p v-if="message" class="text-sm text-ink-secondary max-w-sm m-0 leading-relaxed">{{ message }}</p>
    <div class="mt-2">
      <AppButton
        size="sm"
        variant="default"
        icon="i-heroicons-arrow-path"
        label="Try Again"
        @click="$emit('retry')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
}>()

defineEmits(['retry'])
</script>
