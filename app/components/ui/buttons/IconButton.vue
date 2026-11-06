<template>
  <NuxtLink
    v-if="to && !disabled && !loading"
    :to="to"
    :title="title || label"
    :aria-label="label || title || 'Icon action'"
    class="icon-btn"
    :class="[`icon-btn--${normalizedVariant}`, `icon-btn--${size || 'sm'}`]"
  >
    <UIcon :name="icon" class="icon-btn__glyph" />
  </NuxtLink>
  <button
    v-else
    :type="type || 'button'"
    :disabled="disabled || loading"
    :title="title || label"
    :aria-label="label || title || 'Icon action'"
    class="icon-btn"
    :class="[`icon-btn--${normalizedVariant}`, `icon-btn--${size || 'sm'}`]"
    @click="onClick"
  >
    <span v-if="loading" class="icon-btn__spinner" aria-hidden="true" />
    <UIcon v-else :name="icon" class="icon-btn__glyph" />
  </button>
</template>

<script setup lang="ts">
import type { ButtonVariant, ButtonSize } from '~/types'

const props = defineProps<{
  icon: string
  label?: string
  title?: string
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

function onClick(event: MouseEvent) {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

const normalizedVariant = computed(() => {
  if (props.variant === 'danger') return 'danger'
  if (props.variant === 'primary') return 'primary'
  if (props.variant === 'default' || props.variant === 'secondary' || props.variant === 'outline') return 'default'
  return 'ghost'
})
</script>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 6px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, opacity 0.12s;
  flex-shrink: 0;
  text-decoration: none;
}

.icon-btn:focus-visible {
  outline: 2px solid var(--border-strong, #9ca3af);
  outline-offset: 1px;
}

.icon-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.icon-btn--xs { width: 26px; height: 26px; }
.icon-btn--sm { width: 30px; height: 30px; }
.icon-btn--md { width: 36px; height: 36px; }
.icon-btn--lg { width: 40px; height: 40px; }

.icon-btn__glyph {
  width: 15px;
  height: 15px;
}

.icon-btn--xs .icon-btn__glyph {
  width: 14px;
  height: 14px;
}

.icon-btn--lg .icon-btn__glyph {
  width: 17px;
  height: 17px;
}

.icon-btn--ghost {
  background: transparent;
  color: var(--text-secondary, #475569);
}
.icon-btn--ghost:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.icon-btn--default {
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-color: var(--border-subtle, #e5e7eb);
}
.icon-btn--default:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  border-color: var(--border-default, #d1d5db);
}

.icon-btn--primary {
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
}
.icon-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover, #1e293b);
}

.icon-btn--danger {
  background: transparent;
  color: var(--status-red, #b91c1c);
}
.icon-btn--danger:hover:not(:disabled) {
  background: var(--status-red-bg, #fef2f2);
  border-color: var(--border-subtle, #e5e7eb);
}

.icon-btn__spinner {
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

