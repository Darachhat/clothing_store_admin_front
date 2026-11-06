<template>
  <div class="app-filter-bar">
    <div class="app-filter-bar__controls">
      <!-- Search Input -->
      <div v-if="searchable" class="app-filter-search">
        <UIcon name="i-heroicons-magnifying-glass" class="app-filter-search__icon" />
        <input
          type="text"
          :value="search"
          :placeholder="searchPlaceholder || 'Search...'"
          class="app-filter-search__input search-bare"
          @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
          @keyup.enter="$emit('submit')"
        />
        <button
          v-if="search"
          type="button"
          class="app-filter-search__clear"
          aria-label="Clear search"
          @click="$emit('update:search', ''); $emit('submit')"
        >
          <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Custom Filter Controls Slot -->
      <slot />

      <!-- Right Side Result Count & Reset -->
      <div class="app-filter-bar__right">
        <span v-if="totalCount !== undefined" class="app-filter-count">
          Showing <strong>{{ shownCount !== undefined ? shownCount : totalCount }}</strong>
          <template v-if="shownCount !== undefined && shownCount !== totalCount"> of <strong>{{ totalCount }}</strong></template>
          {{ countLabel || 'records' }}
        </span>
        <slot name="right" />
      </div>
    </div>

    <!-- Active Filter Chips -->
    <div v-if="(chips && chips.length > 0) || hasActiveSearch" class="app-filter-chips">
      <span class="app-filter-chips__label">Active filters:</span>

      <span v-if="hasActiveSearch" class="app-filter-chip">
        <span class="app-filter-chip__key">Search:</span>
        <span class="app-filter-chip__val">"{{ search }}"</span>
        <button type="button" class="app-filter-chip__remove" @click="$emit('update:search', ''); $emit('submit')">
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </button>
      </span>

      <span v-for="chip in chips" :key="chip.key" class="app-filter-chip">
        <span class="app-filter-chip__key">{{ chip.label }}:</span>
        <span class="app-filter-chip__val">{{ chip.value }}</span>
        <button type="button" class="app-filter-chip__remove" @click="$emit('remove-chip', chip.key)">
          <UIcon name="i-heroicons-x-mark" class="w-3 h-3" />
        </button>
      </span>

      <button type="button" class="app-filter-chips__clear-all" @click="$emit('clear-all')">
        Clear all
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface FilterChipItem {
  key: string
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  search?: string
  searchable?: boolean
  searchPlaceholder?: string
  chips?: FilterChipItem[]
  totalCount?: number
  shownCount?: number
  countLabel?: string
}>(), {
  searchable: true,
})

defineEmits<{
  'update:search': [value: string]
  'submit': []
  'remove-chip': [key: string]
  'clear-all': []
}>()

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
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
}

.app-filter-search__icon {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  color: var(--text-tertiary, #64748b);
  pointer-events: none;
}

.app-filter-search__input {
  width: 100%;
  height: 36px;
  padding: 6px 30px 6px 32px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.app-filter-search__input:hover {
  border-color: var(--border-default, #d1d5db);
}

.app-filter-search__input:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.app-filter-search__clear {
  position: absolute;
  right: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm, 4px);
  border: none;
  background: transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
}

.app-filter-search__clear:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-hover, #f1f5f9);
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

.app-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full, 9999px);
  background: var(--surface-hover, #f1f5f9);
  border: 1px solid var(--border-subtle, #e5e7eb);
  font-size: 11.5px;
  color: var(--text-primary, #0f172a);
}

.app-filter-chip__key {
  color: var(--text-tertiary, #64748b);
  font-weight: 500;
}

.app-filter-chip__val {
  font-weight: 600;
}

.app-filter-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  padding: 1px;
  border-radius: 50%;
}

.app-filter-chip__remove:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-active, #e2e8f0);
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

