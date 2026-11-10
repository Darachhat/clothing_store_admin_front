<template>
  <span class="inline-flex items-center gap-2" :aria-label="displayName">
    <span class="w-7 h-7 rounded-md bg-ink text-white inline-flex items-center justify-center shrink-0 overflow-hidden">
      <img
        v-if="brand.logo_url"
        :src="brand.logo_url"
        :alt="displayName"
        class="w-full h-full object-contain p-0.5 rounded"
      />
      <UIcon v-else name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
    </span>
    <span class="font-bold text-sm text-ink truncate">{{ displayName }}</span>
  </span>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBrand } from '~/composables/useBrand'

const { brand, displayName, loadBrand } = useBrand()

onMounted(() => {
  loadBrand()
})
</script>
