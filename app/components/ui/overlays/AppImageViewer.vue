<!-- AppImageViewer — CDC-style full-screen image lightbox with zoom & download -->
<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue && src"
        class="fixed inset-0 z-[90] bg-slate-950/90 backdrop-blur-md flex flex-col select-none"
        role="dialog"
        aria-modal="true"
        :aria-label="title || 'Image viewer'"
        @click.self="close"
      >
        <!-- Top Translucent Header Bar -->
        <header class="h-14 px-4 sm:px-6 flex items-center justify-between gap-3 bg-black/45 border-b border-white/10 shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <UIcon name="i-heroicons-photo" class="w-5 h-5 text-white/80 shrink-0" />
            <span class="text-sm sm:text-base font-medium text-white truncate">
              {{ title || 'Image Preview' }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/85 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
              aria-label="Download image"
              title="Download"
              @click="downloadImage"
            >
              <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center w-9 h-9 rounded-full text-white/85 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
              aria-label="Close viewer"
              title="Close (Esc)"
              @click="close"
            >
              <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
            </button>
          </div>
        </header>

        <!-- Image Canvas -->
        <div
          class="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-8"
          @click.self="close"
        >
          <div v-if="imgLoading" class="flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-white/80 animate-spin" />
          </div>
          <img
            v-show="!imgLoading"
            :src="src"
            :alt="title || 'Preview'"
            class="max-w-[92vw] max-h-[78dvh] object-contain rounded-lg shadow-2xl transition-transform duration-150 ease-out"
            :style="{ transform: `scale(${zoom})` }"
            @load="imgLoading = false"
            @error="imgLoading = false"
          />
        </div>

        <!-- Floating Bottom Zoom Control Pill (CDC pattern) -->
        <div class="pointer-events-none fixed bottom-5 inset-x-0 flex justify-center z-20">
          <div class="pointer-events-auto inline-flex items-center gap-1 px-2 py-1.5 rounded-full bg-slate-900/85 border border-white/15 shadow-xl backdrop-blur-md">
            <button
              type="button"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              :disabled="zoom <= minZoom"
              aria-label="Zoom out"
              title="Zoom out (-)"
              @click="zoomOut"
            >
              <UIcon name="i-heroicons-minus" class="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              class="px-2.5 h-8 rounded-full text-xs font-mono font-medium text-white/90 hover:bg-white/15 cursor-pointer transition-colors min-w-[54px]"
              title="Reset zoom (0)"
              @click="resetZoom"
            >
              {{ Math.round(zoom * 100) }}%
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center w-8 h-8 rounded-full text-white hover:bg-white/15 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
              :disabled="zoom >= maxZoom"
              aria-label="Zoom in"
              title="Zoom in (+)"
              @click="zoomIn"
            >
              <UIcon name="i-heroicons-plus" class="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  src: string
  title?: string
}>(), {
  title: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'close': []
}>()

const minZoom = 0.5
const maxZoom = 3
const zoom = ref(1)
const imgLoading = ref(false)

watch(
  () => [props.modelValue, props.src] as const,
  ([open]) => {
    if (open) {
      zoom.value = 1
      imgLoading.value = true
    }
  },
)

function zoomIn() {
  zoom.value = Math.min(maxZoom, Number((zoom.value + 0.25).toFixed(2)))
}

function zoomOut() {
  zoom.value = Math.max(minZoom, Number((zoom.value - 0.25).toFixed(2)))
}

function resetZoom() {
  zoom.value = 1
}

function close() {
  emit('update:modelValue', false)
  emit('close')
}

function downloadImage() {
  if (!props.src) return
  const link = document.createElement('a')
  link.href = props.src
  link.download = props.title || 'image'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.modelValue) return
  if (e.key === 'Escape') close()
  else if (e.key === '+' || e.key === '=') zoomIn()
  else if (e.key === '-') zoomOut()
  else if (e.key === '0') resetZoom()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
