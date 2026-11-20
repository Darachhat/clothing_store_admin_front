<template>
  <div v-if="total > 0" class="flex items-center justify-between gap-3 flex-wrap text-sm text-ink-secondary py-2">
    <div class="flex items-center gap-3 flex-wrap">
      <span>
        Showing <strong class="text-ink font-medium tabular-nums">{{ startItem }}</strong>–<strong class="text-ink font-medium tabular-nums">{{ endItem }}</strong> of <strong class="text-ink font-medium tabular-nums">{{ total }}</strong>
      </span>
      <select
        v-if="showPageSize"
        :value="pageSize"
        aria-label="Items per page"
        class="h-8 px-2 rounded-lg border border-border-default bg-surface-card text-xs font-medium text-ink outline-none focus:border-navy cursor-pointer"
        @change="onPageSizeChange(($event.target as HTMLSelectElement).value)"
      >
        <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">
          {{ opt }} / page
        </option>
      </select>
    </div>

    <div class="flex items-center gap-1.5 flex-wrap">
      <!-- First & Previous -->
      <button
        type="button"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border-default bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        :disabled="page <= 1"
        aria-label="First page"
        title="First page"
        @click="goToPage(1)"
      >
        <UIcon name="i-heroicons-chevron-double-left" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border-default bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        :disabled="page <= 1"
        aria-label="Previous page"
        title="Previous page"
        @click="goToPage(page - 1)"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
      </button>

      <!-- CDC Direct Jump-to-Page Input -->
      <div class="flex items-center gap-1.5 px-1.5">
        <input
          type="number"
          inputmode="numeric"
          :min="1"
          :max="totalPages"
          :value="page"
          aria-label="Jump to page"
          class="w-12 h-8 text-center text-sm font-medium tabular-nums text-ink bg-surface-card border border-border-default rounded-lg px-1.5 outline-none focus:border-navy transition-colors"
          @change="onPageInput(($event.target as HTMLInputElement).value)"
          @keydown.enter.prevent="onPageInput(($event.target as HTMLInputElement).value)"
        />
        <span class="text-xs text-ink-secondary whitespace-nowrap tabular-nums">
          / <strong class="text-ink font-medium">{{ totalPages }}</strong>
        </span>
      </div>

      <!-- Next & Last -->
      <button
        type="button"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border-default bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        :disabled="page >= totalPages"
        aria-label="Next page"
        title="Next page"
        @click="goToPage(page + 1)"
      >
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
      </button>
      <button
        type="button"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border-default bg-surface-card text-ink-secondary hover:bg-surface-hover hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        :disabled="page >= totalPages"
        aria-label="Last page"
        title="Last page"
        @click="goToPage(totalPages)"
      >
        <UIcon name="i-heroicons-chevron-double-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  page: number
  pageSize?: number
  total: number
  showPageSize?: boolean
  pageSizeOptions?: number[]
}>(), {
  pageSize: 25,
  showPageSize: false,
  pageSizeOptions: () => [10, 20, 25, 50],
})

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const startItem = computed(() => props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1)
const endItem = computed(() => Math.min(props.total, props.page * props.pageSize))

function goToPage(target: number) {
  const clamped = Math.min(Math.max(1, Math.floor(target)), totalPages.value)
  if (clamped !== props.page) {
    emit('update:page', clamped)
  }
}

function onPageInput(raw: string) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 1) return
  goToPage(parsed)
}

function onPageSizeChange(raw: string) {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 1) return
  emit('update:pageSize', parsed)
  emit('update:page', 1)
}
</script>
