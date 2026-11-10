<template>
  <div
    class="relative flex items-center w-full min-w-0"
    :class="[disabled && 'opacity-55 pointer-events-none']"
    :style="maxWidth ? { maxWidth } : undefined"
  >
    <span
      v-if="loading"
      class="absolute left-2.5 w-3.5 h-3.5 border-2 border-border-default border-t-ink rounded-full animate-spin pointer-events-none"
      aria-hidden="true"
    />
    <UIcon
      v-else
      name="i-heroicons-magnifying-glass"
      class="absolute left-2.5 w-4 h-4 text-ink-tertiary pointer-events-none"
    />

    <input
      ref="inputEl"
      type="search"
      :value="internalValue"
      :placeholder="placeholder || 'Search or scan barcode / QR...'"
      :disabled="disabled"
      :aria-label="ariaLabel || placeholder || 'Search'"
      data-barcode-scanner-target="true"
      class="w-full rounded-md border border-border-subtle bg-surface-inset text-ink placeholder:text-ink-tertiary focus:border-border-default focus:bg-surface-card focus:outline-none transition-colors [&::-webkit-search-cancel-button]:appearance-none"
      :class="[
        size === 'sm' ? 'h-7.5 text-xs pl-7.5 pr-14' :
        size === 'lg' ? 'h-10 text-sm pl-9 pr-16' :
        'h-9 text-xs sm:text-sm pl-8 pr-16'
      ]"
      @input="onInput"
      @keydown.enter="onEnter"
      @keydown.esc="onEscape"
    />

    <div class="absolute right-1.5 flex items-center gap-1">
      <button
        v-if="clearable && internalValue && !disabled"
        type="button"
        class="inline-flex items-center justify-center w-6 h-6 rounded text-ink-tertiary hover:text-ink hover:bg-surface-hover transition-colors"
        aria-label="Clear search"
        title="Clear search"
        @click="clearSearch"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
      </button>

      <button
        v-if="scannable && !disabled"
        type="button"
        class="inline-flex items-center justify-center w-6 h-6 rounded border border-border-subtle bg-surface-card text-ink-secondary hover:text-ink hover:bg-surface-hover transition-colors shadow-2xs"
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
