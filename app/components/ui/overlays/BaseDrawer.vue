<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-navy-deep/50 flex justify-end z-50"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Detail Drawer'"
        @click.self="close"
      >
        <aside
          class="bg-white border-l border-subtle shadow-modal flex flex-col h-full w-full overflow-hidden"
          :class="sizeClasses"
          :style="width ? `max-width: ${width};` : undefined"
        >
          <header class="flex items-start justify-between gap-3 px-5 py-4 border-b border-subtle flex-shrink-0">
            <div class="flex flex-col gap-0.5 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-medium text-ink m-0">{{ title }}</h3>
                <slot name="badge" />
              </div>
              <p v-if="subtitle" class="text-xs text-ink-secondary m-0 mt-0.5">{{ subtitle }}</p>
            </div>
            <button
              type="button"
              class="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors"
              aria-label="Close drawer"
              @click="close"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </header>

          <div class="p-5 overflow-y-auto flex-1">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="px-5 py-3.5 border-t border-subtle bg-surface-bg/40 flex items-center justify-end gap-2 flex-shrink-0">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  width?: string
}>()

const emit = defineEmits(['update:modelValue', 'close'])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'max-w-[380px]'
    case 'lg': return 'max-w-[640px]'
    default: return 'max-w-[500px]'
  }
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

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>