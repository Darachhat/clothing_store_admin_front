<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label v-if="label" class="text-sm font-normal text-ink-secondary flex items-center gap-1">
      {{ label }}
      <span v-if="required" class="text-status-red">*</span>
    </label>

    <!-- Preview if file already uploaded / provided -->
    <div v-if="modelValue" class="flex items-center gap-3 p-2.5 sm:px-3 bg-surface-card border border-border-subtle rounded-md">
      <div class="w-11 h-11 rounded overflow-hidden bg-surface-inset border border-border-subtle shrink-0 flex items-center justify-center">
        <img
          v-if="isImage(modelValue)"
          :src="modelValue"
          alt="Attachment preview"
          class="w-full h-full object-cover"
        />
        <div v-else class="text-ink-secondary">
          <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
        </div>
      </div>

      <div class="flex-1 min-w-0 flex flex-col gap-0.5">
        <a :href="modelValue" target="_blank" rel="noopener noreferrer" class="text-xs sm:text-sm font-medium text-ink hover:underline truncate" :title="modelValue">
          {{ getDisplayFilename(modelValue) }}
        </a>
        <span class="text-[11px] font-mono text-ink-tertiary">Uploaded</span>
      </div>

      <button
        type="button"
        class="w-7 h-7 rounded border border-border-subtle bg-transparent text-ink-secondary flex items-center justify-center hover:bg-status-red-bg hover:text-white transition-colors cursor-pointer"
        title="Remove attachment"
        @click="clearFile"
      >
        <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Dropzone when no file selected -->
    <div
      v-else
      class="flex flex-col items-center justify-center p-4 sm:px-5 bg-surface-card border border-dashed rounded-md cursor-pointer transition-colors min-h-[90px] relative"
      :class="[
        isDragging ? 'border-border-default bg-surface-hover' : 'border-border-default hover:border-border-default hover:bg-surface-hover',
        isUploading && 'pointer-events-none'
      ]"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- Uploading spinner / progress -->
      <div v-if="isUploading" class="flex flex-col items-center gap-2 w-full max-w-[240px]">
        <div class="w-5 h-5 border-2 border-border-subtle border-t-ink rounded-full animate-spin" />
        <span class="text-xs text-ink-secondary font-mono">Uploading attachment... {{ uploadProgress }}%</span>
        <div class="w-full h-1 bg-surface-active rounded-full overflow-hidden">
          <div class="h-full bg-ink transition-all duration-200" :style="{ width: `${uploadProgress}%` }" />
        </div>
      </div>

      <!-- Idle prompt -->
      <div v-else class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-md bg-surface-inset border border-border-subtle text-ink-secondary flex items-center justify-center shrink-0">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5" />
        </div>
        <div class="flex flex-col gap-0.5">
          <span class="text-xs sm:text-sm text-ink-secondary">
            <strong class="text-ink font-medium">Click to upload</strong> or drag and drop
          </span>
          <span class="text-[11px] text-ink-tertiary">{{ hint || 'PNG, JPG, WEBP, or PDF up to 10MB' }}</span>
        </div>
      </div>
    </div>

    <div v-if="uploadError" class="text-xs text-status-red m-0">
      {{ uploadError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpload } from '~/composables/useUpload'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    label?: string
    hint?: string
    folder?: string
    accept?: string
    required?: boolean
  }>(),
  {
    modelValue: '',
    label: '',
    hint: '',
    folder: 'attachments',
    accept: 'image/*,application/pdf',
    required: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'uploaded', value: any): void
}>()

const { uploadFile, isUploading, uploadProgress, error: uploadError } = useUpload()
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  if (!isUploading.value) {
    fileInputRef.value?.click()
  }
}

async function handleFile(file: File) {
  const result = await uploadFile(file, props.folder)
  if (result && result.url) {
    emit('update:modelValue', result.url)
    emit('uploaded', result)
  }
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    handleFile(input.files[0])
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    handleFile(event.dataTransfer.files[0])
  }
}

function clearFile() {
  emit('update:modelValue', '')
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)
}

function getDisplayFilename(url: string) {
  try {
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] ?? url)
  } catch {
    return url
  }
}
</script>

