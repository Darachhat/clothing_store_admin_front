<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4 w-full max-w-[540px]">
      <!-- Modal Header -->
      <div class="flex items-center justify-between pb-3 border-b border-border-subtle">
        <div class="flex items-center gap-3">
          <div class="w-[38px] h-[38px] rounded-md bg-surface-active border border-border-subtle text-text-primary flex items-center justify-center">
            <UIcon name="i-heroicons-qr-code" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-[15px] font-semibold text-text-primary m-0">Scan Barcode / QR Code</h3>
            <p class="text-xs text-text-tertiary m-0">Scan 1D Barcode, 2D QR Tag, or SKU via Camera, Image, Phone, or USB Scanner</p>
          </div>
        </div>

        <button type="button" class="p-1 bg-transparent border-none text-text-tertiary hover:text-text-primary cursor-pointer transition-colors" @click="closeModal">
          <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
        </button>
      </div>

      <!-- Mode Selector Tabs -->
      <div class="flex border-b border-border-subtle gap-1 overflow-x-auto">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 bg-transparent border-none border-b-2 font-medium text-[12.5px] cursor-pointer -mb-px whitespace-nowrap transition-colors"
          :class="activeTab === 'webcam' ? 'text-text-primary border-b-text-primary' : 'text-text-secondary border-b-transparent hover:text-text-primary'"
          @click="activeTab = 'webcam'"
        >
          <UIcon name="i-heroicons-camera" class="w-4 h-4" />
          Live Camera
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 bg-transparent border-none border-b-2 font-medium text-[12.5px] cursor-pointer -mb-px whitespace-nowrap transition-colors"
          :class="activeTab === 'image' ? 'text-text-primary border-b-text-primary' : 'text-text-secondary border-b-transparent hover:text-text-primary'"
          @click="activeTab = 'image'"
        >
          <UIcon name="i-heroicons-photo" class="w-4 h-4" />
          Upload Image
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-2 bg-transparent border-none border-b-2 font-medium text-[12.5px] cursor-pointer -mb-px whitespace-nowrap transition-colors"
          :class="activeTab === 'phone' ? 'text-text-primary border-b-text-primary' : 'text-text-secondary border-b-transparent hover:text-text-primary'"
          @click="activeTab = 'phone'"
        >
          <UIcon name="i-heroicons-device-phone-mobile" class="w-4 h-4" />
          Connect Phone
          <span v-if="phoneConnected" class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>
      </div>

      <!-- Tab 1: Live Camera -->
      <div v-if="activeTab === 'webcam'" class="flex flex-col gap-3.5">
        <div v-if="!hasLocalCamera || cameraError" class="flex flex-col items-center justify-center text-center p-7 bg-surface-card border border-dashed border-border-subtle rounded-lg gap-2 text-text-secondary">
          <UIcon name="i-heroicons-video-camera-slash" class="w-9 h-9 text-slate-400" />
          <div class="font-semibold text-sm text-text-primary">{{ cameraError || 'No Camera Detected on This Device' }}</div>
          <p class="text-xs text-text-tertiary max-w-[340px]">
            Use a USB barcode scanner below, upload a barcode photo in the "Upload Image" tab, or connect your smartphone camera.
          </p>
          <div class="flex items-center gap-2 mt-1">
            <AppButton variant="secondary" size="sm" label="Upload Barcode Photo" @click="activeTab = 'image'" />
            <AppButton variant="primary" size="sm" label="Connect Phone" @click="activeTab = 'phone'" />
          </div>
        </div>

        <div v-else class="relative w-full h-[220px] bg-black rounded-lg overflow-hidden border border-border-subtle">
          <video ref="webcamVideoRef" autoplay playsinline muted class="w-full h-full object-cover" />
          <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div class="w-[min(220px,75%)] h-[120px] border-2 border-dashed border-white/70 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- Tab 2: Upload Barcode / QR Image -->
      <div v-else-if="activeTab === 'image'" class="flex flex-col gap-3.5">
        <div
          class="flex flex-col items-center justify-center text-center py-7 px-4 bg-surface-card border border-dashed border-border-subtle rounded-lg cursor-pointer hover:bg-surface-hover transition-colors"
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
        <div v-if="imageDecodeMessage" class="flex items-start gap-2.5 p-2.5 sm:px-3 rounded-md text-xs leading-snug bg-surface-hover border border-border-subtle text-text-primary">
          <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0" />
          <span>{{ imageDecodeMessage }}</span>
        </div>
      </div>

      <!-- Tab 3: Phone Wireless Pairing -->
      <div v-else-if="activeTab === 'phone'" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-start">
          <div class="flex flex-col items-center gap-2">
            <div class="w-[170px] h-[170px] bg-white border border-border-subtle rounded-lg p-1.5 flex items-center justify-center">
              <img
                v-if="qrCodeUrl"
                :src="qrCodeUrl"
                alt="Scanner pairing QR Code"
                class="w-full h-full object-contain"
              />
              <div v-else class="text-xs text-text-tertiary">Generating QR...</div>
            </div>

            <div class="flex items-center gap-1.5 text-[11px] text-text-tertiary" :class="{ '!text-emerald-500': phoneConnected }">
              <span class="w-2 h-2 rounded-full bg-current" />
              <span>{{ phoneConnected ? 'Phone Connected & Active' : 'Waiting for phone...' }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex gap-2.5 items-start text-xs">
              <span class="w-5 h-5 rounded-full bg-surface-active text-text-primary font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
              <div>
                <strong class="text-text-primary block">Scan QR Code with your phone</strong>
                <p class="text-text-tertiary mt-0.5 mb-0">Open camera app on your phone and tap the link</p>
              </div>
            </div>

            <div class="flex gap-2.5 items-start text-xs">
              <span class="w-5 h-5 rounded-full bg-surface-active text-text-primary font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
              <div>
                <strong class="text-text-primary block">Point phone camera at tag</strong>
                <p class="text-text-tertiary mt-0.5 mb-0">Scanned codes are transmitted directly to this screen</p>
              </div>
            </div>

            <div class="bg-surface-card border border-border-subtle rounded-md p-2 sm:px-2.5 flex flex-col gap-1">
              <label class="text-[11px] text-text-tertiary">Companion Link:</label>
              <div class="flex gap-1.5">
                <input
                  v-model="customHost"
                  type="text"
                  placeholder="e.g. admin.kimvannak.store"
                  class="flex-1 text-xs border border-border-subtle rounded px-2 py-1 bg-surface-hover text-text-primary focus:outline-hidden font-mono"
                  @change="updateHost"
                />
                <AppButton size="xs" variant="secondary" :label="copied ? 'Copied!' : 'Copy'" @click="copyPairingUrl" />
              </div>
              <span class="text-text-tertiary font-mono text-xs">PIN: {{ sessionShortCode }}</span>
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
          class="flex-1 text-xs rounded-md border border-border-subtle bg-surface-card px-2.5 py-1.5 text-text-primary focus:outline-hidden font-mono"
        />
        <AppButton type="submit" size="sm" variant="default" label="Apply" :disabled="!manualCode.trim()" />
      </form>

      <!-- Recent Scans / Live Log -->
      <div class="bg-surface-card border border-border-subtle rounded-md p-2.5 sm:px-3 flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Recent Scans ({{ recentScans.length }})</span>
          <button v-if="recentScans.length" type="button" class="text-[11px] text-text-tertiary bg-transparent border-none cursor-pointer hover:text-text-primary" @click="recentScans = []">
            Clear
          </button>
        </div>

        <div v-if="recentScans.length === 0" class="text-xs text-text-tertiary italic py-1">
          No items scanned yet. Point camera at a sticker or scan with a USB barcode gun.
        </div>

        <div v-else class="flex flex-col gap-1">
          <div
            v-for="(scan, idx) in recentScans"
            :key="idx"
            class="flex items-center justify-between px-2 py-1.5 bg-surface-hover rounded border border-border-subtle"
          >
            <div class="text-[12.5px] font-semibold text-text-primary font-mono">{{ scan.barcode }}</div>
            <div class="flex items-center gap-2 text-[11px] text-text-tertiary">
              <span class="bg-surface-active px-1.5 py-0.5 rounded text-[10px] border border-border-subtle">{{ scan.source || 'Scanner' }}</span>
              <span class="scan-item__time">{{ formatTime(scan.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end border-t border-border-subtle pt-3">
        <AppButton variant="secondary" size="sm" label="Done" @click="closeModal" />
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
