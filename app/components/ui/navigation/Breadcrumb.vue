<template>
  <nav v-if="items && items.length" class="base-breadcrumb" aria-label="Breadcrumb">
    <template v-for="(crumb, idx) in items" :key="idx">
      <NuxtLink v-if="crumb.to" :to="crumb.to" class="base-breadcrumb__link">
        <UIcon v-if="crumb.icon" :name="crumb.icon" class="w-3.5 h-3.5 flex-shrink-0" />
        <span>{{ crumb.label }}</span>
      </NuxtLink>
      <span v-else class="base-breadcrumb__current">
        <UIcon v-if="crumb.icon" :name="crumb.icon" class="w-3.5 h-3.5 flex-shrink-0" />
        <span>{{ crumb.label }}</span>
      </span>
      <UIcon
        v-if="idx < items.length - 1"
        name="i-heroicons-chevron-right"
        class="base-breadcrumb__sep"
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

<style scoped>
.base-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.base-breadcrumb__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-tertiary, #64748b);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.12s ease;
}

.base-breadcrumb__link:hover {
  color: var(--text-primary, #0f172a);
}

.base-breadcrumb__current {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}

.base-breadcrumb__sep {
  width: 12px;
  height: 12px;
  color: var(--text-muted, #94a3b8);
  flex-shrink: 0;
}
</style>

