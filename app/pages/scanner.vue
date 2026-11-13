<template>
  <div class="min-h-screen bg-surface-bg text-ink flex flex-col p-4 gap-4 max-w-md mx-auto">
    <div class="flex items-center justify-between border-b border-border-subtle pb-3">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-md bg-surface-inset border border-border-subtle flex items-center justify-center">
          <UIcon name="i-heroicons-qr-code" class="w-5 h-5 text-ink" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-ink m-0">Mobile Companion Scanner</h1>
          <p class="text-xs text-ink-tertiary m-0 font-mono">Session: {{ sessionId || 'Unpaired' }}</p>
        </div>
      </div>
      <AppBadge :color="connected ? 'green' : 'default'" size="sm">
        {{ connected ? 'Paired' : 'Connecting' }}
      </AppBadge>
    </div>

    <div class="relative w-full h-64 bg-black rounded-lg overflow-hidden border border-border-subtle flex items-center justify-center">
      <video v-show="!cameraError" ref="videoRef" autoplay playsinline muted class="w-full h-full object-cover" />
      <div v-if="!cameraError" class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-56 h-32 border-2 border-dashed border-white/70 rounded-lg" />
      </div>
      <div v-else class="p-4 text-center text-xs text-white/80 flex flex-col items-center gap-2">
        <UIcon name="i-heroicons-video-camera-slash" class="w-8 h-8" />
        <span>{{ cameraError }}</span>
      </div>
    </div>

    <form class="flex gap-2" @submit.prevent="sendManual">
      <AppInput
        id="mobile-manual-code"
        v-model="manualCode"
        class="flex-1"
        placeholder="Or type barcode / QR / SKU..."
        mono
      />
      <AppButton type="submit" variant="primary" label="Send" :disabled="!manualCode.trim()" />
    </form>

    <div v-if="lastSent" class="p-3 rounded-lg bg-surface-card border border-border-subtle text-xs flex items-center justify-between">
      <span class="text-ink-secondary">Last transmitted:</span>
      <code class="mono font-semibold text-ink">{{ lastSent }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { normalizeScannedCode } from '~/utils/scanCode'

definePageMeta({ layout: false })
useHead({ title: 'Mobile Barcode Scanner' })

const route = useRoute()
const { baseURL: apiBase } = useApi()

const sessionId = computed(() => String(route.query.session || ''))
const connected = ref(false)
const cameraError = ref<string | null>(null)
const manualCode = ref('')
const lastSent = ref('')
const videoRef = ref<HTMLVideoElement | null>(null)

let stream: MediaStream | null = null
let timer: ReturnType<typeof setInterval> | null = null
let ws: WebSocket | null = null
let lastBarcode = ''
let lastTime = 0

async function transmitBarcode(raw: string) {
  const clean = normalizeScannedCode(raw) || raw.trim()
  if (!clean || !sessionId.value) return
  const now = Date.now()
  if (clean === lastBarcode && now - lastTime < 1200) return
  lastBarcode = clean
  lastTime = now
  lastSent.value = clean

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'scan', barcode: clean, device: 'Mobile Companion' }))
  }
  try {
    await fetch(`${apiBase}/api/v1/scanner/${sessionId.value}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barcode: clean, format: 'AUTO', device_info: 'Mobile Companion' }),
    })
    connected.value = true
  } catch {
    //
  }
}

function sendManual() {
  if (!manualCode.value.trim()) return
  transmitBarcode(manualCode.value)
  manualCode.value = ''
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    if (videoRef.value) videoRef.value.srcObject = stream
    const Detector = (window as any).BarcodeDetector
    if (Detector) {
      const detector = new Detector()
      timer = setInterval(async () => {
        if (!videoRef.value || videoRef.value.readyState < 2) return
        try {
          const codes = await detector.detect(videoRef.value)
          if (codes?.[0]?.rawValue) transmitBarcode(codes[0].rawValue)
        } catch { /* skip */ }
      }, 250)
    }
  } catch (e: any) {
    cameraError.value = e?.message || 'Camera unavailable — use manual entry below.'
  }
}

onMounted(() => {
  if (sessionId.value && typeof window !== 'undefined') {
    const base = apiBase || window.location.origin
    const wsProto = base.startsWith('https') ? 'wss' : 'ws'
    const wsHost = base.replace(/^https?:\/\//, '')
    try {
      ws = new WebSocket(`${wsProto}://${wsHost}/api/v1/scanner/ws/${sessionId.value}?client_type=phone`)
      ws.onopen = () => { connected.value = true }
    } catch { /* fallback to HTTP POST */ }
  }
  startCamera()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (stream) stream.getTracks().forEach(t => t.stop())
  if (ws) try { ws.close() } catch { /* ignore */ }
})
</script>

