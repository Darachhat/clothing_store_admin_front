<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-brand">
        <div class="login-mark">
          <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
        </div>
        <div>
          <span class="login-name">Clothing Store</span>
          <span class="login-sub">Retail Administration Portal</span>
        </div>
      </div>

      <h1 class="login-heading">Sign in to Admin</h1>
      <p class="login-desc">Enter your administrator or manager credentials to continue.</p>

      <div v-if="errorMsg" class="login-error" role="alert">
        <UIcon name="i-heroicons-exclamation-circle" class="w-4 h-4 shrink-0" />
        <span>{{ errorMsg }}</span>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-field">
          <label class="field-label" for="email">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            class="field-input"
            placeholder="admin@clothingstore.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="form-field">
          <label class="field-label" for="password">Password</label>
          <div class="password-wrap">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input password-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="password-toggle"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            >
              <UIcon :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Sign In — Clothing Store Admin' })

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  authStore.restoreSession()
  if (authStore.isAuthenticated) {
    navigateTo('/dashboard', { replace: true })
  }
})

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
    if (!roles.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))) {
      await authStore.logout()
      errorMsg.value = 'Access denied. Admin or Manager role required.'
      return
    }
    await navigateTo('/dashboard', { replace: true })
  } catch (e: any) {
    errorMsg.value = e?.data?.detail ?? e?.message ?? 'Invalid email or password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--surface-bg, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-box {
  width: 100%;
  max-width: 380px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-xl, 12px);
  padding: 28px;
  box-shadow: var(--shadow-sm);
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.login-mark {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md, 6px);
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.login-name {
  display: block;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
}

.login-sub {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary, #64748b);
}

.login-heading {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #0f172a);
  margin: 0 0 4px;
}

.login-desc {
  font-size: 12.5px;
  color: var(--text-secondary, #475569);
  margin: 0 0 18px;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--status-red-bg, #fef2f2);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-md, 6px);
  font-size: 12px;
  color: var(--status-red, #b91c1c);
  margin-bottom: 16px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 36px;
}

.password-toggle {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--text-tertiary, #64748b);
  cursor: pointer;
  padding: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.password-toggle:hover {
  color: var(--text-primary, #0f172a);
}

.login-btn {
  margin-top: 4px;
  padding: 9px 16px;
  height: 38px;
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  border: 1px solid transparent;
  border-radius: var(--radius-md, 6px);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.12s, opacity 0.12s;
}

.login-btn:hover:not(:disabled) {
  background: var(--accent-hover, #1e293b);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
