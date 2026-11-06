<template>
  <span class="app-logo" aria-label="Clothing Store Admin">
    <span class="app-logo__mark">
      <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
    </span>
    <span class="app-logo__text">Clothing Store</span>
  </span>
</template>

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
