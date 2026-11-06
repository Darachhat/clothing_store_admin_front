<template>
  <NuxtLink
    v-if="to && !disabled && !loading"
    :to="to"
    :target="target"
    class="app-btn"
    :class="[
      `app-btn--${normalizedVariant}`,
      `app-btn--${size || 'md'}`,
      { 'app-btn--block': block || fullWidth },
    ]"
    :aria-label="ariaLabel || label"
  >
    <slot name="icon-left">
      <UIcon v-if="icon" :name="icon" class="app-btn__icon" />
    </slot>
    <span v-if="$slots.default || label" class="app-btn__label">
      <slot>{{ label }}</slot>
    </span>
    <slot name="icon-right">
      <UIcon v-if="trailingIcon || iconRight" :name="(trailingIcon || iconRight)!" class="app-btn__icon" />
    </slot>
  </NuxtLink>
  <button
    v-else
    :type="type || 'button'"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    :aria-label="ariaLabel || label"
    class="app-btn"
    :class="[
      `app-btn--${normalizedVariant}`,
      `app-btn--${size || 'md'}`,
      { 'is-loading': loading, 'app-btn--block': block || fullWidth },
    ]"
    @click="onClick"
  >
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />
    <slot v-else name="icon-left">
      <UIcon v-if="icon" :name="icon" class="app-btn__icon" />
    </slot>
    <span v-if="$slots.default || label" class="app-btn__label">
      <slot>{{ label }}</slot>
    </span>
    <slot v-if="!loading" name="icon-right">
      <UIcon v-if="trailingIcon || iconRight" :name="(trailingIcon || iconRight)!" class="app-btn__icon" />
    </slot>
  </button>
</template>

<script setup lang="ts">
import type { ButtonVariant, ButtonSize } from '~/types'

const props = defineProps<{
  variant?: ButtonVariant
  size?: ButtonSize
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
  target?: string
  label?: string
  ariaLabel?: string
  icon?: string
  trailingIcon?: string
  iconRight?: string
  color?: string
  block?: boolean
  fullWidth?: boolean
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
  if (props.color === 'red' || props.variant === 'danger') return 'danger'
  if (props.color === 'green' || props.variant === 'success') return 'success'
  if (props.variant === 'primary' || props.color === 'primary') return 'primary'
  if (props.variant === 'outline') return 'outline'
  if (props.variant === 'ghost') return 'ghost'
  if (props.variant === 'link') return 'link'
  if (props.variant === 'secondary') return 'secondary'
  return 'default'
})
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-body);
  font-weight: 500;
  border-radius: var(--radius-md, 6px);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s, opacity 0.12s;
  white-space: nowrap;
  text-decoration: none;
  line-height: 1.25;
  user-select: none;
}

.app-btn--block {
  display: flex;
  width: 100%;
}

.app-btn:focus-visible {
  outline: 2px solid var(--border-strong, #9ca3af);
  outline-offset: 1px;
}

.app-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-btn--xs { padding: 4px 8px;  font-size: 11.5px; min-height: var(--btn-height-xs, 26px); }
.app-btn--sm { padding: 5px 10px; font-size: 12px;   min-height: var(--btn-height-sm, 30px); }
.app-btn--md { padding: 7px 13px; font-size: 13px;   min-height: var(--btn-height-md, 36px); }
.app-btn--lg { padding: 9px 18px; font-size: 14px;   min-height: var(--btn-height-lg, 40px); }

.app-btn__icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.app-btn--xs .app-btn__icon,
.app-btn--sm .app-btn__icon {
  width: 14px;
  height: 14px;
}

/* Primary — high-contrast dark slate */
.app-btn--primary {
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  border-color: transparent;
}
.app-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover, #1e293b);
}

/* Default / Secondary — subtle neutral border */
.app-btn--default,
.app-btn--secondary {
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-color: var(--border-subtle, #e5e7eb);
}
.app-btn--default:hover:not(:disabled),
.app-btn--secondary:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  border-color: var(--border-default, #d1d5db);
}

/* Outline — transparent background with neutral border */
.app-btn--outline {
  background: transparent;
  color: var(--text-primary, #0f172a);
  border-color: var(--border-default, #d1d5db);
}
.app-btn--outline:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  border-color: var(--border-strong, #9ca3af);
}

/* Ghost */
.app-btn--ghost {
  background: transparent;
  color: var(--text-secondary, #475569);
  border-color: transparent;
}
.app-btn--ghost:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

/* Danger — neutral subtle border per AGENTS.md */
.app-btn--danger {
  background: var(--status-red-bg, #fef2f2);
  color: var(--status-red, #b91c1c);
  border-color: var(--border-subtle, #e5e7eb);
}
.app-btn--danger:hover:not(:disabled) {
  background: #fee2e2;
}

/* Success — neutral subtle border per AGENTS.md */
.app-btn--success {
  background: var(--status-green-bg, #f0fdf4);
  color: var(--status-green, #15803d);
  border-color: var(--border-subtle, #e5e7eb);
}
.app-btn--success:hover:not(:disabled) {
  background: #dcfce7;
}

/* Link */
.app-btn--link {
  background: transparent;
  color: var(--text-primary, #0f172a);
  border-color: transparent;
  padding-left: 4px;
  padding-right: 4px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.app-btn--link:hover:not(:disabled) {
  color: var(--text-secondary, #475569);
}

.btn-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

