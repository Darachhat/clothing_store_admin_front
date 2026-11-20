<template>
  <div
    :data-astryx-theme="themeName"
    :data-theme="resolvedMode"
    class="min-h-screen bg-surface-bg text-ink antialiased"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { AstryxVueTheme } from '~/astryx-themes'
import { defaultThemeSlug, themes } from '~/astryx-themes'

const props = withDefaults(
  defineProps<{
    theme?: AstryxVueTheme | string
    mode?: 'light' | 'dark' | 'system'
  }>(),
  {
    theme: () => themes[defaultThemeSlug],
    mode: 'light',
  },
)

const themeName = computed(() => {
  if (typeof props.theme === 'string') return props.theme
  return props.theme?.name || defaultThemeSlug
})

const resolvedMode = computed(() => {
  if (props.mode === 'system') return 'light'
  return props.mode || 'light'
})

useHead({
  htmlAttrs: {
    'data-astryx-theme': themeName,
    'data-theme': resolvedMode,
  },
})

watchEffect(() => {
  if (import.meta.client) {
    document.documentElement.setAttribute('data-astryx-theme', themeName.value)
    document.documentElement.setAttribute('data-theme', resolvedMode.value)
  }
})
</script>
