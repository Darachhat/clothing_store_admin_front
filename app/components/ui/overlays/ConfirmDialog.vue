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
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4 z-[60]"
        role="alertdialog"
        aria-modal="true"
        :aria-label="title"
        @click.self="dismissible && !loading ? (isOpen = false) : undefined"
      >
        <div
          class="relative bg-surface-card border border-subtle rounded-2xl shadow-modal flex flex-col w-full max-w-[440px] overflow-hidden"
        >
          <!-- Optional Top-Right Dismiss Button (CDC pattern) -->
          <button
            v-if="dismissible"
            type="button"
            class="absolute right-3.5 top-3.5 inline-flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors disabled:opacity-40"
            :disabled="loading"
            aria-label="Close confirmation dialog"
            @click="isOpen = false"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4.5 h-4.5" />
          </button>

          <!-- Main Content: Centered on mobile, Icon-left on sm+ (CDC HelperConfirmationDialog layout) -->
          <div class="flex flex-col items-center p-6 pb-5 sm:flex-row sm:items-start sm:p-7 sm:pb-6 gap-4">
            <div
              class="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              :class="iconBadgeClasses"
            >
              <UIcon :name="resolvedIcon" class="w-5.5 h-5.5" />
            </div>

            <div class="flex-1 min-w-0 flex flex-col items-center text-center sm:items-start sm:text-left sm:pr-6 gap-1.5">
              <h3 class="text-lg font-semibold text-ink leading-6 m-0">
                {{ title }}
              </h3>
              <p v-if="message || description" class="text-sm text-ink-secondary leading-relaxed m-0">
                {{ message || description }}
              </p>
              <p v-if="consequence" class="text-xs text-ink-tertiary leading-normal m-0 pt-0.5">
                {{ consequence }}
              </p>
              <slot />
            </div>
          </div>

          <!-- Soft Footer Action Bar (CDC pattern) -->
          <div class="flex items-center justify-center sm:justify-end gap-2.5 bg-surface-inset border-t border-subtle px-6 py-3.5">
            <AppButton
              type="button"
              variant="default"
              size="sm"
              :label="cancelLabel || 'Cancel'"
              :disabled="loading"
              @click="isOpen = false"
            />
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 min-h-[34px] rounded-md text-sm font-medium border border-transparent transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              :class="confirmButtonClasses"
              :disabled="loading"
              @click="$emit('confirm')"
            >
              <span
                v-if="loading"
                class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0"
                aria-hidden="true"
              />
              <span>{{ confirmLabel || 'Confirm' }}</span>
            </button>
          </div>
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
  message?: string
  description?: string
  consequence?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary' | 'info' | 'default'
  icon?: string
  loading?: boolean
  dismissible?: boolean
}>(), {
  message: '',
  description: '',
  consequence: '',
  confirmLabel: '',
  cancelLabel: '',
  variant: 'danger',
  icon: '',
  loading: false,
  dismissible: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const resolvedIcon = computed(() => {
  if (props.icon) return props.icon
  switch (props.variant) {
    case 'warning':
      return 'i-heroicons-exclamation-triangle'
    case 'primary':
    case 'info':
      return 'i-heroicons-information-circle'
    case 'default':
      return 'i-heroicons-question-mark-circle'
    default:
      return 'i-heroicons-exclamation-triangle'
  }
})

const iconBadgeClasses = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'bg-amber-100 text-amber-600'
    case 'primary':
    case 'info':
      return 'bg-blue-100 text-navy'
    case 'default':
      return 'bg-slate-100 text-ink-secondary'
    default:
      return 'bg-red-100 text-red-600'
  }
})

const confirmButtonClasses = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'bg-amber-500 text-white hover:bg-amber-600'
    case 'primary':
    case 'info':
      return 'bg-navy text-white hover:bg-navy-deep'
    case 'default':
      return 'bg-ink text-white hover:opacity-90'
    default:
      return 'bg-red-600 text-white hover:bg-red-700'
  }
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value && props.dismissible && !props.loading) {
    isOpen.value = false
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
