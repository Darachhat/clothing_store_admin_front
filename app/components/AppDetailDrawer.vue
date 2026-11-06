<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div
        v-if="modelValue"
        class="drawer-backdrop"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Detail Drawer'"
        @click.self="close"
      >
        <aside
          class="drawer-panel"
          :class="`drawer-panel--${size || 'md'}`"
          :style="width ? `max-width: ${width};` : undefined"
        >
          <header class="drawer-header">
            <div class="drawer-header__titles">
              <div class="drawer-header__title-row">
                <h3 class="drawer-title">{{ title }}</h3>
                <slot name="badge" />
              </div>
              <p v-if="subtitle" class="drawer-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="drawer-close" aria-label="Close drawer" @click="close">
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </header>

          <div class="drawer-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="drawer-footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  width?: string
}>()

const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.modelValue) {
    close()
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (import.meta.client) {
      document.body.style.overflow = open ? 'hidden' : ''
    }
  },
)

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
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: flex-end;
  z-index: 210;
}

.drawer-panel {
  background: var(--surface-card, #ffffff);
  border-left: 1px solid var(--border-subtle, #e5e7eb);
  box-shadow: var(--shadow-lg, 0 12px 28px rgba(15, 23, 42, 0.12));
  height: 100dvh;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.drawer-panel--sm { max-width: 400px; }
.drawer-panel--md { max-width: 520px; }
.drawer-panel--lg { max-width: 680px; }

@media (max-width: 639px) {
  .drawer-panel {
    max-width: 100vw !important;
    width: 100vw !important;
    border-left: none;
  }
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
}

.drawer-header__titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.drawer-header__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.drawer-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0;
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
}

.drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  flex-shrink: 0;
}

.drawer-close:hover {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.drawer-body {
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.drawer-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  background: var(--surface-inset, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

@media (max-width: 639px) {
  .drawer-header {
    padding: 12px 14px;
  }

  .drawer-body {
    padding: 14px;
  }

  .drawer-footer {
    padding: 12px 14px;
  }
}

.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}
</style>