<template>
  <div class="min-h-[100dvh] bg-surface-bg flex flex-col justify-between px-4 sm:px-8 py-5 relative overflow-hidden">
    <!-- Subtle Ambient Background Accent -->
    <div
      class="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-navy/10 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold/15 blur-3xl"
      aria-hidden="true"
    />

    <!-- Top Brand & Language Bar (CDC Auth Header Pattern) -->
    <header class="relative z-10 flex items-center justify-between gap-4 max-w-[1100px] w-full mx-auto">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          <img
            v-if="brand.logo_dark_url || brand.logo_url"
            :src="brand.logo_dark_url || brand.logo_url"
            :alt="displayName"
            class="w-full h-full object-contain p-1.5"
          />
          <UIcon v-else name="i-heroicons-building-storefront" class="w-5 h-5 text-white" />
        </div>
        <div class="min-w-0">
          <div class="text-base font-semibold text-ink tracking-tight truncate font-khmer">
            {{ displayNameKh || displayName }}
          </div>
          <div class="text-xs text-ink-secondary truncate">
            Admin Portal
          </div>
        </div>
      </div>

      <!-- Language Pill Switcher -->
      <div class="inline-flex items-center gap-1 p-1 bg-surface-card border border-subtle rounded-lg shadow-sm shrink-0">
        <button
          v-for="loc in supportedLocales"
          :key="loc.code"
          type="button"
          class="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors"
          :class="currentLocale === loc.code ? 'bg-navy text-white' : 'text-ink-secondary hover:text-ink hover:bg-surface-hover'"
          @click="setLocale(loc.code)"
        >
          {{ loc.flag }}
        </button>
      </div>
    </header>

    <!-- Center Split Glassmorphic Card (CDC Account Auth Card Pattern) -->
    <main class="relative z-10 w-full max-w-[920px] mx-auto my-6">
      <div
        class="grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-surface-card/95 backdrop-blur-xl border border-subtle shadow-modal p-2.5 sm:p-4 overflow-hidden"
      >
        <!-- Left Panel: Deep Navy Brand Showcase (Hidden on mobile, visible md+) -->
        <section
          class="hidden md:flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#102D71] via-[#133686] to-[#0B2054] text-white p-8 relative overflow-hidden"
        >
          <!-- Decorative Subtle Rings -->
          <div class="pointer-events-none absolute -right-16 -top-16 w-60 h-60 rounded-full border border-white/10" />
          <div class="pointer-events-none absolute -left-20 -bottom-20 w-72 h-72 rounded-full border border-white/10" />

          <div class="relative z-10 flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
              <img
                v-if="brand.logo_dark_url || brand.logo_url"
                :src="brand.logo_dark_url || brand.logo_url"
                :alt="displayName"
                class="w-full h-full object-contain p-1.5"
              />
              <UIcon v-else name="i-heroicons-building-storefront" class="w-6 h-6 text-white" />
            </div>
            <div class="min-w-0">
              <div class="text-lg font-semibold text-white truncate font-khmer">
                {{ displayNameKh || displayName }}
              </div>
              <div v-if="displayNameKh && displayName !== displayNameKh" class="text-xs text-white/70 truncate">
                {{ displayName }}
              </div>
            </div>
          </div>

          <div class="relative z-10 my-auto py-8 space-y-4">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-medium">
              <UIcon name="i-heroicons-shield-check" class="w-3.5 h-3.5" />
              <span>Unified Retail Management</span>
            </div>
            <h2 class="text-2xl font-bold leading-snug text-white m-0">
              Operations, Inventory &amp; POS Control Center
            </h2>
            <p class="text-sm text-white/75 leading-relaxed m-0">
              Manage products, multi-branch stock levels, cashier terminals, sales analytics, and staff permissions in one place.
            </p>
          </div>

          <div class="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-white/15">
            <div class="flex items-center gap-2.5 text-xs text-white/85">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-cube" class="w-4 h-4 text-gold" />
              </div>
              <span>Real-time Stock</span>
            </div>
            <div class="flex items-center gap-2.5 text-xs text-white/85">
              <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 text-gold" />
              </div>
              <span>Live Sales Reports</span>
            </div>
          </div>
        </section>

        <!-- Right Panel: Sign-In Form -->
        <section class="flex flex-col justify-center px-4 py-6 sm:px-8 sm:py-8">
          <div class="space-y-1.5 mb-6">
            <h1 class="text-2xl font-bold text-ink tracking-tight m-0">
              {{ t('auth.sign_in', 'Sign in') }}
            </h1>
            <p class="text-sm text-ink-secondary m-0">
              Sign in with your username, verified phone, or linked Telegram account.
            </p>
          </div>

          <!-- Error Banner (Soft tinted fill, neutral border) -->
          <div
            v-if="errorMsg"
            role="alert"
            class="flex items-start gap-2.5 px-3.5 py-3 mb-4 rounded-xl bg-red-50 border border-subtle text-sm text-red-700"
          >
            <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span>{{ errorMsg }}</span>
          </div>

          <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary" for="username">
                Username or Verified Phone
              </label>
              <div class="relative">
                <UIcon
                  name="i-heroicons-user"
                  class="w-4.5 h-4.5 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="username"
                  v-model="form.username"
                  type="text"
                  class="h-11 w-full border border-border-default rounded-xl pl-10 pr-3.5 text-sm text-ink bg-surface-card outline-none hover:border-border-strong focus:border-navy focus:ring-2 focus:ring-navy/15 transition-all placeholder:text-ink-tertiary"
                  placeholder="admin or +85569382165"
                  autocomplete="username"
                  autofocus
                  required
                />
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-secondary" for="password">
                Password
              </label>
              <div class="relative">
                <UIcon
                  name="i-heroicons-lock-closed"
                  class="w-4.5 h-4.5 text-ink-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="h-11 w-full border border-border-default rounded-xl pl-10 pr-10 text-sm text-ink bg-surface-card outline-none hover:border-border-strong focus:border-navy focus:ring-2 focus:ring-navy/15 transition-all placeholder:text-ink-tertiary"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink bg-transparent border-0 cursor-pointer p-1 flex"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              class="h-11 w-full mt-1 bg-navy text-white border-0 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-navy-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              :disabled="loading"
            >
              <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
              <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="flex items-center gap-3 my-5 text-xs text-ink-tertiary before:flex-1 before:h-px before:bg-border-subtle after:flex-1 after:h-px after:bg-border-subtle">
            <span>or continue with</span>
          </div>

          <!-- CDC-style Interactive SSO Card (Telegram App Login) -->
          <div class="flex flex-col gap-2.5">
            <button
              type="button"
              class="w-full flex items-center gap-3.5 p-3 rounded-xl border border-subtle bg-surface-inset hover:bg-surface-hover hover:shadow-sm transition-all cursor-pointer text-left disabled:opacity-50"
              :disabled="loading || appChallengeActive"
              @click="startTelegramAppLogin"
            >
              <div class="w-10 h-10 rounded-lg bg-navy text-white flex items-center justify-center shrink-0">
                <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold text-ink truncate">
                  {{ appChallengeActive ? 'Waiting for Telegram App...' : 'Telegram App Login' }}
                </div>
                <div class="text-xs text-ink-secondary truncate">
                  One-tap secure sign-in via linked Telegram
                </div>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-ink-tertiary shrink-0" />
            </button>

            <div
              v-if="appChallengeActive"
              class="p-3.5 border border-subtle rounded-xl bg-surface-inset flex flex-col gap-2.5"
            >
              <div class="flex items-center gap-2 text-sm font-medium text-ink">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin text-navy shrink-0" />
                <span>{{ appChallengeMessage || 'Confirm login in your Telegram App...' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <a
                  v-if="appChallengeWebUrl"
                  :href="appChallengeWebUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="h-8 px-3 bg-surface-card text-ink border border-border-default rounded-lg text-xs font-medium inline-flex items-center justify-center gap-1.5 no-underline hover:bg-surface-hover"
                >
                  <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                  <span>Open in Telegram</span>
                </a>
                <button
                  type="button"
                  class="h-8 px-3 bg-surface-card text-ink-secondary border border-border-default rounded-lg text-xs font-medium cursor-pointer inline-flex items-center justify-center hover:bg-surface-hover hover:text-ink"
                  @click="cancelTelegramAppLogin"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Bottom Footer -->
    <footer class="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1100px] w-full mx-auto text-xs text-ink-secondary">
      <div class="flex items-center gap-1.5">
        <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5 text-navy" />
        <span>Secure admin access only. Contact your administrator if you need credentials.</span>
      </div>
      <span class="text-ink-tertiary font-mono">{{ displayName }} &middot; Admin</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['guest'] })

const authStore = useAuthStore()
const router = useRouter()
const { brand, displayName, displayNameKh, loadBrand } = useBrand()
const { currentLocale, supportedLocales, initLocale, setLocale, t } = useAppTranslation()

useHead({
  title: computed(() => `Admin Sign In — ${displayName.value || 'Clothing Store'}`),
})

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const showPassword = ref(false)
const errorMsg = ref('')

const appChallengeActive = ref(false)
const appChallengeMessage = ref('')
const appChallengeWebUrl = ref('')
let pollTimer: ReturnType<typeof setInterval> | null = null

async function verifyPortalRolesAndRedirect() {
  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))) {
    await authStore.logout()
    errorMsg.value = 'This portal is for Admin and Manager accounts only.'
    return
  }
  await router.push('/dashboard')
}

async function handleLogin() {
  errorMsg.value = ''
  if (!form.username.trim() || !form.password) {
    errorMsg.value = 'Please enter both username/phone and password.'
    return
  }
  loading.value = true
  try {
    await authStore.login(form.username.trim(), form.password)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string }; message?: string }
    errorMsg.value = error?.data?.detail || 'Invalid username or password.'
  } finally {
    loading.value = false
  }
}

async function handleTelegramAuthCallback(userPayload: Record<string, unknown>) {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.loginWithTelegram(userPayload)
    await verifyPortalRolesAndRedirect()
  } catch (err: unknown) {
    const error = err as { data?: { detail?: string }; message?: string }
    errorMsg.value = error?.data?.detail || 'Telegram authentication failed.'
  } finally {
    loading.value = false
  }
}

function extractTelegramRedirectPayload(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null

  const hash = window.location.hash || ''
  if (hash.includes('tgAuthResult=')) {
    try {
      const encoded = hash.split('tgAuthResult=')[1]?.split('&')[0] || ''
      const normalizedBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
      const padded = normalizedBase64 + '='.repeat((4 - (normalizedBase64.length % 4)) % 4)
      const parsed = JSON.parse(atob(padded))
      if (parsed && parsed.id && parsed.hash) {
        window.history.replaceState({}, document.title, window.location.pathname)
        return parsed
      }
    } catch {}
  }

  const params = new URLSearchParams(window.location.search)
  if (params.get('id') && params.get('hash') && params.get('auth_date')) {
    const payload: Record<string, unknown> = {
      id: Number(params.get('id')) || params.get('id'),
      auth_date: Number(params.get('auth_date')),
      hash: params.get('hash'),
    }
    if (params.get('first_name')) payload.first_name = params.get('first_name')
    if (params.get('last_name')) payload.last_name = params.get('last_name')
    if (params.get('username')) payload.username = params.get('username')
    if (params.get('photo_url')) payload.photo_url = params.get('photo_url')
    window.history.replaceState({}, document.title, window.location.pathname)
    return payload
  }

  return null
}

function cancelTelegramAppLogin() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
  appChallengeActive.value = false
  appChallengeMessage.value = ''
  appChallengeWebUrl.value = ''
}

async function startTelegramAppLogin() {
  if (typeof window === 'undefined') return
  errorMsg.value = ''
  cancelTelegramAppLogin()

  try {
    const ch = await authStore.createTelegramAppChallenge()
    appChallengeActive.value = true
    appChallengeMessage.value = "Tap 'Start' in your Telegram App to sign in..."
    appChallengeWebUrl.value = ch.tg_web_url

    window.location.href = ch.tg_app_url

    pollTimer = setInterval(async () => {
      try {
        const res = await authStore.pollTelegramAppStatus(ch.challenge_token)
        if (res.message) {
          appChallengeMessage.value = res.message
        }
        if (res.status === 'APPROVED') {
          cancelTelegramAppLogin()
          await verifyPortalRolesAndRedirect()
        } else if (res.status === 'REJECTED' || res.status === 'EXPIRED') {
          const msg = res.message || 'Telegram login was declined or expired.'
          cancelTelegramAppLogin()
          errorMsg.value = msg
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.statusCode === 403) {
          cancelTelegramAppLogin()
          errorMsg.value = err?.data?.detail || 'Account is not authorized for this portal.'
        }
      }
    }, 2000)
  } catch (err: any) {
    errorMsg.value = err?.data?.detail || 'Could not start Telegram App login. Please ensure backend is updated.'
  }
}

onBeforeUnmount(() => {
  cancelTelegramAppLogin()
})

onMounted(async () => {
  initLocale()
  loadBrand()
  if (typeof window !== 'undefined') {
    const redirectedPayload = extractTelegramRedirectPayload()
    if (redirectedPayload) {
      await handleTelegramAuthCallback(redirectedPayload)
    }
  }
})
</script>
