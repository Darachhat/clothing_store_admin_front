<template>
  <div class="date-range-picker" :class="{ 'is-inline': inline }">
    <div class="date-range-picker__field">
      <label v-if="!inline" class="date-range-picker__label">{{ fromLabel || 'From Date' }}</label>
      <span v-else class="date-range-picker__inline-label">{{ fromLabel || 'From:' }}</span>
      <input
        type="date"
        :value="from ?? ''"
        :max="to || undefined"
        :disabled="disabled"
        class="date-range-picker__input"
        @change="onFromChange"
      />
    </div>

    <div class="date-range-picker__field">
      <label v-if="!inline" class="date-range-picker__label">{{ toLabel || 'To Date' }}</label>
      <span v-else class="date-range-picker__inline-label">{{ toLabel || 'To:' }}</span>
      <input
        type="date"
        :value="to ?? ''"
        :min="from || undefined"
        :disabled="disabled"
        class="date-range-picker__input"
        @change="onToChange"
      />
    </div>

    <div v-if="$slots.default" class="date-range-picker__extra">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  from?: string
  to?: string
  fromLabel?: string
  toLabel?: string
  inline?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:from': [value: string]
  'update:to': [value: string]
  'change': []
}>()

function onFromChange(event: Event) {
  emit('update:from', (event.target as HTMLInputElement).value)
  emit('change')
}

function onToChange(event: Event) {
  emit('update:to', (event.target as HTMLInputElement).value)
  emit('change')
}
</script>

<style scoped>
.date-range-picker {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.date-range-picker.is-inline {
  align-items: center;
  gap: 8px;
}

.date-range-picker__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 140px;
}

.date-range-picker.is-inline .date-range-picker__field {
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.date-range-picker__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #475569);
  line-height: 1.3;
}

.date-range-picker__inline-label {
  font-size: 12px;
  color: var(--text-tertiary, #64748b);
  white-space: nowrap;
}

.date-range-picker__input {
  width: 100%;
  min-height: var(--input-height-md, 36px);
  padding: 6px 10px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-input, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.date-range-picker__input:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.date-range-picker__input:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.date-range-picker__extra {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 639px) {
  .date-range-picker,
  .date-range-picker__extra {
    width: 100%;
  }

  .date-range-picker__field {
    flex: 1 1 135px;
    min-width: 0;
  }

  .date-range-picker.is-inline .date-range-picker__field {
    width: 100%;
  }

  .date-range-picker.is-inline .date-range-picker__inline-label {
    min-width: 36px;
  }
}
</style>

