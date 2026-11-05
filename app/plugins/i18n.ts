export default defineNuxtPlugin(async () => {
  const i18n = useAppTranslation()

  if (import.meta.client) {
    // Non-blocking background sync with backend Redis translation cache
    i18n.fetchTranslations().catch(() => {})
  }

  return {
    provide: {
      t: (key: string, fallback?: string) => i18n.t(key, fallback),
      locale: i18n.currentLocale,
      setLocale: i18n.setLocale,
    },
  }
})

