<template>
  <div v-if="total > 0" class="flex items-center justify-between gap-3 flex-wrap text-sm text-ink-secondary py-2">
    <div>
      Showing <strong class="text-ink font-medium">{{ startItem }}</strong>–<strong class="text-ink font-medium">{{ endItem }}</strong> of <strong class="text-ink font-medium">{{ total }}</strong>
    </div>

    <div class="flex items-center gap-2">
      <AppButton
        size="xs"
        variant="default"
        icon="i-heroicons-chevron-left"
        label="Previous"
        :disabled="page <= 1"
        @click="$emit('update:page', page - 1)"
      />
      <span class="text-xs px-1">
        Page <strong class="text-ink font-medium">{{ page }}</strong> of <strong class="text-ink font-medium">{{ totalPages }}</strong>
      </span>
      <AppButton
        size="xs"
        variant="default"
        trailing-icon="i-heroicons-chevron-right"
        label="Next"
        :disabled="page >= totalPages"
        @click="$emit('update:page', page + 1)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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