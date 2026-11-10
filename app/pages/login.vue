<template>
  <div class="flex min-h-[100dvh] bg-surface-bg">
    <!-- Left panel: branding -->
    <div class="hidden md:flex flex-col justify-center w-[320px] lg:w-[400px] shrink-0 bg-brand-900 p-8 lg:p-12 text-white">
      <div class="flex flex-col gap-6">
        <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
          <img
            v-if="brand.logo_dark_url || brand.logo_url"
            :src="brand.logo_dark_url || brand.logo_url"
            :alt="displayName"
            class="max-w-full max-h-full object-contain p-1"
          />
          <UIcon v-else name="i-heroicons-shield-check" class="w-6 h-6 text-white" />
        </div>
        <div>
          <div class="text-[22px] font-bold text-white tracking-tight mt-1 font-khmer">{{ displayNameKh || displayName }}</div>
          <div v-if="displayNameKh && displayName !== displayNameKh" class="text-[13px] font-semibold text-white/65 mt-0.5">
            {{ displayName }}
          </div>
        </div>
        <p class="text-sm text-white/60 leading-relaxed max-w-[52ch]">{{ brand.tagline || 'Admin & Manager portal. Full access to inventory, reports, purchasing, and user management.' }}</p>
        <div class="flex flex-col gap-2.5 mt-2">
          <div v-for="feat in features" :key="feat" class="flex items-center gap-2.5 text-[13px] text-white/75">
            <UIcon name="i-heroicons-check" class="w-3.5 h-3.5 text-white stroke-[2.5]" />
            {{ feat }}
          </div>
        </div>
      </div>
    </div>

    <!-- Right panel: form -->
    <div class="flex-1 flex items-center justify-center p-6 sm:p-8">
      <div class="w-full max-w-[360px] flex flex-col gap-6">
        <!-- Mobile Brand Header (visible below 768px) -->
        <div class="flex md:hidden items-center gap-3 pb-3 border-b border-border-subtle">
          <div class="w-10 h-10 rounded-lg bg-brand-900 flex items-center justify-center shrink-0">
            <img
              v-if="brand.logo_url || brand.logo_dark_url"
              :src="brand.logo_url || brand.logo_dark_url"
              :alt="displayName"
              class="max-w-full max-h-full object-contain p-1"
            />
            <UIcon v-else name="i-heroicons-shield-check" class="w-5 h-5 text-white" />
          </div>
          <div class="min-w-0">
            <div class="text-[15px] font-bold text-ink truncate font-khmer">{{ displayNameKh || displayName }}</div>
            <div class="text-[11px] text-ink-secondary truncate">{{ displayName }} • Admin Portal</div>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <h1 class="text-[22px] font-bold text-ink tracking-tight">Admin Sign In</h1>
          <p class="text-[13px] text-ink-secondary">Sign in with your username, verified phone, or linked Telegram account.</p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-ink tracking-wide" for="username">Username or Verified Phone</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              class="h-10 w-full border border-border-subtle rounded-lg px-3 text-sm text-ink bg-surface-card outline-none focus:border-border-default transition-colors placeholder:text-ink-tertiary"
              placeholder="admin or +85569382165"
              autocomplete="username"
              autofocus
              required
            />
          </div>

          <div class="flex flex-col gap-1.5 relative">
            <label class="text-xs font-semibold text-ink tracking-wide" for="password">Password</label>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="h-10 w-full border border-border-subtle rounded-lg px-3 text-sm text-ink bg-surface-card outline-none focus:border-border-default transition-colors placeholder:text-ink-tertiary"
              placeholder="Enter your password"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="absolute right-2.5 bottom-2.5 text-ink-tertiary hover:text-ink bg-transparent border-0 cursor-pointer p-0 flex"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <UIcon v-if="!showPassword" name="i-heroicons-eye" class="w-4 h-4" />
              <UIcon v-else name="i-heroicons-eye-slash" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMsg" class="flex items-center gap-1.5 p-2.5 bg-status-red-bg border border-border-subtle rounded-lg text-xs text-status-red">
            <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 flex-shrink-0" />
            {{ errorMsg }}
          </div>

          <button type="submit" class="h-10 w-full bg-brand-900 text-white border-0 rounded-lg text-sm font-semibold cursor-pointer flex items-center justify-center gap-2 mt-1 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity" :disabled="loading">
            <UIcon v-if="loading" name="i-heroicons-arrow-path" class="w-4 h-4 text-white animate-spin" />
            {{ loading ? 'Signing in...' : 'Sign in' }}
          </button>
        </form>

        <!-- Telegram Login Section -->
        <div class="flex items-center gap-2.5 text-[11px] text-ink-tertiary uppercase tracking-wider before:flex-1 before:h-px before:bg-border-subtle after:flex-1 after:h-px after:bg-border-subtle">
          <span>or</span>
        </div>

        <div class="flex flex-col gap-2">
          <button
            type="button"
            class="h-9.5 w-full bg-surface-card text-ink border border-border-subtle rounded-lg text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-2 hover:bg-surface-hover disabled:opacity-50 transition-colors"
            :disabled="loading || appChallengeActive"
            @click="startTelegramAppLogin"
          >
            <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4" />
            <span>{{ appChallengeActive ? 'Waiting for Telegram App...' : 'Open in Telegram App' }}</span>
          </button>

          <div v-if="appChallengeActive" class="p-2.5 border border-border-subtle rounded-lg bg-surface-card flex flex-col gap-2">
            <div class="flex items-center gap-2 text-xs font-medium text-ink">
              <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
              <span>{{ appChallengeMessage || 'Confirm login in your Telegram App (@clothing_store_kvm_bot)...' }}</span>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <a
                v-if="appChallengeWebUrl"
                :href="appChallengeWebUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="h-8.5 px-3 bg-surface-card text-ink border border-border-subtle rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 no-underline hover:bg-surface-hover"
              >
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3.5 h-3.5" />
                <span>Open in Telegram</span>
              </a>
              <button
                type="button"
                class="h-8.5 px-3 bg-surface-card text-ink border border-border-subtle rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-center hover:bg-surface-hover"
                @click="cancelTelegramAppLogin"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>

        <p class="text-xs text-ink-tertiary text-center">
          Secure admin access only. Contact your administrator if you need credentials.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['guest'] })

const authStore = useAuthStore()
const router = useRouter()
const { brand, displayName, displayNameKh, loadBrand } = useBrand()

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

const features = [
  'Full dashboard & analytics',
  'Inventory & stock management',
  'Purchase orders & suppliers',
  'User roles & permissions',
]

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

  // 1. Check #tgAuthResult=<base64> returned by https://oauth.telegram.org/auth redirect
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

  // 2. Check query string ?id=...&auth_date=...&hash=... returned by data-auth-url redirect
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

    // Launch the installed Telegram Desktop or Mobile App directly via tg:// protocol
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
  loadBrand()
  if (typeof window !== 'undefined') {
    const redirectedPayload = extractTelegramRedirectPayload()
    if (redirectedPayload) {
      await handleTelegramAuthCallback(redirectedPayload)
    }
  }
})
</script>

