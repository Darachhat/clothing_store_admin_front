<template>
  <div class="btn-group" role="group" :aria-label="ariaLabel">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  ariaLabel?: string
}>()
</script>

<style scoped>
.btn-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  flex-wrap: wrap;
}
</style>

