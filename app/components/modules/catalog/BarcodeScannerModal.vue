<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="scanner-modal">
      <!-- Modal Header -->
      <div class="scanner-modal__header">
        <div class="scanner-modal__title-group">
          <div class="scanner-modal__icon">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="scanner-modal__title">Scan Barcode / QR Code</h3>
            <p class="scanner-modal__subtitle">Scan 1D Barcode, 2D QR Tag, or SKU via Camera, Image, Phone, or USB Scanner</p>
          </div>
        </div>

        <button type="button" class="scanner-modal__close-btn" @click="closeModal">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="scanner-tabs">
        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'webcam' }"
          @click="activeTab = 'webcam'"
        >
          <UIcon name="i-heroicons-camera" class="w-4 h-4" />
          Live Camera
        </button>

        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'image' }"
          @click="activeTab = 'image'"
        >
          <UIcon name="i-heroicons-photo" class="w-4 h-4" />
          Upload Image
        </button>

        <button
          type="button"
          class="scanner-tab"
          :class="{ 'is-active': activeTab === 'phone' }"
          @click="activeTab = 'phone'"
        >
          <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
          Connect Phone
          <span v-if="phoneConnected" class="scanner-tab__online-dot" />
        </button>
      </div>

      <!-- Tab 1: Live Camera -->
      <div v-if="activeTab === 'webcam'" class="scanner-body">
        <div v-if="!hasLocalCamera || cameraError" class="scanner-empty-cam">
          <UIcon name="i-heroicons-video-camera-slash" class="w-9 h-9 text-slate-400" />
          <div class="empty-title">{{ cameraError || 'No Camera Detected on This Device' }}</div>
          <p class="empty-desc">
            Use a USB barcode scanner below, upload a barcode photo in the "Upload Image" tab, or connect your smartphone camera.
          </p>
          <div class="flex items-center gap-2 mt-1">
            <button type="button" class="btn btn--secondary btn--sm" @click="activeTab = 'image'">
              Upload Barcode Photo
            </button>
            <button type="button" class="btn btn--primary btn--sm" @click="activeTab = 'phone'">
              Connect Phone
            </button>
          </div>
        </div>

        <div v-else class="scanner-webcam-feed">
          <video ref="webcamVideoRef" autoplay playsinline muted class="webcam-video" />
          <div class="webcam-overlay">
            <div class="webcam-reticle" />
          </div>
        </div>
      </div>

      <!-- Tab 2: Upload Barcode / QR Image -->
      <div v-else-if="activeTab === 'image'" class="scanner-body">
        <div
          class="scanner-dropzone"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="handleFileSelect"
          />
          <UIcon name="i-heroicons-arrow-up-tray" class="w-7 h-7 text-slate-400 mb-1" />
          <strong class="text-xs font-semibold text-slate-800">Click or drop a photo of a barcode / QR sticker</strong>
          <p class="text-xs text-slate-500 mt-0.5">
            Supports PNG, JPG, WEBP photos of 1D Code-128, EAN-13, or 2D QR tags.
          </p>
        </div>
        <div v-if="imageDecodeMessage" class="scanner-notice scanner-notice--info">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0" />
          <span>{{ imageDecodeMessage }}</span>
        </div>
      </div>

      <!-- Tab 3: Phone Wireless Pairing -->
      <div v-else-if="activeTab === 'phone'" class="scanner-body">
        <div class="scanner-pairing-grid">
          <div class="scanner-qr-card">
            <div class="scanner-qr-frame">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                alt="Scanner pairing QR Code"
                class="scanner-qr-img"
              />
              <div v-else class="scanner-qr-loading">Generating QR...</div>
            </div>

            <div class="scanner-status-indicator" :class="{ 'is-connected': phoneConnected }">
              <span class="status-pulse-dot" />
              <span>{{ phoneConnected ? 'Phone Connected & Active' : 'Waiting for phone...' }}</span>
            </div>
          </div>

          <div class="scanner-instructions">
            <div class="instruction-step">
              <span class="step-num">1</span>
              <div>
                <strong>Scan QR Code with your phone</strong>
                <p>Open camera app on your phone and tap the link</p>
              </div>
            </div>

            <div class="instruction-step">
              <span class="step-num">2</span>
              <div>
                <strong>Point phone camera at tag</strong>
                <p>Scanned codes are transmitted directly to this screen</p>
              </div>
            </div>

            <div class="scanner-link-config">
              <label class="config-label">Companion Link:</label>
              <div class="config-input-group">
                <input
                  v-model="customHost"
                  type="text"
                  placeholder="e.g. admin.kimvannak.store"
                  class="config-input font-mono"
                  @change="updateHost"
                />
                <button type="button" class="btn btn--secondary btn--sm" @click="copyPairingUrl">
                  {{ copied ? 'Copied!' : 'Copy' }}
                </button>
              </div>
              <span class="config-hint font-mono text-xs">PIN: {{ sessionShortCode }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Manual / USB Hardware Barcode Entry -->
      <form class="flex gap-2" @submit.prevent="submitManualCode">
        <input
          ref="manualInputRef"
          v-model="manualCode"
          type="text"
          data-barcode-scanner-target="true"
          placeholder="Or scan with USB scanner / type barcode, QR, or SKU and press Enter..."
          class="field-input flex-1 mono"
        />
        <AppButton type="submit" size="sm" variant="default" label="Apply" :disabled="!manualCode.trim()" />
      </form>

      <!-- Recent Scans / Live Log -->
      <div class="scanner-scans-panel">
        <div class="scans-header">
          <span class="scans-title">Recent Scans ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="clear-scans-btn" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="scans-empty">
          No items scanned yet. Point camera at a sticker or scan with a USB barcode gun.
        </div>

        <div v-else class="scans-list">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="scan-item"
          >
            <div class="scan-item__code font-mono">{{ scan.barcode }}</div>
            <div class="scan-item__meta">
              <span class="scan-item__source">{{ scan.source || 'Scanner' }}</span>
              <span class="scan-item__time">{{ formatTime(scan.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="scanner-modal__footer">
        <button type="button" class="btn btn--secondary" @click="closeModal">
          Done
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { normalizeScannedCode } from '~/utils/scanCode'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    autoCloseOnScan?: boolean
  }>(),
  {
    modelValue: false,
    autoCloseOnScan: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'scanned', barcode: string): void
}>()

const { baseURL: apiBase } = useApi()

const isPC = ref(true)
const hasLocalCamera = ref(false)
const cameraError = ref<string | null>(null)
const activeTab = ref<'webcam' | 'image' | 'phone'>('webcam')
const phoneConnected = ref(false)
const copied = ref(false)
const manualCode = ref('')
const manualInputRef = ref<HTMLInputElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const imageDecodeMessage = ref<string | null>(null)

const sessionId = ref('')
const sessionShortCode = ref('')
const customHost = ref('')
const qrCodeUrl = ref('')
const recentScans = ref<any[]>([])

const webcamVideoRef = ref<HTMLVideoElement | null>(null)
let webcamStream: MediaStream | null = null
let detectorTimer: ReturnType<typeof setInterval> | null = null
let pollInterval: ReturnType<typeof setInterval> | null = null
let lastHandledBarcode = ''
let lastHandledTime = 0

function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // AudioContext blocked
  }
}

function initSession() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  sessionId.value = `sess_${rand}`
  sessionShortCode.value = rand

  if (typeof window !== 'undefined') {
    customHost.value = window.location.host
  }
  updateQrUrl()
}

const pairingUrl = computed(() => {
  const host = customHost.value.trim() || (typeof window !== 'undefined' ? window.location.host : 'localhost:3000')
  const proto = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:'
  return `${proto}//${host}/scanner?session=${sessionId.value}`
})

function updateQrUrl() {
  qrCodeUrl.value = `${apiBase}/api/v1/scanner/qr?text=${encodeURIComponent(pairingUrl.value)}`
}

function updateHost() {
  updateQrUrl()
}

async function copyPairingUrl() {
  try {
    await navigator.clipboard.writeText(pairingUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    //
  }
}

function submitManualCode() {
  const raw = manualCode.value.trim()
  if (!raw) return
  manualCode.value = ''
  onBarcodeReceived(raw, 'Manual / USB')
}

function onBarcodeReceived(rawBarcode: string, source = 'Scanner') {
  const barcode = normalizeScannedCode(rawBarcode) || rawBarcode?.trim()
  if (!barcode) return
  const now = Date.now()
  if (barcode === lastHandledBarcode && now - lastHandledTime < 1200) {
    return
  }
  lastHandledBarcode = barcode
  lastHandledTime = now

  playChime()
  recentScans.value.unshift({
    barcode,
    source,
    timestamp: now,
  })

  emit('scanned', barcode)
  if (props.autoCloseOnScan) {
    closeModal()
  }
}

async function pollSession() {
  if (!sessionId.value || !props.modelValue || activeTab.value !== 'phone') return
  try {
    const res = await fetch(`${apiBase}/api/v1/scanner/${sessionId.value}/status`)
    if (res.ok) {
      const data = await res.json()
      if (data.phone_connected) {
        phoneConnected.value = true
      }
      if (data.last_barcode && data.last_barcode !== lastHandledBarcode) {
        onBarcodeReceived(data.last_barcode, 'Phone Camera')
      }
    }
  } catch {
    //
  }
}

async function checkDeviceAndCameras() {
  if (typeof navigator === 'undefined') return
  isPC.value = !/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoInputs = devices.filter(d => d.kind === 'videoinput')
      hasLocalCamera.value = videoInputs.length > 0
    } else {
      hasLocalCamera.value = false
    }
  } catch {
    hasLocalCamera.value = false
  }
}

async function startWebcam() {
  stopWebcam()
  cameraError.value = null
  if (!hasLocalCamera.value) return
  try {
    webcamStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    if (webcamVideoRef.value) {
      webcamVideoRef.value.srcObject = webcamStream
    }
    startFrameDecodingLoop()
  } catch (err: any) {
    cameraError.value = err?.message || 'Camera permission denied'
  }
}

function startFrameDecodingLoop() {
  if (typeof window === 'undefined') return
  const BarcodeDetectorCtor = (window as any).BarcodeDetector
  if (!BarcodeDetectorCtor) return

  let detector: any = null
  try {
    detector = new BarcodeDetectorCtor({
      formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_39'],
    })
  } catch {
    try {
      detector = new BarcodeDetectorCtor()
    } catch {
      return
    }
  }

  detectorTimer = setInterval(async () => {
    const video = webcamVideoRef.value
    if (!video || video.readyState < 2 || !detector) return
    try {
      const barcodes = await detector.detect(video)
      if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
        onBarcodeReceived(barcodes[0].rawValue, 'Live Camera')
      }
    } catch {
      // frame skip
    }
  }, 220)
}

function stopWebcam() {
  if (detectorTimer) {
    clearInterval(detectorTimer)
    detectorTimer = null
  }
  if (webcamStream) {
    webcamStream.getTracks().forEach(t => t.stop())
    webcamStream = null
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target?.files?.[0]
  if (file) decodeImageFile(file)
  if (target) target.value = ''
}

function handleFileDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    decodeImageFile(file)
  }
}

async function decodeImageFile(file: File) {
  imageDecodeMessage.value = 'Decoding barcode/QR from image...'
  try {
    const BarcodeDetectorCtor = typeof window !== 'undefined' ? (window as any).BarcodeDetector : null
    if (BarcodeDetectorCtor) {
      const detector = new BarcodeDetectorCtor()
      const bitmap = await createImageBitmap(file)
      const results = await detector.detect(bitmap)
      if (results && results.length > 0 && results[0]?.rawValue) {
        const clean = normalizeScannedCode(results[0].rawValue) || results[0].rawValue
        imageDecodeMessage.value = `Decoded: ${clean}`
        onBarcodeReceived(clean, 'Image Upload')
        return
      }
    }
    imageDecodeMessage.value = 'Could not detect a clear barcode or QR code in this image. Try typing or scanning directly.'
  } catch {
    imageDecodeMessage.value = 'Unable to decode image. Please use a clearer image or scan directly.'
  }
}

function closeModal() {
  emit('update:modelValue', false)
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

watch(() => props.modelValue, async (isOpen) => {
  if (isOpen) {
    initSession()
    await checkDeviceAndCameras()
    pollInterval = setInterval(pollSession, 2000)
    if (activeTab.value === 'webcam' && hasLocalCamera.value) {
      await startWebcam()
    }
    nextTick(() => {
      manualInputRef.value?.focus()
    })
  } else {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
    stopWebcam()
  }
})

watch(activeTab, async (tab) => {
  if (!props.modelValue) return
  if (tab === 'webcam') {
    await startWebcam()
  } else {
    stopWebcam()
  }
})

onMounted(() => {
  checkDeviceAndCameras()
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  stopWebcam()
})
</script>

<style scoped>
.scanner-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 540px;
}

.scanner-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  padding-bottom: 12px;
}

.scanner-modal__title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scanner-modal__icon {
  width: 38px;
  height: 38px;
  border-radius: 6px;
  background: var(--surface-active, #f1f5f9);
  border: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-modal__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.scanner-modal__subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

.scanner-modal__close-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
}

.scanner-modal__close-btn:hover {
  color: var(--text-primary);
}

.scanner-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  gap: 4px;
  overflow-x: auto;
}

.scanner-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  margin-bottom: -1px;
  white-space: nowrap;
}

.scanner-tab.is-active {
  color: var(--text-primary);
  border-bottom-color: var(--text-primary);
}

.scanner-tab__online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

.scanner-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scanner-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
}

.scanner-notice--info {
  background: var(--surface-hover, #f8fafc);
  border: 1px solid var(--border-subtle, #e5e7eb);
  color: var(--text-primary);
}

.scanner-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 16px;
  background: var(--surface-card, #ffffff);
  border: 1px dashed var(--border-subtle, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
}

.scanner-dropzone:hover {
  background: var(--surface-hover, #f8fafc);
}

.scanner-pairing-grid {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 16px;
  align-items: start;
}

@media (max-width: 540px) {
  .scanner-pairing-grid {
    grid-template-columns: 1fr;
  }
}

.scanner-qr-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.scanner-qr-frame {
  width: 170px;
  height: 170px;
  background: #fff;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-qr-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.scanner-qr-loading {
  font-size: 12px;
  color: var(--text-tertiary);
}

.scanner-status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.scanner-status-indicator.is-connected {
  color: #10b981;
}

.status-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.scanner-instructions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instruction-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
}

.instruction-step strong {
  color: var(--text-primary);
  display: block;
}

.instruction-step p {
  color: var(--text-tertiary);
  margin: 2px 0 0 0;
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--surface-active, #f1f5f9);
  color: var(--text-primary);
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.scanner-link-config {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.config-input-group {
  display: flex;
  gap: 6px;
}

.config-input {
  flex: 1;
  font-size: 12px;
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 4px;
  padding: 4px 8px;
  background: var(--surface-hover);
  color: var(--text-primary);
}

.config-hint {
  color: var(--text-tertiary);
}

.scanner-empty-cam {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 16px;
  background: var(--surface-card, #ffffff);
  border: 1px dashed var(--border-subtle, #e5e7eb);
  border-radius: 8px;
  gap: 8px;
  color: var(--text-secondary);
}

.empty-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.empty-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  max-width: 340px;
}

.scanner-webcam-feed {
  position: relative;
  width: 100%;
  height: 220px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.webcam-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.webcam-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.webcam-reticle {
  width: min(220px, 75%);
  height: 120px;
  border: 2px dashed rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.scanner-scans-panel {
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 140px;
  overflow-y: auto;
}

.scans-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.scans-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clear-scans-btn {
  font-size: 11px;
  color: var(--text-tertiary);
  background: transparent;
  border: none;
  cursor: pointer;
}

.scans-empty {
  font-size: 12px;
  color: var(--text-tertiary);
  font-style: italic;
  padding: 4px 0;
}

.scans-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: var(--surface-hover, #f8fafc);
  border-radius: 4px;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.scan-item__code {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}

.scan-item__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.scan-item__source {
  background: var(--surface-active, #f1f5f9);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.scanner-modal__footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  padding-top: 12px;
}
</style>
