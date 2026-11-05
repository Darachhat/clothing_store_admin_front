<script setup lang="ts">
const colorMode = useColorMode()
colorMode.preference = 'light'

if (import.meta.client) {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
}
</script>

<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
  </div>
</template>
