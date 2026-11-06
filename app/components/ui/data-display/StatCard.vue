<template>
  <div class="stat-card">
    <div class="stat-card__top">
      <span class="stat-card__label">{{ label }}</span>
      <div v-if="icon" class="stat-card__icon" :class="`stat-card__icon--${tone || 'neutral'}`">
        <UIcon :name="icon" class="w-4 h-4" />
      </div>
    </div>

    <div v-if="loading" class="stat-card__skeleton" />
    <div v-else class="stat-card__value-row">
      <span class="stat-card__value" :class="valueClass">{{ value }}</span>
      <StatusBadge v-if="badge" :color="badgeColor || 'default'" size="sm">{{ badge }}</StatusBadge>
    </div>

    <p v-if="sublabel || $slots.sublabel" class="stat-card__sublabel">
      <slot name="sublabel">{{ sublabel }}</slot>
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  sublabel?: string
  icon?: string
  tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  badge?: string
  badgeColor?: string
  valueClass?: string
  loading?: boolean
}>()
</script>

<style scoped>
.stat-card {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
  padding: 15px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: var(--shadow-xs, 0 1px 2px rgba(15, 23, 42, 0.04));
  min-width: 0;
}

.stat-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary, #64748b);
  line-height: 1.3;
  min-width: 0;
  overflow-wrap: anywhere;
}

.stat-card__icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-subtle, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-card__icon--neutral {
  background: var(--surface-inset, #f8fafc);
  color: var(--text-secondary, #475569);
}

.stat-card__icon--green,
.stat-card__icon--success {
  background: var(--status-green-bg, #f0fdf4);
  color: var(--status-green, #15803d);
}

.stat-card__icon--amber,
.stat-card__icon--warning {
  background: var(--status-amber-bg, #fffbeb);
  color: var(--status-amber, #b45309);
}

.stat-card__icon--red,
.stat-card__icon--danger {
  background: var(--status-red-bg, #fef2f2);
  color: var(--status-red, #b91c1c);
}

.stat-card__icon--blue,
.stat-card__icon--info,
.stat-card__icon--primary {
  background: var(--status-blue-bg, #eff6ff);
  color: var(--status-blue, #1d4ed8);
}

.stat-card__value-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}

.stat-card__value {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.02em;
  line-height: 1.2;
  min-width: 0;
  overflow-wrap: anywhere;
}

.stat-card__sublabel {
  font-size: 11.5px;
  color: var(--text-tertiary, #64748b);
  margin: 0;
  line-height: 1.35;
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 639px) {
  .stat-card {
    padding: 12px 13px;
    gap: 4px;
  }

  .stat-card__icon {
    width: 26px;
    height: 26px;
  }

  .stat-card__value {
    font-size: 18px;
  }

  .stat-card__sublabel {
    font-size: 11px;
  }
}

.stat-card__skeleton {
  height: 26px;
  width: 55%;
  border-radius: var(--radius-sm, 4px);
  background: linear-gradient(90deg, var(--surface-hover, #f1f5f9) 25%, var(--surface-active, #e2e8f0) 50%, var(--surface-hover, #f1f5f9) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

