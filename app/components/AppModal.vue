<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="modal-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Dialog'"
        @click.self="close"
      >
        <div class="modal-panel" :class="`modal-panel--${resolvedSize}`">
          <div v-if="title || $slots.header" class="modal-header">
            <slot name="header">
              <div class="modal-header__titles">
                <h3 class="modal-title">{{ title }}</h3>
                <p v-if="description" class="modal-subtitle">{{ description }}</p>
              </div>
            </slot>
            <button type="button" class="modal-close" aria-label="Close dialog" @click="close">
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
          <div class="modal-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  ui?: Record<string, any>
}>()

const emit = defineEmits(['update:modelValue', 'close'])

const resolvedSize = computed(() => {
  if (props.size) return props.size
  const widthStr = String(props.ui?.width || '')
  if (widthStr.includes('2xl') || widthStr.includes('3xl') || widthStr.includes('4xl')) return 'xl'
  if (widthStr.includes('xl') || widthStr.includes('lg')) return 'lg'
  if (widthStr.includes('sm')) return 'sm'
  return 'md'
})

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(() => props.modelValue, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 16px;
}

.modal-panel {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-xl, 12px);
  box-shadow: var(--shadow-lg, 0 12px 28px rgba(15, 23, 42, 0.12));
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow: hidden;
}

.modal-panel--sm { max-width: 420px; }
.modal-panel--md { max-width: 540px; }
.modal-panel--lg { max-width: 680px; }
.modal-panel--xl { max-width: 860px; }

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  flex-shrink: 0;
}

.modal-header__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
  margin: 0;
  line-height: 1.35;
}

.modal-subtitle {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}

.modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  border-radius: var(--radius-md, 6px);
  transition: color 0.12s, background 0.12s;
  flex-shrink: 0;
}

.modal-close:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-hover, #f1f5f9);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Seamless support when a legacy page wraps <AppCard> directly inside <AppModal> */
.modal-body > :deep(.app-card:only-child) {
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin: -20px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 13px 20px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
  flex-shrink: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.15s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
