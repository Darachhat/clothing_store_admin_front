<template>
  <div class="base-tabs" :class="`base-tabs--${variant}`" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :disabled="tab.disabled"
      class="base-tab"
      :class="{ 'is-active': modelValue === tab.key }"
      @click="$emit('update:modelValue', tab.key)"
    >
      <UIcon v-if="tab.icon" :name="tab.icon" class="base-tab__icon" />
      <span class="base-tab__label">{{ tab.label }}</span>
      <span v-if="tab.count !== undefined && tab.count !== null" class="base-tab__count">
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TabItem } from '~/types'

withDefaults(defineProps<{
  modelValue: string
  tabs: TabItem[]
  variant?: 'pills' | 'underline'
}>(), {
  variant: 'pills',
})

defineEmits<{
  'update:modelValue': [key: string]
}>()
</script>

<style scoped>
.base-tabs {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}

.base-tabs::-webkit-scrollbar {
  display: none;
}

.base-tabs--pills {
  gap: 4px;
  padding: 4px;
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
}

.base-tabs--underline {
  gap: 6px;
  width: 100%;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
}

.base-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.14s ease, color 0.14s ease;
}

.base-tabs--pills .base-tab {
  height: 30px;
  padding: 0 11px;
  border-radius: var(--radius-md, 6px);
}

.base-tabs--pills .base-tab.is-active {
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  border-color: var(--border-subtle, #e5e7eb);
}

.base-tabs--underline .base-tab {
  padding: 8px 12px;
  border-width: 0 0 2px 0;
  border-bottom-color: transparent;
  margin-bottom: -1px;
}

.base-tabs--underline .base-tab.is-active {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
  border-bottom-color: var(--text-primary, #0f172a);
}

.base-tab:hover:not(:disabled) {
  color: var(--text-primary, #0f172a);
}

.base-tab:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.base-tab__icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.base-tab__count {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 9999px;
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-secondary, #475569);
}

.base-tab.is-active .base-tab__count {
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
}

@media (max-width: 767px) {
  .base-tabs--pills .base-tab {
    height: 34px;
  }
}
</style>

