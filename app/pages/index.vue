<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-bg">
    <div class="inline-flex items-center gap-2.5 px-4.5 py-3 rounded-lg bg-surface-card border border-border-subtle shadow-sm">
      <div class="w-8 h-8 rounded-md bg-brand-900 text-white flex items-center justify-center">
        <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
      </div>
      <span class="text-[13px] font-medium text-ink-secondary">Loading administration console...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const authStore = useAuthStore()

onMounted(async () => {
  authStore.restoreSession()
  if (authStore.isAuthenticated) {
    await navigateTo('/dashboard', { replace: true })
  } else {
    await navigateTo('/login', { replace: true })
  }
})
</script>

