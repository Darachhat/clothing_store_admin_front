<template>
  <div v-if="total > 0" class="app-pagination">
    <div class="app-pagination__summary">
      Showing <strong>{{ startItem }}</strong>–<strong>{{ endItem }}</strong> of <strong>{{ total }}</strong>
    </div>

    <div class="app-pagination__controls">
      <AppButton
        size="xs"
        variant="default"
        icon="i-heroicons-chevron-left"
        label="Previous"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      />
      <span class="app-pagination__page">
        Page <strong>{{ page }}</strong> of <strong>{{ totalPages }}</strong>
      </span>
      <AppButton
        size="xs"
        variant="default"
        label="Next"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  pageSize?: number
  total: number
}>(), {
  pageSize: 25,
})

defineEmits<{
  'update:page': [page: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const startItem = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.total, props.page * props.pageSize))
</script>

<style scoped>
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
}

.app-pagination__summary strong,
.app-pagination__page strong {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}

.app-pagination__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 520px) {
  .app-pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .app-pagination__summary {
    text-align: center;
  }

  .app-pagination__controls {
    justify-content: space-between;
    width: 100%;
  }
}
</style>