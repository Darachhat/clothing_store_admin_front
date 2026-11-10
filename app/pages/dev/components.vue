<template>
  <div class="flex flex-col gap-4">
    <PageHeader
      title="Component Showcase"
      description="Development-only gallery of every shared UI component."
      :breadcrumbs="[{ label: 'Dev', to: '/dev/components' }, { label: 'Components' }]"
    />

    <DataCard title="Buttons">
      <div class="flex flex-wrap items-center gap-2 mb-2.5">
        <BaseButton v-for="v in variants" :key="v" :variant="v" :label="v" />
      </div>
      <div class="flex flex-wrap items-center gap-2 mb-2.5">
        <BaseButton v-for="s in sizes" :key="s" :size="s" :label="`Size ${s}`" icon="i-heroicons-plus" />
        <BaseButton label="Loading" loading />
        <BaseButton label="Disabled" disabled />
        <IconButton icon="i-heroicons-trash" label="Delete" />
      </div>
    </DataCard>

    <DataCard title="Inputs">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <SearchBar v-model="search" placeholder="Search products..." />
        <FormField label="Name" required hint="Helper text">
          <BaseInput v-model="text" placeholder="Text input" />
        </FormField>
        <FormField label="Invalid" error="This field is required">
          <BaseInput v-model="empty" />
        </FormField>
        <FormField label="Select">
          <BaseSelect v-model="select" :options="selectOptions" />
        </FormField>
        <FormField label="Textarea">
          <BaseTextarea v-model="area" :rows="3" />
        </FormField>
        <FormField label="Date">
          <DatePicker v-model="date" />
        </FormField>
        <DateRangePicker v-model:from="from" v-model:to="to" />
        <Checkbox v-model="checked" label="Checkbox option" />
      </div>
    </DataCard>

    <DataCard title="Status badges & stat cards">
      <div class="flex flex-wrap items-center gap-2 mb-2.5">
        <StatusBadge v-for="s in statuses" :key="s" :status="s" :label="s" />
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Revenue" value="$12,480" icon="i-heroicons-banknotes" tone="success" />
        <StatCard label="Orders" value="342" icon="i-heroicons-shopping-bag" tone="info" />
        <StatCard label="Low stock" value="18" icon="i-heroicons-exclamation-triangle" tone="warning" />
        <StatCard label="Refunds" value="4" icon="i-heroicons-arrow-uturn-left" tone="danger" />
      </div>
    </DataCard>

    <DataCard title="Filters, table & pagination">
      <FilterBar v-model:search="search" :chips="chips" :total-count="rows.length" @remove-chip="chips = chips.filter(c => c.key !== $event)" @clear-all="chips = []" />
      <DataTable :columns="columns" :rows="rows" row-key="id">
        <template #cell-status="{ row }">
          <StatusBadge :status="row.status" :label="row.status" />
        </template>
      </DataTable>
      <Pagination v-model:page="page" :total="120" :page-size="25" />
    </DataCard>

    <DataCard title="Navigation">
      <BaseTabs v-model="tab" :tabs="tabs" />
      <BaseTabs v-model="tab" :tabs="tabs" variant="underline" />
      <Breadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'Products', to: '/products' }, { label: 'Detail' }]" />
      <DropdownMenu :items="menuItems" label="Actions" />
    </DataCard>

    <DataCard title="Overlays">
      <div class="showcase-row">
        <BaseButton label="Open modal" @click="modalOpen = true" />
        <BaseButton label="Open drawer" @click="drawerOpen = true" />
        <BaseButton label="Confirm dialog" variant="danger" @click="confirmOpen = true" />
      </div>
      <BaseModal v-model="modalOpen" title="Sample modal" description="Reusable modal">
        <p>Modal body content.</p>
        <template #footer>
          <BaseButton label="Close" @click="modalOpen = false" />
        </template>
      </BaseModal>
      <BaseDrawer v-model="drawerOpen" title="Sample drawer" subtitle="Reusable drawer">
        <p>Drawer body content.</p>
      </BaseDrawer>
      <ConfirmDialog
        v-model="confirmOpen"
        title="Delete item?"
        message="This action cannot be undone."
        confirm-label="Delete"
        @confirm="confirmOpen = false"
      />
    </DataCard>

    <DataCard title="Feedback">
      <div class="showcase-grid">
        <InlineAlert variant="info" title="Info" description="Informational message." />
        <InlineAlert variant="success" title="Success" description="Saved successfully." />
        <InlineAlert variant="warning" title="Warning" description="Check this value." />
        <InlineAlert variant="danger" title="Error" description="Something went wrong." dismissible />
      </div>
      <LoadingSkeleton variant="kpi" :rows="3" />
      <LoadingSkeleton variant="table" :rows="3" />
      <EmptyState icon="i-heroicons-inbox" title="Nothing here" description="Empty state example." />
      <ErrorState title="Unable to load" message="Error state example." />
    </DataCard>

    <DataCard title="Form layout">
      <FormSection title="Section" description="Grouped fields">
        <FormField label="Field A"><BaseInput v-model="text" /></FormField>
        <FormField label="Field B"><BaseInput v-model="empty" /></FormField>
      </FormSection>
      <FormActions>
        <BaseButton variant="ghost" label="Cancel" />
        <BaseButton variant="primary" label="Save" />
      </FormActions>
    </DataCard>
  </div>
</template>

<script setup lang="ts">
import type { FilterChipItem } from '~/types'

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
}

const variants = ['primary', 'secondary', 'default', 'outline', 'ghost', 'danger', 'success', 'link'] as const
const sizes = ['xs', 'sm', 'md', 'lg'] as const
const statuses = ['ACTIVE', 'PENDING', 'CANCELLED', 'DRAFT', 'ORDERED']

const search = ref('')
const text = ref('')
const empty = ref('')
const select = ref('a')
const area = ref('')
const date = ref('')
const from = ref('')
const to = ref('')
const checked = ref(false)
const page = ref(1)
const tab = ref('one')
const modalOpen = ref(false)
const drawerOpen = ref(false)
const confirmOpen = ref(false)

const selectOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]
const tabs = [
  { key: 'one', label: 'Overview', icon: 'i-heroicons-squares-2x2' },
  { key: 'two', label: 'Details', count: 4 },
  { key: 'three', label: 'History' },
]
const chips = ref<FilterChipItem[]>([
  { key: 'status', label: 'Status: Active', value: 'Active' },
  { key: 'cat', label: 'Category: Shirts', value: 'Shirts' },
])
const menuItems = [
  { label: 'Edit', icon: 'i-heroicons-pencil-square' },
  { label: 'Duplicate', icon: 'i-heroicons-document-duplicate' },
  { divider: true, label: '' },
  { label: 'Delete', icon: 'i-heroicons-trash', variant: 'danger' as const },
]
const columns = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Product' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
]
const rows = [
  { id: 1, sku: 'TS-001', name: 'Basic Tee', stock: 42, status: 'ACTIVE' },
  { id: 2, sku: 'JN-014', name: 'Slim Jeans', stock: 7, status: 'PENDING' },
  { id: 3, sku: 'HD-220', name: 'Zip Hoodie', stock: 0, status: 'CANCELLED' },
]
</script>


