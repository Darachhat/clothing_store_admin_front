<!-- AppToast — CDC-inspired tinted glassmorphic toast notifications -->
<template>
  <Teleport to="body">
    <div
      class="fixed top-3 right-3 left-3 sm:left-auto sm:top-5 sm:right-5 z-[99999] flex flex-col gap-2.5 pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup name="a-toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="flex items-start gap-3 w-full sm:w-auto sm:min-w-[300px] sm:max-w-[400px] px-4 py-3 rounded-xl border border-white/15 shadow-modal pointer-events-auto backdrop-blur-md text-white"
          :class="toastBgClass(toast.color)"
        >
          <div class="shrink-0 mt-0.5 text-white/95">
            <UIcon v-if="toast.color === 'green'" name="i-heroicons-check-circle" class="w-5 h-5" />
            <UIcon v-else-if="toast.color === 'red'" name="i-heroicons-x-circle" class="w-5 h-5" />
            <UIcon v-else-if="toast.color === 'amber'" name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
            <UIcon v-else name="i-heroicons-information-circle" class="w-5 h-5" />
          </div>

          <div class="flex-1 min-w-0 flex flex-col gap-0.5">
            <span class="text-sm font-semibold text-white leading-tight">{{ toast.title }}</span>
            <span v-if="toast.description" class="text-xs text-white/85 leading-snug">{{ toast.description }}</span>
          </div>

          <button
            type="button"
            class="shrink-0 text-white/75 hover:text-white hover:bg-white/15 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss toast"
            @click="dismiss(toast.id)"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useAppToast } from '~/composables/useAppToast'

const { toasts, dismiss } = useAppToast()

function toastBgClass(color?: string) {
  switch (color) {
    case 'green':
      return 'bg-emerald-700/95'
    case 'red':
      return 'bg-rose-700/95'
    case 'amber':
      return 'bg-amber-600/95'
    default:
      return 'bg-navy/95'
  }
}
</script>
