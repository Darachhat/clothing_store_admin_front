// Admin auth middleware — restores session and enforces ADMIN or MANAGER role + route permissions
function isJwtExpired(token: string, bufferSeconds = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const base64 = parts[1]!.replace(/-/g, '+').replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonStr)
    if (typeof payload.exp === 'number') {
      return Date.now() >= (payload.exp - bufferSeconds) * 1000
    }
  } catch {
    return true
  }
  return false
}

const ROUTE_PERMISSION_MAP: Array<{ prefix: string; permission: string }> = [
  { prefix: '/users', permission: 'user.manage' },
  { prefix: '/roles', permission: 'user.manage' },
  { prefix: '/audit-logs', permission: 'settings.manage' },
]

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  authStore.restoreSession()

  if (!authStore.accessToken) {
    return navigateTo('/login', { replace: true })
  }

  if (isJwtExpired(authStore.accessToken, 15)) {
    const refreshed = await authStore.refreshSession()
    if (!refreshed || !authStore.accessToken) {
      authStore.clearLocalSession()
      return navigateTo('/login', { replace: true })
    }
  }

  if (!authStore.user) {
    await authStore.fetchCurrentUser()
  } else {
    authStore.fetchCurrentUser().catch(() => {})
  }

  if (!authStore.accessToken || !authStore.user) {
    authStore.clearLocalSession()
    return navigateTo('/login', { replace: true })
  }

  const roles = authStore.user?.roles?.map((r: any) => r.name) ?? []
  if (!roles.some((r: string) => ['ADMIN', 'MANAGER'].includes(r))) {
    await authStore.logout()
    return navigateTo('/login', { replace: true })
  }

  // Enforce permission-level route restrictions
  for (const rule of ROUTE_PERMISSION_MAP) {
    if (to.path === rule.prefix || to.path.startsWith(rule.prefix + '/')) {
      if (!authStore.hasPermission(rule.permission)) {
        return navigateTo('/dashboard', { replace: true })
      }
    }
  }
})
