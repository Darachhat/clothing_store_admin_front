<template>
  <div ref="rootRef" class="relative inline-flex">
    <div class="inline-flex cursor-pointer" @click="toggle">
      <slot name="trigger" :open="open">
        <BaseButton variant="default" size="sm" icon="i-heroicons-ellipsis-horizontal" :label="label" />
      </slot>
    </div>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="scale-95 opacity-0"
      enter-to-class="scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="scale-100 opacity-100"
      leave-to-class="scale-95 opacity-0"
    >
      <div
        v-if="open"
        class="absolute top-[calc(100%+6px)] min-w-[180px] max-w-[calc(100vw-24px)] p-1 bg-surface-card border border-border-subtle rounded-lg shadow-md z-[60] origin-top"
        :class="align === 'left' ? 'left-0' : 'right-0'"
        role="menu"
      >
        <slot :close="close">
          <template v-for="(item, idx) in items" :key="idx">
            <div v-if="item.divider" class="h-px my-1 bg-border-subtle" />
            <component
              :is="item.to ? NuxtLinkComp : 'button'"
              v-else
              :to="item.to"
              :type="item.to ? undefined : 'button'"
              class="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-normal rounded-md text-left transition-colors"
              :class="[
                item.disabled ? 'opacity-50 cursor-not-allowed' :
                item.variant === 'danger' ? 'text-status-red hover:bg-status-red-bg hover:text-status-red' :
                'text-ink-secondary hover:bg-surface-hover hover:text-ink'
              ]"
              :disabled="item.disabled"
              role="menuitem"
              @click="onSelect(item)"
            >
              <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 shrink-0" />
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
