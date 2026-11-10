<template>
  <div class="flex flex-col items-center justify-center text-center p-8 sm:p-10 gap-2">
    <div class="w-10 h-10 rounded-lg bg-surface-bg flex items-center justify-center text-ink-tertiary mb-1">
      <UIcon :name="icon || 'i-heroicons-inbox'" class="w-6 h-6" />
    </div>
    <h4 class="text-sm font-semibold text-ink m-0">{{ title || 'No records found' }}</h4>
    <p v-if="description" class="text-xs text-ink-secondary max-w-sm m-0 leading-relaxed">{{ description }}</p>
    <div v-if="$slots.default || actionLabel" class="mt-2">
      <slot>
        <BaseButton
          v-if="actionLabel"
          size="sm"
          variant="primary"
          :icon="actionIcon || 'i-heroicons-plus'"
          :label="actionLabel"
          @click="$emit('action')"
        />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
  actionIcon?: string
}>()

defineEmits(['action'])
</script>
