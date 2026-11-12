<template>
  <nav v-if="items && items.length" class="inline-flex items-center gap-1.5 text-sm mb-1 flex-wrap" aria-label="Breadcrumb">
    <template v-for="(crumb, idx) in items" :key="idx">
      <NuxtLink
        v-if="crumb.to"
        :to="crumb.to"
        class="inline-flex items-center gap-1 text-ink-secondary hover:text-ink font-medium transition-colors"
      >
        <UIcon v-if="crumb.icon" :name="crumb.icon" class="w-3.5 h-3.5 flex-shrink-0" />
        <span>{{ crumb.label }}</span>
      </NuxtLink>
      <span v-else class="inline-flex items-center gap-1 text-ink font-medium">
        <UIcon v-if="crumb.icon" :name="crumb.icon" class="w-3.5 h-3.5 flex-shrink-0" />
        <span>{{ crumb.label }}</span>
      </span>
      <UIcon
        v-if="idx < items.length - 1"
        name="i-heroicons-chevron-right"
        class="w-3 h-3 text-ink-tertiary flex-shrink-0"
      />
    </template>
  </nav>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types'

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>
