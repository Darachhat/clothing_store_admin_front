<template>
  <div class="bg-white border border-subtle rounded-lg overflow-hidden shadow-card">
    <div
      v-if="title || subtitle || $slots.header || $slots['header-right'] || $slots.actions"
      class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-subtle"
    >
      <slot name="header">
        <div class="flex flex-col gap-0.5 flex-1 min-w-[180px]">
          <div class="flex items-center gap-2">
            <UIcon v-if="icon" :name="icon" class="w-4 h-4 text-ink-secondary flex-shrink-0" />
            <span v-if="title" class="text-base font-medium text-ink">{{ title }}</span>
          </div>
          <p v-if="subtitle" class="text-xs text-ink-secondary leading-relaxed">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots['header-right'] || $slots.actions" class="flex flex-wrap items-center gap-2 flex-shrink-0">
        <slot name="header-right" />
        <slot name="actions" />
      </div>
    </div>
    <div :class="noPad ? '' : 'p-4'">
      <slot />
    </div>
    <div v-if="$slots.footer" class="px-4 py-3 bg-surface-bg/40 border-t border-subtle flex items-center justify-end gap-2">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
  icon?: string
  noPad?: boolean
}>()
</script>