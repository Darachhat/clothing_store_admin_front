<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :target="target"
    class="app-btn"
    :class="[`app-btn--${normalizedVariant}`, `app-btn--${size || 'md'}`]"
  >
    <slot name="icon-left">
      <UIcon v-if="icon" :name="icon" class="app-btn__icon" />
    </slot>
    <slot>{{ label }}</slot>
  </NuxtLink>
  <button
    v-else
    :type="type || 'button'"
    :disabled="disabled || loading"
    class="app-btn"
    :class="[`app-btn--${normalizedVariant}`, `app-btn--${size || 'md'}`, { 'is-loading': loading }]"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-spinner" />
    <slot v-else name="icon-left">
      <UIcon v-if="icon" :name="icon" class="app-btn__icon" />
    </slot>
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  variant?: 'primary' | 'default' | 'secondary' | 'ghost' | 'danger' | string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  to?: string
  target?: string
  label?: string
  icon?: string
  color?: string
}>()

defineEmits(['click'])

const normalizedVariant = computed(() => {
  if (props.color === 'red' || props.variant === 'danger') return 'danger'
  if (props.variant === 'primary' || props.color === 'primary') return 'primary'
  if (props.variant === 'ghost') return 'ghost'
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
}

.app-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.app-btn--xs { padding: 4px 8px;  font-size: 11.5px; min-height: 26px; }
.app-btn--sm { padding: 5px 10px; font-size: 12px;   min-height: 30px; }
.app-btn--md { padding: 7px 13px; font-size: 13px;   min-height: 36px; }
.app-btn--lg { padding: 9px 18px; font-size: 14px;   min-height: 40px; }

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
.app-btn--default {
  background: var(--surface-card, #ffffff);
  color: var(--text-primary, #0f172a);
  border-color: var(--border-subtle, #e5e7eb);
}
.app-btn--default:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  border-color: var(--border-default, #d1d5db);
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
