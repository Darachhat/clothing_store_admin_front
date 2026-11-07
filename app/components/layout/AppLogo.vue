<template>
  <span class="app-logo" :aria-label="displayName">
    <span class="app-logo__mark">
      <img
        v-if="brand.logo_url"
        :src="brand.logo_url"
        :alt="displayName"
        class="w-full h-full object-contain p-0.5 rounded"
      />
      <UIcon v-else name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
    </span>
    <span class="app-logo__text">{{ displayName }}</span>
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

<style scoped>
.app-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.app-logo__mark {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md, 6px);
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-logo__text {
  font-family: var(--font-display, sans-serif);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  letter-spacing: -0.01em;
}
</style>
