// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  devtools: { enabled: true },

  experimental: {
    appManifest: false,
    payloadExtraction: false,
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  hooks: {
    'build:manifest': (manifest) => {
      for (const key in manifest) {
        if (manifest[key]) {
          manifest[key].prefetch = false
        }
      }
    },
    'components:extend': (components) => {
      const aliasPairs: Array<[string, string]> = [
        ['BaseButton', 'AppButton'],
        ['IconButton', 'AppIconButton'],
        ['ButtonGroup', 'AppButtonGroup'],
        ['BaseInput', 'AppInput'],
        ['SearchBar', 'AppSearchBar'],
        ['BaseSelect', 'AppSelect'],
        ['BaseTextarea', 'AppTextarea'],
        ['DatePicker', 'AppDatePicker'],
        ['Checkbox', 'AppCheckbox'],
        ['FileUpload', 'AppFileUpload'],
        ['DataTable', 'AppTable'],
        ['DataCard', 'AppCard'],
        ['StatCard', 'AppStatCard'],
        ['StatusBadge', 'AppBadge'],
        ['EmptyState', 'AppEmptyState'],
        ['FilterBar', 'AppFilterBar'],
        ['FilterDropdown', 'AppFilterDropdown'],
        ['FilterChip', 'AppFilterChip'],
        ['DateRangePicker', 'AppDateRangePicker'],
        ['BaseTabs', 'AppTabs'],
        ['Breadcrumb', 'AppBreadcrumb'],
        ['Pagination', 'AppPagination'],
        ['BaseModal', 'AppModal'],
        ['BaseDrawer', 'AppDetailDrawer'],
        ['ConfirmDialog', 'AppConfirmDialog'],
        ['DropdownMenu', 'AppDropdownMenu'],
        ['LoadingSkeleton', 'AppLoadingSkeleton'],
        ['ErrorState', 'AppErrorState'],
        ['InlineAlert', 'AppInlineAlert'],
        ['ToastNotification', 'AppToast'],
        ['FormField', 'AppFormField'],
        ['FormSection', 'AppFormSection'],
        ['FormActions', 'AppFormActions'],
        ['AdminSidebar', 'AppSidebar'],
        ['AdminHeader', 'AppHeader'],
        ['PageHeader', 'AppPageHeader'],
      ]

      const toKebab = (name: string) =>
        name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

      for (const [canonical, appAlias] of aliasPairs) {
        const foundCanonical = components.find(c => c.pascalName === canonical)
        const foundAlias = components.find(c => c.pascalName === appAlias)
        const source = foundCanonical || foundAlias
        if (!source) continue

        const targetName = foundCanonical ? appAlias : canonical
        if (!components.some(c => c.pascalName === targetName)) {
          components.push({
            ...source,
            pascalName: targetName,
            kebabName: toKebab(targetName),
          })
        }
      }
    },
  },

  // Nuxt 4 app dir convention
  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  tailwindcss: {
    configPath: '~/tailwind.config.ts',
    exposeConfig: false,
  },

  app: {
    head: {
      title: 'Admin — Clothing Store',
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@300;400;500;600;700&family=Inter+Tight:wght@400;500;600;700&family=Kantumruy+Pro:wght@400;500;600;700&family=Noto+Sans+Khmer:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    apiBase:     process.env.NUXT_API_BASE     || 'https://api.kimvannak.store',
    // X-System-Authorization value injected server-side; never sent to browser
    apiBaseAuth: process.env.NUXT_API_BASE_AUTH || 'Basic YWRtaW5fZnJvbnQ6SkN3aTRaVkFqZWVqVlpsWmVmTFJubmVvUWh0Y1NrbnlYcWtzSGd0bnhnZw==',
    public: {
      apiBase:     process.env.NUXT_PUBLIC_API_BASE     || '/api/proxy',
      backendBase: process.env.NUXT_PUBLIC_BACKEND_BASE || process.env.NUXT_API_BASE || 'https://api.kimvannak.store',
      appName:     process.env.NUXT_PUBLIC_APP_NAME     || 'Kim Vannak Store — Admin',
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
    storageKey: 'admin-color-mode-light',
  },

  ui: {
    global: true,
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/main.css'],

  pinia: {
    storesDirs: ['./app/stores/**'],
  },

  nitro: {
    preset: process.env.NITRO_PRESET || (process.env.CF_PAGES ? 'cloudflare_pages' : 'cloudflare-module'),
    compatibilityDate: '2024-11-01',
    cloudflare: {
      deployConfig: false,
    },
  } as any,

  routeRules: {
    '/': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/login': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/admin/**': {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate',
        'cdn-cache-control': 'no-store',
        'cloudflare-cdn-cache-control': 'no-store',
      },
    },
    '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    ...(process.env.NUXT_API_BASE
      ? { '/uploads/**': { proxy: `${process.env.NUXT_API_BASE}/uploads/**` } }
      : {}),
  } as any,
})
