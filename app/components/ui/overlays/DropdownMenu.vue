<template>
  <div ref="rootRef" class="dd-menu">
    <div class="dd-menu__trigger" @click="toggle">
      <slot name="trigger" :open="open">
        <BaseButton variant="default" size="sm" icon="i-heroicons-ellipsis-horizontal" :label="label" />
      </slot>
    </div>

    <Transition name="dd-fade">
      <div
        v-if="open"
        class="dd-menu__panel"
        :class="`dd-menu__panel--${align}`"
        role="menu"
      >
        <slot :close="close">
          <template v-for="(item, idx) in items" :key="idx">
            <div v-if="item.divider" class="dd-menu__divider" />
            <component
              :is="item.to ? NuxtLinkComp : 'button'"
              v-else
              :to="item.to"
              :type="item.to ? undefined : 'button'"
              class="dd-menu__item"
              :class="{ 'is-danger': item.variant === 'danger' }"
              :disabled="item.disabled"
              role="menuitem"
              @click="onSelect(item)"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ item.label }}</span>
            </component>
          </template>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '~/types'

withDefaults(defineProps<{
  items?: DropdownMenuItem[]
  label?: string
  align?: 'left' | 'right'
}>(), {
  items: () => [],
  align: 'right',
})

const emit = defineEmits<{
  select: [item: DropdownMenuItem]
}>()

const NuxtLinkComp = resolveComponent('NuxtLink')
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onSelect(item: DropdownMenuItem) {
  if (item.disabled) return
  item.onSelect?.()
  emit('select', item)
  close()
}

function onDocClick(e: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(e.target as Node)) close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.dd-menu {
  position: relative;
  display: inline-flex;
}

.dd-menu__panel {
  position: absolute;
  top: calc(100% + 6px);
  min-width: 180px;
  max-width: calc(100vw - 24px);
  padding: 4px;
  background: var(--surface-card, #ffffff);
  border: 1px solid var(--border-subtle, #e5e7eb);
  border-radius: var(--radius-lg, 8px);
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.08));
  z-index: var(--z-dropdown, 60);
}

.dd-menu__panel--right { right: 0; }
.dd-menu__panel--left { left: 0; }

.dd-menu__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  font-size: 12.5px;
  color: var(--text-secondary, #475569);
  background: transparent;
  border: none;
  border-radius: var(--radius-md, 6px);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.dd-menu__item:hover:not(:disabled) {
  background: var(--surface-hover, #f1f5f9);
  color: var(--text-primary, #0f172a);
}

.dd-menu__item.is-danger { color: var(--status-red, #b91c1c); }
.dd-menu__item:disabled { opacity: 0.5; cursor: not-allowed; }

.dd-menu__divider {
  height: 1px;
  margin: 4px 0;
  background: var(--border-subtle, #e5e7eb);
}

.dd-fade-enter-active,
.dd-fade-leave-active {
  transition: opacity 0.12s ease;
}

.dd-fade-enter-from,
.dd-fade-leave-to {
  opacity: 0;
}
</style>
