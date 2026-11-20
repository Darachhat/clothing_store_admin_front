<script setup lang="ts">
import { defaultThemeSlug, themes } from '~/astryx-themes'
import { useFontSize } from '~/composables/useFontSize'

const colorMode = useColorMode()
colorMode.preference = 'light'

const { initFontSize } = useFontSize()

if (import.meta.client) {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
  document.documentElement.setAttribute('data-astryx-theme', defaultThemeSlug)
  document.documentElement.setAttribute('data-theme', 'light')
  initFontSize()
}
</script>

<template>
  <Theme :theme="themes[defaultThemeSlug]" mode="light">
    <NuxtLoadingIndicator color="#DDAD01" :height="3" :throttle="150" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <AppToast />
  </Theme>
</template>
