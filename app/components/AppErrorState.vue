<template>
  <div class="app-error-state">
    <div class="app-error-state__icon">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
    </div>
    <h4 class="app-error-state__title">{{ title || 'Unable to load data' }}</h4>
    <p v-if="message" class="app-error-state__msg">{{ message }}</p>
    <div class="app-error-state__actions">
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

<style scoped>
.app-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 36px 20px;
  gap: 6px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
}

.app-error-state__icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-lg, 8px);
  background: var(--status-red-bg, #fef2f2);
  color: var(--status-red, #b91c1c);
  border: 1px solid var(--border-subtle, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.app-error-state__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

.app-error-state__msg {
  font-size: 12px;
  color: var(--text-secondary, #475569);
  margin: 0;
  max-width: 420px;
}

.app-error-state__actions {
  margin-top: 8px;
}
</style>

