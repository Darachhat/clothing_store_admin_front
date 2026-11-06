<template>
  <div class="app-card">
    <div v-if="title || $slots.header" class="app-card__header">
      <slot name="header">
        <span class="app-card__title">{{ title }}</span>
      </slot>
      <div v-if="$slots['header-right']" class="app-card__header-right">
        <slot name="header-right" />
      </div>
    </div>
    <div class="app-card__body" :class="{ 'no-pad': noPad }">
      <slot />
    </div>
    <div v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  noPad?: boolean
}>()
</script>

<style scoped>
.app-card {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.app-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 18px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}

.app-card__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.app-card__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.01em;
}

.app-card__body {
  padding: 18px;
}

.app-card__body.no-pad {
  padding: 0;
}

/* Automatic flush table handling when AppTable is the sole child of AppCard */
.app-card__body > :deep(.app-table-wrap:only-child) {
  margin: -18px;
}

.app-card__body.no-pad > :deep(.app-table-wrap:only-child) {
  margin: 0;
}

.app-card__footer {
  padding: 12px 18px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
}
</style>
