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
          <div class="role-name-cell">
            <span class="role-name">{{ row.name }}</span>
            <AppBadge v-if="row.is_system" color="default" size="sm">System</AppBadge>
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="role-desc">{{ row.description || 'No description' }}</span>
        </template>

        <template #cell-permissions="{ row }">
          <div class="perm-chips">
            <AppBadge
              v-for="perm in (row.permissions || []).slice(0, 4)"
              :key="perm.id"
              color="indigo"
              size="sm"
            >
              {{ perm.code }}
            </AppBadge>
            <span v-if="(row.permissions || []).length > 4" class="perm-more">
              +{{ (row.permissions || []).length - 4 }} more
            </span>
            <span v-if="!(row.permissions || []).length" class="role-desc">No permissions</span>
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
          <div class="perm-header-row">
            <label class="field-label">Granted Permissions ({{ createForm.permission_ids.length }} selected)</label>
            <input
              v-model="permSearch"
              type="text"
              placeholder="Filter permissions..."
              class="perm-search-input"
            />
          </div>
          <div class="perm-checklist">
            <label
              v-for="perm in filteredPermissions"
              :key="perm.id"
              class="perm-check-item"
            >
              <input
                v-model="createForm.permission_ids"
                type="checkbox"
                :value="perm.id"
              />
              <div class="perm-check-text">
                <span class="perm-check-name">{{ perm.name }}</span>
                <span class="perm-check-code">{{ perm.code }}</span>
              </div>
            </label>
            <div v-if="!filteredPermissions.length" class="perm-empty">
              No permissions match "{{ permSearch }}"
            </div>
          </div>
        </div>

        <div class="modal-actions">
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

<style scoped>
.role-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-name {
  font-weight: 600;
  color: var(--text-primary);
}

.role-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.perm-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  max-width: 460px;
}

.perm-more {
  font-size: 11.5px;
  color: var(--text-tertiary);
  margin-left: 4px;
}

.perm-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

.perm-search-input {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
  background: var(--surface-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  outline: none;
  width: 180px;
}

.perm-checklist {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
  padding: 10px;
  background: var(--surface-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

@media (max-width: 640px) {
  .perm-checklist {
    grid-template-columns: 1fr;
  }
}

.perm-check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.perm-check-item:hover {
  background: var(--surface-hover);
}

.perm-check-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.perm-check-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.perm-check-code {
  font-size: 11px;
  font-family: var(--font-mono, monospace);
  color: var(--text-tertiary);
}

.perm-empty {
  grid-column: 1 / -1;
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}
</style>
