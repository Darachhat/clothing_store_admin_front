<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Roles & Permissions (RBAC)</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Configure role-based access control and system privileges</p>
      </div>
      <AppButton
        label="Add Role"
        variant="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Roles Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="roles"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-shield-check', label: 'No roles found' }"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-bold text-gray-900 dark:text-white">{{ row.name }}</span>
            <AppBadge v-if="row.is_system" variant="default" size="sm" label="System" />
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="text-sm text-gray-500">{{ row.description || 'No description' }}</span>
        </template>

        <template #cell-permissions="{ row }">
          <div class="flex flex-wrap gap-1 max-w-md">
            <AppBadge
              v-for="perm in (row.permissions || []).slice(0, 4)"
              :key="perm.id"
              variant="primary" :label="perm.code"
              size="sm"
            />
            <span v-if="(row.permissions || []).length > 4" class="text-xs text-gray-400 self-center">
              +{{ (row.permissions || []).length - 4 }} more
            </span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <AppButton
            size="sm"
            variant="ghost"
            icon="i-heroicons-pencil-square"
            label="Edit Permissions"
            @click="openEditModal(row)"
          />
        </template>
      </AppTable>
    </AppCard>

    <!-- Create / Edit Role Modal -->
    <AppModal v-model="showCreateModal" :ui="{ width: 'sm:max-w-xl' }">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">{{ editingRoleId ? 'Edit Role & Permissions' : 'Create Custom Role' }}</h3>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateRole">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role Name *</label>
            <input
              v-model="createForm.name"
              type="text"
              required
              placeholder="e.g. INVENTORY_CLERK"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm uppercase"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <input
              v-model="createForm.description"
              type="text"
              placeholder="Brief description of responsibilities"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Granted Permissions</label>
            <div class="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label
                v-for="perm in permissions"
                :key="perm.id"
                class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <input
                  v-model="createForm.permission_ids"
                  type="checkbox"
                  :value="perm.id"
                  class="rounded text-primary-600 focus:ring-primary-500"
                />
                <span>{{ perm.name }} ({{ perm.code }})</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Save Role" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const userApi = useUserApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const roles = ref<any[]>([])
const permissions = ref<any[]>([])

const columns = [
  { key: 'name', label: 'Role' },
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

function openCreateModal() {
  editingRoleId.value = null
  createForm.value = {
    name: '',
    description: '',
    permission_ids: [],
  }
  showCreateModal.value = true
}

function openEditModal(role: any) {
  editingRoleId.value = role.id
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
    roles.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchPermissions() {
  try {
    const data = await userApi.listPermissions() as any[]
    permissions.value = data
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
      toast.add({ title: 'Success', description: 'Role permissions updated successfully', color: 'green' })
    } else {
      await userApi.createRole(createForm.value)
      toast.add({ title: 'Success', description: 'Role created successfully', color: 'green' })
    }
    showCreateModal.value = false
    await fetchRoles()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchPermissions()
  await fetchRoles()
})
</script>
