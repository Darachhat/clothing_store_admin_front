<template>
  <div class="admin-shell">
    <!-- Unified Sidebar Component -->
    <AppSidebar />

    <!-- Main Content Area -->
    <div class="admin-main" :class="{ 'is-sidebar-collapsed': isCollapsed }">
      <AppHeader />

      <main class="admin-content">
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
