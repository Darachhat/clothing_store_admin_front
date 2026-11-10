<template>
  <div class="w-full flex flex-col gap-2.5" aria-busy="true" aria-live="polite">
    <template v-if="variant === 'kpi'">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in rows" :key="i" class="flex flex-col gap-2.5 p-4 bg-white border border-subtle rounded-lg">
          <span class="block h-3 w-1/2 bg-surface-hover animate-pulse rounded" />
          <span class="block h-6 w-3/4 bg-surface-hover animate-pulse rounded" />
        </div>
      </div>
    </template>
    <template v-else-if="variant === 'table'">
      <span class="block h-8 w-full bg-surface-hover animate-pulse rounded-md mb-1" />
      <span v-for="i in rows" :key="i" class="block h-10 w-full bg-surface-hover animate-pulse rounded-md" />
    </template>
    <template v-else-if="variant === 'card'">
      <span class="block w-full bg-surface-hover animate-pulse rounded-lg" :style="{ height: height || '120px' }" />
    </template>
    <template v-else-if="variant === 'detail'">
      <span class="block h-5 w-2/5 bg-surface-hover animate-pulse rounded" />
      <span class="block w-full bg-surface-hover animate-pulse rounded-lg" :style="{ height: height || '160px' }" />
      <span class="block h-3 w-4/5 bg-surface-hover animate-pulse rounded" />
      <span class="block h-3 w-3/5 bg-surface-hover animate-pulse rounded" />
    </template>
    <template v-else>
      <span
        v-for="i in rows"
        :key="i"
        class="block h-3.5 bg-surface-hover animate-pulse rounded"
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
