<template>
  <div v-if="!dismissed" class="inline-alert" :class="`inline-alert--${variant}`" role="alert">
    <UIcon :name="iconName" class="inline-alert__icon" />
    <div class="inline-alert__body">
      <p v-if="title" class="inline-alert__title">{{ title }}</p>
      <p v-if="description" class="inline-alert__desc">{{ description }}</p>
      <slot />
    </div>
    <div v-if="$slots.actions" class="inline-alert__actions">
      <slot name="actions" />
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="inline-alert__close"
      aria-label="Dismiss"
      @click="dismiss"
    >
      <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'info' | 'success' | 'warning' | 'danger'
  title?: string
  description?: string
  icon?: string
  dismissible?: boolean
}>(), {
  variant: 'info',
})

const emit = defineEmits<{ dismiss: [] }>()

const dismissed = ref(false)

const iconName = computed(() => {
  if (props.icon) return props.icon
  switch (props.variant) {
    case 'success': return 'i-heroicons-check-circle'
    case 'warning': return 'i-heroicons-exclamation-triangle'
    case 'danger': return 'i-heroicons-x-circle'
    default: return 'i-heroicons-information-circle'
  }
})

function dismiss() {
  dismissed.value = true
  emit('dismiss')
}
</script>

<style scoped>
.inline-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-lg, 8px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  font-size: 12.5px;
  line-height: 1.45;
}

.inline-alert--info { background: var(--status-blue-bg, #eff6ff); color: var(--status-blue, #1d4ed8); }
.inline-alert--success { background: var(--status-green-bg, #f0fdf4); color: var(--status-green, #15803d); }
.inline-alert--warning { background: var(--status-amber-bg, #fffbeb); color: var(--status-amber, #b45309); }
.inline-alert--danger { background: var(--status-red-bg, #fef2f2); color: var(--status-red, #b91c1c); }

.inline-alert__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.inline-alert__body {
  flex: 1;
  min-width: 0;
}

.inline-alert__title {
  margin: 0;
  font-weight: 600;
}

.inline-alert__desc {
  margin: 0;
  color: var(--text-secondary, #475569);
}

.inline-alert__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.inline-alert__close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 2px;
  opacity: 0.7;
}

.inline-alert__close:hover { opacity: 1; }
</style>

