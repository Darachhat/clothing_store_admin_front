<template>
  <div class="admin-shell min-h-screen bg-surface-bg flex">
    <!-- Accessible Skip to Content Link (WCAG 2.1 AA) -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Unified Sidebar Component -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div
      class="admin-main flex-1 flex flex-col min-w-0 transition-all duration-200"
      :class="isCollapsed ? 'is-sidebar-collapsed' : ''"
    >
      <AppHeader />

      <main id="main-content" class="admin-content flex-1 p-4 sm:p-6 outline-none overflow-y-auto min-w-0" tabindex="-1">
        <slot />
      </main>
    </div>

    <!-- Global Toast Notification Container -->
    <AppToast />
  </div>
</template>


<script setup lang="ts">
const { isCollapsed } = useSidebar()
</script>
