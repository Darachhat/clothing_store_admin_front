<template>
  <div
    class="flex flex-wrap w-full sm:w-auto"
    :class="inline ? 'items-center gap-2' : 'items-end gap-3'"
  >
    <div
      class="flex flex-1 sm:flex-initial min-w-0"
      :class="inline ? 'flex-row items-center gap-1.5 w-full sm:w-auto' : 'flex-col gap-1.5 min-w-[135px] sm:min-w-[140px]'"
    >
      <label v-if="!inline" class="text-xs font-medium text-ink-secondary leading-tight">{{ fromLabel || 'From Date' }}</label>
      <span v-else class="text-xs text-ink-tertiary whitespace-nowrap min-w-9 sm:min-w-0">{{ fromLabel || 'From:' }}</span>
      <input
        type="date"
        :value="from ?? ''"
        :max="to || undefined"
        :disabled="disabled"
        class="w-full h-9 px-2.5 text-xs sm:text-sm rounded-md border border-border-subtle bg-surface-card text-ink hover:border-border-default focus:border-border-default focus:outline-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-surface-inset"
        @change="onFromChange"
      />
    </div>

    <div
      class="flex flex-1 sm:flex-initial min-w-0"
      :class="inline ? 'flex-row items-center gap-1.5 w-full sm:w-auto' : 'flex-col gap-1.5 min-w-[135px] sm:min-w-[140px]'"
    >
      <label v-if="!inline" class="text-xs font-medium text-ink-secondary leading-tight">{{ toLabel || 'To Date' }}</label>
      <span v-else class="text-xs text-ink-tertiary whitespace-nowrap min-w-9 sm:min-w-0">{{ toLabel || 'To:' }}</span>
      <input
        type="date"
        :value="to ?? ''"
        :min="from || undefined"
        :disabled="disabled"
        class="w-full h-9 px-2.5 text-xs sm:text-sm rounded-md border border-border-subtle bg-surface-card text-ink hover:border-border-default focus:border-border-default focus:outline-none transition-colors disabled:opacity-55 disabled:cursor-not-allowed disabled:bg-surface-inset"
        @change="onToChange"
      />
    </div>

    <div v-if="$slots.default" class="flex items-end gap-2.5 flex-wrap w-full sm:w-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  from?: string
  to?: string
  fromLabel?: string
  toLabel?: string
  inline?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  'change': []
}>()

function onFromChange(event: Event) {
  emit('update:from', (event.target as HTMLInputElement).value)
  emit('change')
}

function onToChange(event: Event) {
  emit('update:to', (event.target as HTMLInputElement).value)
  emit('change')
}
</script>

