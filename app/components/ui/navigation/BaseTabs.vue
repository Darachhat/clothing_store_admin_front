<template>
  <div
    class="max-w-full overflow-x-auto"
    :class="variant === 'underline'
      ? 'flex items-center gap-2 border-b border-subtle w-full'
      : 'inline-flex items-center gap-1 p-1 bg-surface-bg border border-subtle rounded-lg'"
    role="tablist"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.key"
      :disabled="tab.disabled"
      class="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 cursor-pointer transition-all whitespace-nowrap select-none"
      :class="variant === 'underline'
        ? (modelValue === tab.key
          ? 'text-ink border-b-2 border-brand-900 -mb-px font-bold'
          : 'text-ink-secondary hover:text-ink border-b-2 border-transparent')
        : (modelValue === tab.key
          ? 'bg-white text-ink rounded-md shadow-xs'
          : 'text-ink-secondary hover:text-ink hover:bg-surface-hover rounded-md')"
      @click="$emit('update:modelValue', tab.key)"
    >
      <UIcon v-if="tab.icon" :name="tab.icon" class="w-3.5 h-3.5 flex-shrink-0" />
      <span>{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
        :class="modelValue === tab.key ? 'bg-surface-bg text-ink' : 'bg-surface-hover text-ink-secondary'"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TabItem } from '~/types'

withDefaults(defineProps<{
  modelValue: string
  tabs: TabItem[]
  variant?: 'pills' | 'underline'
}>(), {
  variant: 'pills',
})

defineEmits<{
  'update:modelValue': [key: string]
}>()
</script>
