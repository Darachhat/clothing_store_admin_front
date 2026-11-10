<template>
  <section class="flex flex-col gap-3" :class="{ 'pt-3.5 border-t border-subtle': bordered }">
    <div v-if="title || description || $slots.header" class="flex items-start justify-between gap-3 flex-wrap">
      <div class="flex flex-col gap-0.5">
        <h4 v-if="title" class="text-xs font-bold uppercase tracking-wider text-ink-secondary m-0">{{ title }}</h4>
        <p v-if="description" class="text-xs text-ink-tertiary m-0">{{ description }}</p>
      </div>
      <div v-if="$slots['header-right']">
        <slot name="header-right" />
      </div>
    </div>
    <div
      class="grid gap-3.5"
      :class="{
        'grid-cols-1': !columns || columns === 1,
        'grid-cols-1 md:grid-cols-2': columns === 2,
        'grid-cols-1 md:grid-cols-3': columns === 3,
      }"
    >
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
