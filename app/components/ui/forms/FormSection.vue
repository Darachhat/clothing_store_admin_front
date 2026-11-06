<template>
  <section class="app-form-section" :class="{ 'is-bordered': bordered }">
    <div v-if="title || description || $slots.header" class="app-form-section__header">
      <div class="app-form-section__titles">
        <h4 v-if="title" class="app-form-section__title">{{ title }}</h4>
        <p v-if="description" class="app-form-section__desc">{{ description }}</p>
      </div>
      <div v-if="$slots['header-right']" class="app-form-section__right">
        <slot name="header-right" />
      </div>
    </div>
    <div class="app-form-section__body" :class="[`cols-${columns || 1}`]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
  columns?: 1 | 2 | 3
  bordered?: boolean
}>()
</script>

<style scoped>
.app-form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-form-section.is-bordered {
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}

.app-form-section__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.app-form-section__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-form-section__title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, #475569);
  margin: 0;
}

.app-form-section__desc {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}

.app-form-section__body {
  display: grid;
  gap: 14px;
}

.app-form-section__body.cols-1 {
  grid-template-columns: minmax(0, 1fr);
}

.app-form-section__body.cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.app-form-section__body.cols-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 639px) {
  .app-form-section__body.cols-2,
  .app-form-section__body.cols-3 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

