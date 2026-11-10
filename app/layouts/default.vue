<template>
  <div class="admin-shell">
    <!-- Accessible Skip to Content Link (WCAG 2.1 AA) -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Unified Sidebar Component -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="admin-main" :class="{ 'is-sidebar-collapsed': isCollapsed }">
      <AppHeader />

      <main id="main-content" class="admin-content" tabindex="-1">
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
