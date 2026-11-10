<template>
  <div class="page-root">
    <!-- Header -->
    <AppPageHeader
      title="Roles &amp; Permissions"
      description="Configure role-based access control (RBAC) and system permission assignments."
      :breadcrumbs="[{ label: 'Administration' }, { label: 'Roles & Permissions' }]"
    >
      <template #actions>
        <AppButton
          label="Add Role"
          variant="primary"
          size="sm"
          icon="i-heroicons-plus"
          @click="openCreateModal"
        />
      </template>
    </AppPageHeader>

    <!-- Roles Table -->
    <AppCard :no-pad="true">
      <AppTable
        :columns="columns"
        :rows="roles"
        :loading="loading"
        empty-text="No roles found."
        empty-icon="i-heroicons-shield-check"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-ink">{{ row.name }}</span>
            <AppBadge v-if="row.is_system" color="default" size="sm">System</AppBadge>
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="text-[12.5px] text-ink-secondary">{{ row.description || 'No description' }}</span>
        </template>

        <template #cell-permissions="{ row }">
          <div class="flex flex-wrap items-center gap-1 max-w-[460px]">
            <AppBadge
              v-for="perm in (row.permissions || []).slice(0, 4)"
              :key="perm.id"
              color="indigo"
              size="sm"
            >
              {{ perm.code }}
            </AppBadge>
            <span v-if="(row.permissions || []).length > 4" class="text-[11.5px] text-ink-tertiary ml-1">
              +{{ (row.permissions || []).length - 4 }} more
            </span>
            <span v-if="!(row.permissions || []).length" class="text-[12.5px] text-ink-secondary">No permissions</span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            size="xs"
            variant="ghost"
            icon="i-heroicons-pencil-square"
            label="Edit Permissions"
            @click="openEditModal(row)"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Role Modal -->
    <AppModal
      v-model="showCreateModal"
      :title="editingRoleId ? 'Edit Role & Permissions' : 'Create Custom Role'"
      description="Assign granular permission codes to control module and API access."
      size="lg"
    >
      <form class="form-grid" @submit.prevent="handleCreateRole">
        <div class="form-field">
          <label class="field-label">Role Name <span class="req">*</span></label>
          <input
            v-model="createForm.name"
            type="text"
            required
            :disabled="Boolean(editingRoleId)"
            placeholder="e.g. INVENTORY_CLERK"
            class="field-input uppercase"
          />
        </div>

        <div class="form-field">
          <label class="field-label">Description</label>
          <input
            v-model="createForm.description"
            type="text"
            placeholder="Brief description of responsibilities"
            class="field-input"
          />
        </div>

        <div class="form-field">
          <div class="flex items-center justify-between gap-3 mb-1">
            <label class="field-label">Granted Permissions ({{ createForm.permission_ids.length }} selected)</label>
            <input
              v-model="permSearch"
              type="text"
              placeholder="Filter permissions..."
              class="h-7 px-2 text-xs bg-surface-inset border border-border-subtle rounded text-ink outline-none w-44 focus:border-border-default"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto p-2.5 bg-surface-inset border border-border-subtle rounded-md">
            <label
              v-for="perm in filteredPermissions"
              :key="perm.id"
              class="flex items-start gap-2 p-1.5 rounded hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <input
                v-model="createForm.permission_ids"
                type="checkbox"
                :value="perm.id"
              />
              <div class="flex flex-col gap-px">
                <span class="text-xs font-medium text-ink">{{ perm.name }}</span>
                <span class="text-[11px] font-mono text-ink-tertiary">{{ perm.code }}</span>
              </div>
            </label>
            <div v-if="!filteredPermissions.length" class="col-span-full text-center p-4 text-xs text-ink-tertiary">
              No permissions match "{{ permSearch }}"
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton variant="ghost" type="button" label="Cancel" @click="showCreateModal = false" />
          <AppButton type="submit" variant="primary" label="Save Role" :loading="saving" />
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })
useHead({ title: 'Roles & Permissions — Clothing Store' })

const userApi = useUserApi()
const { addToast } = useAppToast()

const loading = ref(false)
const saving = ref(false)
const roles = ref<any[]>([])
const permissions = ref<any[]>([])
const permSearch = ref('')

const columns = [
  { key: 'name', label: 'Role', sortable: true },
  { key: 'description', label: 'Description' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const editingRoleId = ref<string | null>(null)
const createForm = ref({
  name: '',
  description: '',
  permission_ids: [] as string[],
})

const filteredPermissions = computed(() => {
  const q = permSearch.value.trim().toLowerCase()
  if (!q) return permissions.value
  return permissions.value.filter((p: any) =>
    (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)
  )
})

function openCreateModal() {
  editingRoleId.value = null
  permSearch.value = ''
  createForm.value = {
    name: '',
    description: '',
    permission_ids: [],
  }
  showCreateModal.value = true
}

function openEditModal(role: any) {
  editingRoleId.value = role.id
  permSearch.value = ''
  createForm.value = {
    name: role.name || '',
    description: role.description || '',
    permission_ids: (role.permissions || []).map((p: any) => p.id),
  }
  showCreateModal.value = true
}

async function fetchRoles() {
  loading.value = true
  try {
    const data = await userApi.listRoles() as any[]
    roles.value = Array.isArray(data) ? data : []
  } catch (err: any) {
    addToast({ type: 'error', title: 'Error', message: err.message })
  } finally {
    loading.value = false
  }
}

async function fetchPermissions() {
  try {
    const data = await userApi.listPermissions() as any[]
    permissions.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Failed to fetch permissions:', e)
  }
}

async function handleCreateRole() {
  saving.value = true
  try {
    if (editingRoleId.value) {
      await userApi.updateRole(editingRoleId.value, {
        description: createForm.value.description,
        permission_ids: createForm.value.permission_ids,
      })
      addToast({ type: 'success', title: 'Role permissions updated' })
    } else {
      await userApi.createRole(createForm.value)
      addToast({ type: 'success', title: 'Role created' })
    }
    showCreateModal.value = false
    await fetchRoles()
  } catch (err: any) {
    addToast({ type: 'error', title: 'Error', message: err.message })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchPermissions()
  await fetchRoles()
})
</script>

