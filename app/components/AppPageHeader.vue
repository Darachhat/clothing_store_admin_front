<template>
  <header class="app-page-header">
    <div class="app-page-header__left">
      <nav v-if="breadcrumbs && breadcrumbs.length" class="app-breadcrumbs" aria-label="Breadcrumb">
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="app-breadcrumb-link">
            <UIcon v-if="crumb.icon" :name="crumb.icon" class="w-3.5 h-3.5" />
            <span>{{ crumb.label }}</span>
          </NuxtLink>
          <span v-else class="app-breadcrumb-current">{{ crumb.label }}</span>
          <UIcon
            v-if="idx < breadcrumbs.length - 1"
            name="i-heroicons-chevron-right"
            class="app-breadcrumb-sep"
          />
        </template>
      </nav>
      <NuxtLink v-else-if="backTo" :to="backTo" class="back-link">
        <UIcon name="i-heroicons-arrow-left" class="w-3.5 h-3.5" />
        <span>{{ backLabel || 'Back' }}</span>
      </NuxtLink>

      <div class="app-page-header__title-row">
        <h1 class="page-title">{{ title }}</h1>
        <slot name="badge" />
      </div>
      <p v-if="description" class="page-subtitle">{{ description }}</p>
    </div>

    <div v-if="$slots.actions || $slots.secondary || primaryLabel" class="app-page-header__actions">
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
export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

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

<style scoped>
.app-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.app-page-header__left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 260px;
}

.app-page-header__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-page-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

@media (max-width: 639px) {
  .app-page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .app-page-header__left {
    flex: 1 1 auto;
  }

  .app-page-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}

.app-breadcrumbs {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.app-breadcrumb-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-tertiary, #64748b);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.12s;
}

.app-breadcrumb-link:hover {
  color: var(--text-primary, #0f172a);
}

.app-breadcrumb-current {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}

.app-breadcrumb-sep {
  width: 12px;
  height: 12px;
  color: var(--text-muted, #94a3b8);
}
</style>