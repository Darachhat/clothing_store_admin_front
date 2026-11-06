<template>
  <div class="app-filter-bar">
    <div class="app-filter-bar__controls">
      <!-- Reusable Centralized SearchBar -->
      <div v-if="searchable" class="app-filter-search">
        <SearchBar
          :model-value="search"
          :placeholder="searchPlaceholder || 'Search...'"
          :debounce="searchDebounce"
          :loading="searchLoading"
          @update:model-value="$emit('update:search', $event)"
          @search="$emit('submit')"
          @clear="$emit('update:search', ''); $emit('submit')"
        />
      </div>

      <!-- Custom Filter Controls Slot (Supports both default slot and #filters slot) -->
      <div v-if="$slots.default || $slots.filters" class="app-filter-bar__slots">
        <slot />
        <slot name="filters" />
      </div>

      <!-- Right Side Result Count & Reset -->
      <div v-if="totalCount !== undefined || $slots.right" class="app-filter-bar__right">
        <span v-if="totalCount !== undefined" class="app-filter-count">
          Showing <strong>{{ shownCount !== undefined ? shownCount : totalCount }}</strong>
          <template v-if="shownCount !== undefined && shownCount !== totalCount"> of <strong>{{ totalCount }}</strong></template>
          {{ resolvedCountLabel }}
        </span>
        <slot name="right" />
      </div>
    </div>

    <!-- Active Filter Chips (Using Reusable FilterChip) -->
    <div v-if="(resolvedChips.length > 0) || hasActiveSearch" class="app-filter-chips">
      <span class="app-filter-chips__label">Active filters:</span>

      <FilterChip
        v-if="hasActiveSearch"
        label="Search"
        :value="`&quot;${search}&quot;`"
        @remove="$emit('update:search', ''); $emit('submit')"
      />

      <FilterChip
        v-for="chip in resolvedChips"
        :key="chip.key"
        :label="chip.label"
        :value="chip.value"
        @remove="$emit('remove-chip', chip.key)"
      />

      <button type="button" class="app-filter-chips__clear-all" @click="$emit('clear-all')">
        Clear all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

export type { FilterChipItem }

const props = withDefaults(defineProps<{
  search?: string
  searchable?: boolean
  searchPlaceholder?: string
  searchDebounce?: number
  searchLoading?: boolean
  chips?: FilterChipItem[]
  activeChips?: FilterChipItem[]
  totalCount?: number
  shownCount?: number
  countLabel?: string
  resultLabel?: string
}>(), {
  searchable: true,
  searchDebounce: 0,
  searchLoading: false,
})

defineEmits<{
  'update:search': [value: string]
  'submit': []
  'remove-chip': [key: string]
  'clear-all': []
}>()

const resolvedChips = computed<FilterChipItem[]>(() => props.chips || props.activeChips || [])
const resolvedCountLabel = computed<string>(() => props.countLabel || props.resultLabel || 'records')
const hasActiveSearch = computed(() => Boolean(props.search && props.search.trim().length > 0))
</script>

<style scoped>
.app-filter-bar {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04));
}

.app-filter-bar__controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.app-filter-search {
  position: relative;
  flex: 1 1 220px;
  min-width: 180px;
  display: flex;
  align-items: center;
}

.app-filter-bar__slots {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 639px) {
  .app-filter-bar {
    padding: 10px 12px;
  }

  .app-filter-bar__controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .app-filter-search {
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
  }

  .app-filter-bar__slots {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(135px, 1fr));
    gap: 8px;
    width: 100%;
  }

  .app-filter-bar__slots :deep(> *) {
    width: 100% !important;
    min-width: 0 !important;
  }

  .app-filter-bar__right {
    margin-left: 0 !important;
    justify-content: space-between;
    width: 100%;
  }
}

@media (max-width: 374px) {
  .app-filter-bar__slots {
    grid-template-columns: minmax(0, 1fr);
  }
}

.app-filter-bar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-filter-count {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  white-space: nowrap;
}

.app-filter-count strong {
  color: var(--text-primary, #0f172a);
  font-weight: 600;
}

.app-filter-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
}

.app-filter-chips__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #64748b);
  margin-right: 2px;
}

.app-filter-chips__clear-all {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  text-decoration: underline;
}

.app-filter-chips__clear-all:hover {
  color: var(--text-primary, #0f172a);
}
</style>

