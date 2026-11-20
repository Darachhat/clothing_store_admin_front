<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-end sm:items-stretch justify-end z-50"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Detail Drawer'"
        @click.self="close"
      >
        <div
          class="relative w-full h-[92dvh] sm:h-dvh flex flex-col cdc-side-drawer"
          :class="sizeClasses"
          :style="width ? `max-width: ${width};` : undefined"
        >
          <!-- CDC-style Floating Pill Close / Back Tab on Left Edge (Desktop sm+) -->
          <div
            class="hidden sm:flex items-center justify-center bg-surface-card rounded-l-full shadow-md border border-r-0 border-subtle absolute right-full top-12 z-20"
          >
            <button
              type="button"
              class="group inline-flex items-center justify-center w-10 h-10 rounded-l-full text-ink-secondary hover:text-navy hover:bg-surface-hover cursor-pointer transition-colors"
              :aria-label="nested ? 'Back' : 'Close drawer'"
              :title="nested ? 'Back' : 'Close'"
              @click="close"
            >
              <UIcon
                :name="nested ? 'i-heroicons-arrow-left' : 'i-heroicons-x-mark'"
                class="w-5 h-5 transition-transform duration-150 group-hover:scale-105"
              />
            </button>
          </div>

          <aside
            class="bg-surface-card border-t sm:border-t-0 sm:border-l border-subtle shadow-modal flex flex-col h-full w-full overflow-hidden rounded-t-2xl sm:rounded-none"
          >
            <!-- Mobile Pull Indicator -->
            <div class="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
              <div class="w-10 h-1 rounded-full bg-border-default" />
            </div>

            <!-- Unified CDC-style Drawer Header -->
            <header class="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-subtle shrink-0 bg-surface-card">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <button
                  v-if="nested"
                  type="button"
                  class="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-secondary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors shrink-0"
                  aria-label="Back"
                  @click="close"
                >
                  <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
                </button>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <div class="flex items-center gap-2 min-w-0">
                    <h3 class="text-base sm:text-lg font-semibold text-ink tracking-tight truncate m-0">
                      {{ title }}
                    </h3>
                    <slot name="badge" />
                  </div>
                  <p v-if="subtitle" class="text-xs text-ink-secondary truncate m-0">
                    {{ subtitle }}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <slot name="header-actions" />
                <button
                  type="button"
                  class="sm:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors"
                  aria-label="Close drawer"
                  @click="close"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
                </button>
              </div>
            </header>

            <!-- Scrollable Body -->
            <div
              class="overflow-y-auto flex-1 min-h-0"
              :class="noPadding ? 'p-0' : 'p-4 sm:p-5'"
            >
              <slot />
            </div>

            <!-- Sticky Action Footer -->
            <footer
              v-if="$slots.footer"
              class="px-4 sm:px-5 py-3.5 border-t border-subtle bg-surface-inset flex items-center justify-end gap-2.5 shrink-0"
            >
              <slot name="footer" />
            </footer>
          </aside>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  width?: string
  nested?: boolean
  noPadding?: boolean
}>(), {
  subtitle: '',
  size: 'md',
  width: '',
  nested: false,
  noPadding: false,
})

const emit = defineEmits(['update:modelValue', 'close'])

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'sm:max-w-[420px]'
    case 'lg': return 'sm:max-w-[640px]'
    case 'xl': return 'sm:max-w-[780px]'
    default: return 'sm:max-w-[520px]'
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
