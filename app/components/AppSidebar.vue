<template>
  <div>
    <!-- Mobile Backdrop -->
    <Transition name="fade">
      <div
        v-if="isMobileOpen"
        class="sidebar-mobile-backdrop"
        @click="closeMobileSidebar"
      />
    </Transition>

    <aside class="admin-sidebar" :class="{ 'is-collapsed': isCollapsed, 'is-mobile-open': isMobileOpen }">
      <!-- Brand Header -->
      <div class="sidebar-brand">
        <NuxtLink to="/dashboard" class="flex items-center gap-2.5 min-w-0 no-underline" @click="closeMobileSidebar">
          <div class="sidebar-brand-mark" title="Clothing Store Admin">
            <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
          </div>
          <span v-show="!isCollapsed" class="sidebar-brand-name">Clothing Store</span>
        </NuxtLink>
        <button
          type="button"
          class="sidebar-collapse-btn"
          :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="toggleSidebar"
        >
          <UIcon
            :name="isCollapsed ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
            class="w-3.5 h-3.5"
          />
        </button>
      </div>

      <!-- Navigation Groups -->
      <nav class="sidebar-nav" aria-label="Main Navigation">
        <template v-for="(group, idx) in navGroups" :key="group.key">
          <div v-if="!isCollapsed" class="sidebar-section-label">
            {{ group.label }}
          </div>
          <div v-else-if="idx > 0" class="sidebar-section-divider" />

          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="nav-item"
            :class="{ active: isActive(item.to, item.exact) }"
            :title="isCollapsed ? `${group.label}: ${item.label}` : undefined"
            @click="closeMobileSidebar"
          >
            <UIcon :name="item.icon" class="nav-icon" />
            <span v-show="!isCollapsed" class="truncate">{{ item.label }}</span>
          </NuxtLink>
        </template>
      </nav>

      <!-- User Profile Footer -->
      <div class="sidebar-footer">
        <div
          class="sidebar-user-card"
          :class="{ 'is-collapsed': isCollapsed }"
          :title="isCollapsed ? `${userName} (${userRole})` : undefined"
        >
          <div class="sidebar-user-avatar">
            {{ userInitial }}
          </div>
          <div v-show="!isCollapsed" class="min-w-0 flex-1">
            <div class="sidebar-user-name truncate">
              {{ userName }}
            </div>
            <div class="sidebar-user-role truncate">
              {{ userRole }}
            </div>
          </div>
        </div>

        <button
          type="button"
          class="nav-item sidebar-signout-btn"
          :title="isCollapsed ? t('common.sign_out', 'Sign out') : undefined"
          @click="handleLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="nav-icon" />
          <span v-show="!isCollapsed">{{ t('common.sign_out', 'Sign out') }}</span>
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const { t } = useAppTranslation()
const { isCollapsed, isMobileOpen, navGroups, initSidebar, toggleSidebar, closeMobileSidebar, isActive } = useSidebar()

const userName = computed(() => authStore.user?.full_name || 'Admin')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userRole = computed(() => authStore.user?.roles?.[0]?.name || 'Administrator')

async function handleLogout() {
  closeMobileSidebar()
  await authStore.logout()
  await navigateTo('/login')
}

onMounted(() => {
  initSidebar()
})
</script>

<style scoped>
.sidebar-mobile-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sidebar-mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(1px);
    z-index: 35;
  }
}

.sidebar-user-card {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: var(--radius-md, 6px);
}

.sidebar-user-card.is-collapsed {
  justify-content: center;
  padding: 6px 0;
}

.sidebar-user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-primary, #0f172a);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #0f172a);
}

.sidebar-user-role {
  font-size: 10.5px;
  color: var(--text-tertiary, #64748b);
}

.sidebar-signout-btn {
  color: var(--status-red, #b91c1c) !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
