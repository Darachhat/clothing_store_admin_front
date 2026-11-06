<template>
  <div class="app-empty-state">
    <div class="app-empty-state__icon">
      <UIcon :name="icon || 'i-heroicons-inbox'" class="w-6 h-6" />
    </div>
    <h4 class="app-empty-state__title">{{ title || 'No records found' }}</h4>
    <p v-if="description" class="app-empty-state__desc">{{ description }}</p>
    <div v-if="$slots.default || actionLabel" class="app-empty-state__action">
      <slot>
        <BaseButton
          v-if="actionLabel"
          size="sm"
          variant="primary"
          :icon="actionIcon || 'i-heroicons-plus'"
          :label="actionLabel"
          @click="$emit('action')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}>()

defineEmits(['action'])
</script>

<style scoped>
.app-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  gap: 6px;
}

.app-empty-state__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-lg, 8px);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--text-tertiary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.app-empty-state__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

.app-empty-state__desc {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
  max-width: 360px;
}

.app-empty-state__action {
  margin-top: 8px;
}
</style>

