<template>
  <div class="bg-surface-card border border-border-subtle rounded-lg p-2.5 sm:p-3 flex flex-col gap-2.5 shadow-2xs">
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
      <!-- Reusable Centralized SearchBar -->
      <div v-if="searchable" class="relative flex-1 sm:min-w-[200px] w-full sm:w-auto">
        <SearchBar
          :model-value="search"
          :placeholder="searchPlaceholder || 'Search or scan barcode / QR...'"
          :debounce="searchDebounce"
          :loading="searchLoading"
          :scannable="scannable"
          @update:model-value="$emit('update:search', $event)"
          @search="$emit('submit')"
          @scan="$emit('scan', $event); $emit('submit')"
          @clear="$emit('update:search', ''); $emit('submit')"
        />
      </div>

      <!-- Custom Filter Controls Slot (Supports both default slot and #filters slot) -->
      <div v-if="$slots.default || $slots.filters" class="grid grid-cols-1 min-[420px]:grid-cols-2 sm:flex sm:flex-row sm:items-center gap-2 [&>*]:w-full sm:[&>*]:w-auto">
        <slot />
        <slot name="filters" />
      </div>

      <!-- Right Side Result Count & Reset -->
      <div v-if="totalCount !== undefined || $slots.right" class="flex items-center justify-between sm:justify-end gap-2.5 sm:ml-auto w-full sm:w-auto">
        <span v-if="totalCount !== undefined" class="text-xs text-ink-tertiary whitespace-nowrap">
          Showing <strong class="text-ink font-semibold">{{ shownCount !== undefined ? shownCount : totalCount }}</strong>
          <template v-if="shownCount !== undefined && shownCount !== totalCount"> of <strong class="text-ink font-semibold">{{ totalCount }}</strong></template>
          {{ resolvedCountLabel }}
        </span>
        <slot name="right" />
      </div>
    </div>

    <!-- Active Filter Chips (Using Reusable FilterChip) -->
    <div v-if="(resolvedChips.length > 0) || hasActiveSearch" class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-border-subtle">
      <span class="text-[11px] font-semibold text-ink-tertiary mr-0.5">Active filters:</span>

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

      <button
        type="button"
        class="text-xs font-semibold text-ink-secondary hover:text-ink underline px-1.5 py-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-ink cursor-pointer"
        @click="$emit('clear-all')"
      >
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
  scannable?: boolean
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
  scannable: true,
  searchDebounce: 0,
  searchLoading: false,
})

defineEmits<{
  'update:search': [value: string]
  'submit': []
  'scan': [value: string]
  'remove-chip': [key: string]
  'clear-all': []
}>()

const resolvedChips = computed<FilterChipItem[]>(() => props.chips || props.activeChips || [])
const resolvedCountLabel = computed<string>(() => props.countLabel || props.resultLabel || 'records')
const hasActiveSearch = computed(() => Boolean(props.search && props.search.trim().length > 0))
</script>

