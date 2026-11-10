<template>
  <header class="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 mb-2">
    <div class="flex flex-col gap-0.5 min-w-0 flex-1">
      <Breadcrumb v-if="breadcrumbs && breadcrumbs.length" :items="breadcrumbs" />
      <NuxtLink
        v-else-if="backTo"
        :to="backTo"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary hover:text-ink transition-colors mb-1"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
        <span>{{ backLabel || 'Back' }}</span>
      </NuxtLink>

      <div class="flex items-center gap-2 flex-wrap">
        <h1 class="text-xl sm:text-2xl font-bold text-ink tracking-tight">{{ title }}</h1>
        <slot name="badge" />
      </div>
      <p v-if="description" class="text-xs sm:text-sm text-ink-secondary mt-0.5">{{ description }}</p>
    </div>

    <div
      v-if="$slots.actions || $slots.secondary || primaryLabel"
      class="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto"
    >
      <slot name="secondary" />
      <slot name="actions">
        <AppButton
          v-if="primaryLabel"
          variant="primary"
          :icon="primaryIcon || 'i-heroicons-plus'"
          :label="primaryLabel"
          :to="primaryTo"
          :loading="primaryLoading"
          @click="$emit('primary-click')"
        />
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '~/types'

defineProps<{
  title: string
  description?: string
  backTo?: string
  backLabel?: string
  breadcrumbs?: BreadcrumbItem[]
  primaryLabel?: string
  primaryIcon?: string
  primaryTo?: string
  primaryLoading?: boolean
}>()

defineEmits(['primary-click'])
</script>
