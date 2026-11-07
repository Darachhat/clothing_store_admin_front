<template>
  <div
    class="search-bar"
    :class="[`search-bar--${size || 'md'}`, { 'is-disabled': disabled, 'is-scannable': scannable }]"
    :style="maxWidth ? { '--search-max-w': maxWidth } : undefined"
  >
    <span v-if="loading" class="search-bar__spinner" aria-hidden="true" />
    <UIcon
      v-else
      name="i-heroicons-magnifying-glass"
      class="search-bar__icon"
    />

    <input
      ref="inputEl"
      type="search"
      :value="internalValue"
      :placeholder="placeholder || 'Search or scan barcode / QR...'"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder || 'Search'"
      data-barcode-scanner-target="true"
      class="search-bar__input search-bare"
      @input="onInput"
      @keydown.enter="onEnter"
      @keydown.esc="onEscape"
    />

    <div class="search-bar__actions">
      <button
        v-if="clearable && internalValue && !disabled"
        type="button"
        class="search-bar__action-btn"
        aria-label="Clear search"
        title="Clear search"
        @click="clearSearch"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
      </button>

      <button
        v-if="scannable && !disabled"
        type="button"
        class="search-bar__scan-btn"
        aria-label="Scan barcode or QR code"
        title="Scan barcode or QR code to search"
        @click="showScannerModal = true"
      >
        <UIcon name="i-heroicons-qr-code" class="w-3.5 h-3.5" />
      </button>
    </div>

    <BarcodeScannerModal
      v-if="scannable"
      v-model="showScannerModal"
      :auto-close-on-scan="true"
      @scanned="onCodeScanned"
    />
  </div>
</template>

<script setup lang="ts">
import { normalizeScannedCode } from '~/utils/scanCode'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  ariaLabel?: string
  size?: 'sm' | 'md' | 'lg'
  debounce?: number
  loading?: boolean
  disabled?: boolean
  clearable?: boolean
  scannable?: boolean
  enableHardwareScanner?: boolean
  maxWidth?: string
}>(), {
  modelValue: '',
  size: 'md',
  debounce: 0,
  loading: false,
  disabled: false,
  clearable: true,
  scannable: true,
  enableHardwareScanner: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'search': [value: string]
  'scan': [value: string]
  'clear': []
}>()

const inputEl = ref<HTMLInputElement | null>(null)
const internalValue = ref(props.modelValue || '')
const showScannerModal = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.modelValue, (val) => {
  const next = val ?? ''
  if (next !== internalValue.value) {
    internalValue.value = next
  }
})

function maybeNormalizeIfUrl(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed) || /\/p\/[^/?#&\s]+/i.test(trimmed)) {
    return normalizeScannedCode(trimmed) || raw
  }
  return raw
}

function onInput(event: Event) {
  const rawVal = (event.target as HTMLInputElement).value
  const val = maybeNormalizeIfUrl(rawVal)
  internalValue.value = val

  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }

  if (props.debounce && props.debounce > 0) {
    debounceTimer = setTimeout(() => {
      emit('update:modelValue', val)
      emit('search', val)
    }, props.debounce)
  } else {
    emit('update:modelValue', val)
  }
}

function onEnter() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  const clean = normalizeScannedCode(internalValue.value) || internalValue.value.trim()
  internalValue.value = clean
  emit('update:modelValue', clean)
  emit('search', clean)
}

function onCodeScanned(rawCode: string) {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  const clean = normalizeScannedCode(rawCode) || rawCode.trim()
  if (!clean) return
  internalValue.value = clean
  emit('update:modelValue', clean)
  emit('search', clean)
  emit('scan', clean)
}

function onEscape() {
  if (internalValue.value) {
    clearSearch()
  }
}

function clearSearch() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  internalValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
  emit('clear')
  inputEl.value?.focus()
}

if (props.enableHardwareScanner) {
  useHardwareScanner({
    onScan(code) {
      if (props.disabled) return
      onCodeScanned(code)
    },
  })
}

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: var(--search-max-w, 100%);
  min-width: 0;
}

@media (max-width: 639px) {
  .search-bar {
    max-width: 100% !important;
  }
}

.search-bar.is-disabled {
  opacity: 0.55;
  pointer-events: none;
}

.search-bar__icon {
  position: absolute;
  left: 10px;
  width: 15px;
  height: 15px;
  color: var(--text-tertiary, #64748b);
  pointer-events: none;
}

.search-bar__spinner {
  position: absolute;
  left: 10px;
  width: 14px;
  height: 14px;
  border: 2px solid var(--border-default, #d1d5db);
  border-top-color: var(--text-primary, #0f172a);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  pointer-events: none;
}

.search-bar__input {
  width: 100%;
  height: var(--input-height-md, 36px);
  padding: 6px 60px 6px 32px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--text-primary, #0f172a);
  background: var(--surface-inset, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  outline: none;
  transition: border-color 0.12s, background 0.12s;
}

.search-bar--sm .search-bar__input {
  height: var(--input-height-sm, 30px);
  font-size: 12px;
  padding: 4px 54px 4px 30px;
}

.search-bar--lg .search-bar__input {
  height: var(--input-height-lg, 40px);
  font-size: 14px;
  padding: 8px 64px 8px 34px;
}

.search-bar__input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.search-bar__input::placeholder {
  color: var(--text-muted, #94a3b8);
}

.search-bar__input:hover:not(:disabled) {
  border-color: var(--border-default, #d1d5db);
}

.search-bar__input:focus {
  border-color: var(--border-strong, #9ca3af);
  background: var(--surface-card, #ffffff);
}

.search-bar__actions {
  position: absolute;
  right: 5px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.search-bar__action-btn,
.search-bar__scan-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm, 4px);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  transition: color 0.12s, background 0.12s, border-color 0.12s;
}

.search-bar__scan-btn {
  background: var(--surface-card, #ffffff);
  border-color: var(--border-subtle, #e5e7eb);
  color: var(--text-secondary, #475569);
}

.search-bar__action-btn:hover,
.search-bar__scan-btn:hover {
  color: var(--text-primary, #0f172a);
  background: var(--surface-hover, #f1f5f9);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
