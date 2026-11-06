<template>
  <div class="redirect-shell">
    <div class="redirect-card">
      <div class="sidebar-brand-mark">
        <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
      </div>
      <span class="redirect-text">Loading administration console...</span>
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

<style scoped>
.redirect-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-bg, #f8fafc);
}

.redirect-card {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: var(--radius-lg, 8px);
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
}

.redirect-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, #475569);
}
</style>
