import { onMounted, onUnmounted, ref } from 'vue'
import { normalizeScannedCode } from '~/utils/scanCode'

export interface HardwareScannerOptions {
  /** Maximum interval in ms between keystrokes to be considered scanner burst input (default: 50ms) */
  maxIntervalMs?: number
  /** Minimum length of scanned barcode (default: 3) */
  minBarcodeLength?: number
  /** Allowed suffixes/terminators that trigger barcode emission (default: ['Enter', 'Tab']) */
  terminators?: string[]
  /** Whether to listen when user is typing in regular text inputs (default: false) */
  allowInInputs?: boolean
  /** Callback invoked on successful barcode scan */
  onScan: (barcode: string) => void
}

/**
 * useHardwareScanner
 *
 * Captures fast burst keyboard inputs from USB & Bluetooth HID barcode scanners.
 * Differentiates between human typing and hardware scanner bursts and normalizes QR URLs.
 */
export function useHardwareScanner(options: HardwareScannerOptions) {
  const {
    maxIntervalMs = 50,
    minBarcodeLength = 3,
    terminators = ['Enter', 'Tab'],
    allowInInputs = false,
    onScan,
  } = options

  const isScanning = ref(false)
  let buffer = ''
  let lastKeyTime = 0

  function isInputElement(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false
    const tagName = target.tagName.toLowerCase()
    if (tagName === 'textarea' || target.isContentEditable) return true
    if (tagName === 'input') {
      const input = target as HTMLInputElement
      const type = input.type.toLowerCase()
      return !['button', 'checkbox', 'radio', 'file', 'submit', 'reset'].includes(type)
    }
    return false
  }

  function handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null
    const inInput = isInputElement(target)

    if (inInput && !allowInInputs) {
      const isScannerInput = target?.getAttribute('data-barcode-scanner-target') === 'true'
      if (!isScannerInput) {
        buffer = ''
        return
      }
    }

    const now = performance.now()
    const timeDiff = now - lastKeyTime
    lastKeyTime = now

    if (terminators.includes(event.key)) {
      if (buffer.length >= minBarcodeLength) {
        event.preventDefault()
        event.stopPropagation()
        const rawCode = buffer.trim()
        buffer = ''
        isScanning.value = false
        const normalized = normalizeScannedCode(rawCode) || rawCode
        if (normalized) {
          onScan(normalized)
        }
        return
      }
      buffer = ''
      isScanning.value = false
      return
    }

    if (event.key.length !== 1) {
      return
    }

    if (buffer.length > 0 && timeDiff > maxIntervalMs) {
      buffer = event.key
      isScanning.value = false
      return
    }

    buffer += event.key
    isScanning.value = true
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown, { capture: true })
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  })

  return {
    isScanning,
  }
}

