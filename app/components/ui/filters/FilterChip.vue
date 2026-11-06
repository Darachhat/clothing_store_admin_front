<template>
  <span class="filter-chip">
    <span v-if="label" class="filter-chip__key">{{ label }}:</span>
    <span class="filter-chip__val">{{ value }}</span>
    <button
      v-if="removable"
      type="button"
      class="filter-chip__remove"
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

<style scoped>
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  background: var(--surface-hover, #f1f5f9);
  border: 1px solid var(--border-subtle, #e5e7eb);
  font-size: 11.5px;
  color: var(--text-primary, #0f172a);
}

.filter-chip__key {
  color: var(--text-tertiary, #64748b);
  font-weight: 500;
}

.filter-chip__val {
  font-weight: 600;
}

.filter-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  padding: 1px;
  border-radius: 50%;
}

.filter-chip__remove:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-active, #e2e8f0);
}
</style>

