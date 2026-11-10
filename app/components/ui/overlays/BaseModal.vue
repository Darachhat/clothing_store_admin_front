<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Dialog'"
        @click.self="close"
      >
        <div
          class="bg-white border border-subtle rounded-xl shadow-2xl flex flex-col w-full max-h-[calc(100dvh-32px)] overflow-hidden min-w-0"
          :class="sizeClasses"
        >
          <div v-if="title || $slots.header" class="flex items-start justify-between gap-3 px-5 py-3.5 border-b border-subtle flex-shrink-0">
            <slot name="header">
              <div class="flex flex-col gap-0.5 min-w-0">
                <h3 class="text-base font-semibold text-ink m-0 leading-snug">{{ title }}</h3>
                <p v-if="description" class="text-xs text-ink-secondary m-0 mt-0.5">{{ description }}</p>
              </div>
            </slot>
            <button
              type="button"
              class="inline-flex items-center justify-center w-7 h-7 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors"
              aria-label="Close dialog"
              @click="close"
            >
              <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 overflow-y-auto flex-1 min-w-0">
            <slot />
          </div>
          <div v-if="$slots.footer" class="px-5 py-3.5 border-t border-subtle bg-surface-bg/40 flex items-center justify-end gap-2 flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

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

const sizeClasses = computed(() => {
  switch (resolvedSize.value) {
    case 'sm': return 'max-w-[420px]'
    case 'lg': return 'max-w-[680px]'
    case 'xl': return 'max-w-[860px]'
    default: return 'max-w-[540px]'
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
