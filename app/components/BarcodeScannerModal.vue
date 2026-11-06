<template>
  <AppModal
    v-model="isOpen"
    title="Camera Barcode Scanner"
    size="md"
  >
    <div class="scanner-body">
      <!-- Camera Viewport -->
      <div class="scanner-viewport">
        <video
          ref="videoRef"
          class="scanner-video"
          autoplay
          playsinline
          muted
        />

        <!-- Target Reticle Overlay -->
        <div class="scanner-overlay">
          <div class="scanner-reticle">
            <div class="scanner-laser" />
          </div>
          <p class="scanner-hint">
            Align barcode or QR code inside the frame
          </p>
        </div>

        <!-- Status / Error Overlay -->
        <div
          v-if="errorMessage"
          class="scanner-error"
        >
          <UIcon name="i-heroicons-video-camera-slash" class="w-8 h-8 text-gray-300" />
          <p class="scanner-error__text">{{ errorMessage }}</p>
          <AppButton size="sm" variant="default" label="Retry Camera" @click="startScanner" />
        </div>
      </div>

      <!-- Camera Selection & Manual Entry Fallback -->
      <div class="scanner-controls">
        <div v-if="cameras.length > 1" class="form-field">
          <label class="field-label">Camera Device</label>
          <select
            v-model="selectedCameraId"
            class="field-input"
            @change="restartScanner"
          >
            <option v-for="cam in cameras" :key="cam.deviceId" :value="cam.deviceId">
              {{ cam.label || `Camera ${cam.deviceId.slice(0, 6)}` }}
            </option>
          </select>
        </div>

        <form class="scanner-manual" @submit.prevent="submitManualCode">
          <input
            v-model="manualCode"
            type="text"
            placeholder="Or type barcode / SKU manually..."
            class="field-input"
          />
          <AppButton type="submit" variant="primary" label="Lookup" />
        </form>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'scanned': [code: string]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const videoRef = ref<HTMLVideoElement | null>(null)
const errorMessage = ref('')
const manualCode = ref('')
const cameras = ref<MediaDeviceInfo[]>([])
const selectedCameraId = ref<string>('')

let activeStream: MediaStream | null = null
let scanTimer: ReturnType<typeof setInterval> | null = null

async function startScanner() {
  errorMessage.value = ''
  if (!import.meta.client) return

  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      errorMessage.value = 'Camera access is not supported in this browser. Please enter the SKU manually below.'
      return
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    const videoInputDevices = devices.filter((d) => d.kind === 'videoinput')
    cameras.value = videoInputDevices

    if (videoInputDevices.length === 0) {
      errorMessage.value = 'No camera device detected. Please use a USB scanner or enter the SKU manually below.'
      return
    }

    if (!selectedCameraId.value) {
      const backCam = videoInputDevices.find((d: any) => /back|rear|environment/i.test(d.label))
      selectedCameraId.value = backCam ? backCam.deviceId : videoInputDevices[0]!.deviceId
    }

    await nextTick()
    if (!videoRef.value) return

    activeStream = await navigator.mediaDevices.getUserMedia({
      video: selectedCameraId.value ? { deviceId: { exact: selectedCameraId.value } } : { facingMode: 'environment' },
    })
    videoRef.value.srcObject = activeStream
    await videoRef.value.play()

    const BarcodeDetectorCtor = (window as any).BarcodeDetector
    if (BarcodeDetectorCtor) {
      const detector = new BarcodeDetectorCtor()
      scanTimer = setInterval(async () => {
        if (!videoRef.value) return
        try {
          const barcodes = await detector.detect(videoRef.value)
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            onCodeDetected(barcodes[0].rawValue)
          }
        } catch {
          // ignore frame detection error
        }
      }, 250)
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'Camera permission denied or unavailable.'
  }
}

function stopScanner() {
  try {
    if (scanTimer) {
      clearInterval(scanTimer)
      scanTimer = null
    }
    if (activeStream) {
      activeStream.getTracks().forEach((t) => t.stop())
      activeStream = null
    }
  } catch {
    // Ignore stop errors
  }
}

async function restartScanner() {
  stopScanner()
  await startScanner()
}

function onCodeDetected(code: string) {
  stopScanner()
  isOpen.value = false
  emit('scanned', code.trim())
}

function submitManualCode() {
  if (!manualCode.value.trim()) return
  const code = manualCode.value.trim()
  manualCode.value = ''
  onCodeDetected(code)
}

watch(isOpen, async (open) => {
  if (open) {
    await nextTick()
    await startScanner()
  } else {
    stopScanner()
  }
})

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<style scoped>
.scanner-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.scanner-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #0f172a;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scanner-reticle {
  width: 240px;
  height: 128px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
  position: relative;
}

.scanner-laser {
  position: absolute;
  inset-inline: 8px;
  top: 50%;
  height: 1px;
  background: rgba(255, 255, 255, 0.85);
}

.scanner-hint {
  margin-top: 12px;
  font-size: 11px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.7);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.scanner-error {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
}

.scanner-error__text {
  font-size: 12.5px;
  color: #e2e8f0;
  margin: 0;
}

.scanner-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scanner-manual {
  display: flex;
  gap: 8px;
}
</style>
