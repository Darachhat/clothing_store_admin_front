<template>
  <div class="skeleton" :class="`skeleton--${variant}`" aria-busy="true" aria-live="polite">
    <template v-if="variant === 'kpi'">
      <div v-for="i in rows" :key="i" class="skeleton__kpi">
        <span class="sk sk-line" style="width: 50%" />
        <span class="sk sk-line sk-line--lg" style="width: 70%" />
      </div>
    </template>
    <template v-else-if="variant === 'table'">
      <span class="sk sk-line sk-line--head" />
      <span v-for="i in rows" :key="i" class="sk sk-line sk-line--row" />
    </template>
    <template v-else-if="variant === 'card'">
      <span class="sk sk-block" :style="{ height: height || '120px' }" />
    </template>
    <template v-else-if="variant === 'detail'">
      <span class="sk sk-line sk-line--lg" style="width: 40%" />
      <span class="sk sk-block" :style="{ height: height || '160px' }" />
      <span class="sk sk-line" style="width: 80%" />
      <span class="sk sk-line" style="width: 60%" />
    </template>
    <template v-else>
      <span
        v-for="i in rows"
        :key="i"
        class="sk sk-line"
        :style="{ width: i === rows ? '60%' : '100%' }"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'card' | 'table' | 'kpi' | 'lines' | 'detail'
  rows?: number
  height?: string
}>(), {
  variant: 'lines',
  rows: 4,
})
</script>

<style scoped>
.skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.skeleton--kpi {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.skeleton__kpi {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
}

.sk {
  display: block;
  background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 37%, #f1f5f9 63%);
  background-size: 400% 100%;
  animation: sk-shimmer 1.4s ease infinite;
  border-radius: var(--radius-md, 6px);
}

.sk-line { height: 12px; }
.sk-line--lg { height: 20px; }
.sk-line--head { height: 32px; }
.sk-line--row { height: 40px; }
.sk-block { width: 100%; }

@keyframes sk-shimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
}
</style>

