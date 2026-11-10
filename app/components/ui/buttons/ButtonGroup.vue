<template>
  <div class="inline-flex items-center gap-0.5 p-1 bg-surface-bg border border-subtle rounded-md flex-wrap" role="group" :aria-label="ariaLabel">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  ariaLabel?: string
}>()
</script>
