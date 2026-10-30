<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Staff & User Accounts</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">Manage store personnel, roles and access credentials</p>
      </div>
      <AppButton
        label="Add User"
        variant="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Users Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="users"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-user-group', label: 'No users found' }"
      >
        <template #cell-username="{ row }">
          <div class="flex items-center gap-2">
            <div class="a-avatar">U</div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ row.full_name }}</p>
              <p class="text-xs text-gray-500 font-mono">@{{ row.username }}</p>
            </div>
          </div>
        </template>

        <template #cell-email="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-300">{{ row.email }}</span>
        </template>

        <template #cell-roles="{ row }">
          <div class="flex flex-wrap gap-1">
            <AppBadge
              v-for="role in row.roles"
              :key="role.id"
              :color="getRoleColor(role.name)"
              :label="role.name"
              size="sm"
              variant="subtle"
            />
          </div>
        </template>

        <template #cell-status="{ row }">
          <AppBadge
            :color="row.status === 'ACTIVE' ? 'emerald' : 'gray'"
            :label="row.status"
            size="sm"
            variant="subtle"
          />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              @click="openEditModal(row)"
            />
            <AppButton
              v-if="row.status === 'ACTIVE'"
              size="sm"
              variant="danger"
              @click="deactivateUser(row)"
            />
          </div>
        </template>
      </AppTable>
    </AppCard>

    <!-- Create User Modal -->
    <AppModal v-model="showCreateModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Create Staff Account</h3>
            <AppButton variant="ghost" size="sm" @click="showCreateModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleCreateUser">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
              <input
                v-model="createForm.username"
                type="text"
                required
                placeholder="e.g. john_doe"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                v-model="createForm.full_name"
                type="text"
                required
                placeholder="e.g. John Doe"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
              <input
                v-model="createForm.email"
                type="email"
                required
                placeholder="john@example.com"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Password *</label>
              <input
                v-model="createForm.password"
                type="password"
                required
                minlength="8"
                placeholder="Min 8 characters"
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Role *</label>
            <select
              v-model="createForm.role_id"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="" disabled>Select assigned role</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Create Account" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Edit User Modal -->
    <AppModal v-model="showEditModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold">Edit User: {{ selectedUser?.username }}</h3>
            <AppButton variant="ghost" size="sm" @click="showEditModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleUpdateUser">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              v-model="editForm.full_name"
              type="text"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              v-model="editForm.email"
              type="email"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Status</label>
            <select
              v-model="editForm.status"
              class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showEditModal = false" />
            <AppButton type="submit" variant="primary" label="Save Changes" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
const userApi = useUserApi()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const users = ref<any[]>([])
const roles = ref<any[]>([])

const columns = [
  { key: 'username', label: 'User' },
  { key: 'email', label: 'Email' },
  { key: 'roles', label: 'Roles' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created', format: (v: string) => new Date(v).toLocaleDateString() },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedUser = ref<any>(null)

const createForm = ref({
  username: '',
  full_name: '',
  email: '',
  password: '',
  role_id: '',
})

const editForm = ref({
  full_name: '',
  email: '',
  status: 'ACTIVE',
})

function getRoleColor(role: string) {
  switch (role) {
    case 'ADMIN': return 'primary'
    case 'MANAGER': return 'purple'
    case 'CASHIER': return 'emerald'
    case 'WAREHOUSE': return 'amber'
    default: return 'gray'
  }
}

function openCreateModal() {
  createForm.value = {
    username: '',
    full_name: '',
    email: '',
    password: '',
    role_id: roles.value[0]?.id || '',
  }
  showCreateModal.value = true
}

function openEditModal(user: any) {
  selectedUser.value = user
  editForm.value = {
    full_name: user.full_name,
    email: user.email,
    status: user.status,
  }
  showEditModal.value = true
}

async function fetchUsers() {
  loading.value = true
  try {
    const data = await userApi.listUsers() as any[]
    users.value = data
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  try {
    const data = await userApi.listRoles() as any[]
    roles.value = data
  } catch (e) {
    console.error('Failed to fetch roles:', e)
  }
}

async function handleCreateUser() {
  saving.value = true
  try {
    await userApi.createUser({
      username: createForm.value.username,
      full_name: createForm.value.full_name,
      email: createForm.value.email,
      password: createForm.value.password,
      role_ids: createForm.value.role_id ? [createForm.value.role_id] : [],
    })
    toast.add({ title: 'Success', description: 'User account created', color: 'green' })
    showCreateModal.value = false
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function handleUpdateUser() {
  if (!selectedUser.value) return
  saving.value = true
  try {
    await userApi.updateUser(selectedUser.value.id, editForm.value)
    toast.add({ title: 'Success', description: 'User updated', color: 'green' })
    showEditModal.value = false
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function deactivateUser(user: any) {
  if (!confirm(`Deactivate user "${user.username}"?`)) return
  try {
    await userApi.deleteUser(user.id)
    toast.add({ title: 'Success', description: `User ${user.username} deactivated`, color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
})
</script>
