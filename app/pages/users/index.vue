<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Staff &amp; User Accounts</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Manage account identities, verified phone numbers, Telegram linking, and multi-role assignments
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton
          label="My Identity & Security"
          variant="secondary"
          icon="i-heroicons-finger-print"
          @click="openSelfSecurityModal"
        />
        <AppButton
          label="Add User"
          variant="primary"
          icon="i-heroicons-plus"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <AppCard>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="md:col-span-2 relative">
          <UIcon
            name="i-heroicons-magnifying-glass"
            class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search by name, @username, phone (+855...), email, or Telegram ID..."
            class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white outline-none"
            @input="debouncedFetchUsers"
          />
          <button
            v-if="filters.search"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="clearSearch"
          >
            <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
        </div>

        <div>
          <select
            v-model="filters.role"
            class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            @change="fetchUsers"
          >
            <option value="">All Roles</option>
            <option v-for="r in roles" :key="r.id" :value="r.name">{{ r.name }}</option>
          </select>
        </div>

        <div class="flex gap-2">
          <select
            v-model="filters.status"
            class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            @change="fetchUsers"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          <select
            v-model="filters.identityFilter"
            class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none"
            @change="fetchUsers"
          >
            <option value="">All Identities</option>
            <option value="phone_verified">Phone Verified</option>
            <option value="telegram_linked">Telegram Linked</option>
          </select>
        </div>
      </div>
    </AppCard>

    <!-- Users Table -->
    <AppCard>
      <AppTable
        :columns="columns"
        :rows="users"
        :loading="loading"
        :empty-state="{ icon: 'i-heroicons-user-group', label: 'No matching user accounts found' }"
      >
        <!-- 1. Account Identity -->
        <template #cell-username="{ row }">
          <div class="flex items-center gap-2.5">
            <div class="a-avatar">{{ getInitials(row.full_name || row.username) }}</div>
            <div>
              <div class="flex items-center gap-1.5">
                <p class="font-medium text-gray-900 dark:text-white">{{ row.full_name }}</p>
                <span
                  v-if="row.employee_code"
                  class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                >
                  {{ row.employee_code }}
                </span>
              </div>
              <p class="text-xs text-gray-500 font-mono">@{{ row.username }} &middot; {{ row.email }}</p>
            </div>
          </div>
        </template>

        <!-- 2. Verified Phone Number -->
        <template #cell-phone_number="{ row }">
          <div v-if="row.phone_number" class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5 text-sm font-mono text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5 text-gray-400" />
              <span>{{ row.phone_number }}</span>
            </div>
            <div class="flex items-center gap-1">
              <AppBadge
                :color="row.phone_verified ? 'emerald' : 'amber'"
                :label="row.phone_verified ? 'Verified' : 'Unverified'"
                size="sm"
                variant="subtle"
              />
            </div>
          </div>
          <span v-else class="text-xs text-gray-400">Not linked</span>
        </template>

        <!-- 3. Telegram Identity -->
        <template #cell-telegram="{ row }">
          <div v-if="row.telegram_id" class="flex flex-col gap-0.5">
            <div class="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-white">
              <UIcon name="i-heroicons-paper-airplane" class="w-3.5 h-3.5 text-gray-500" />
              <span>{{ row.telegram_username ? `@${row.telegram_username}` : 'Linked' }}</span>
            </div>
            <span class="text-[11px] font-mono text-gray-500">ID: {{ row.telegram_id }}</span>
            <span v-if="row.telegram_linked_at" class="text-[10px] text-gray-400">
              Linked {{ formatShortDate(row.telegram_linked_at) }}
            </span>
          </div>
          <span v-else class="text-xs text-gray-400">Not linked</span>
        </template>

        <!-- 4. Assigned Roles -->
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
            <span v-if="!row.roles || row.roles.length === 0" class="text-xs text-gray-400">No roles</span>
          </div>
        </template>

        <!-- 5. Account Status -->
        <template #cell-status="{ row }">
          <div class="flex flex-col gap-0.5">
            <AppBadge
              :color="row.status === 'ACTIVE' ? 'emerald' : 'gray'"
              :label="row.status"
              size="sm"
              variant="subtle"
            />
            <span v-if="row.last_login_at" class="text-[11px] text-gray-400">
              Last login: {{ formatShortDate(row.last_login_at) }}
            </span>
          </div>
        </template>

        <!-- 6. Actions -->
        <template #cell-actions="{ row }">
          <div class="flex items-center gap-1">
            <AppButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              label="Roles & Edit"
              @click="openEditModal(row)"
            />
            <AppButton
              size="sm"
              variant="ghost"
              icon="i-heroicons-clock"
              label="History"
              @click="openHistoryModal(row)"
            />
            <AppButton
              v-if="row.status === 'ACTIVE' && row.id !== authStore.currentUser?.id"
              size="sm"
              variant="danger"
              icon="i-heroicons-no-symbol"
              label="Deactivate"
              @click="deactivateUser(row)"
            />
            <AppButton
              v-else-if="row.status !== 'ACTIVE'"
              size="sm"
              variant="secondary"
              icon="i-heroicons-check-circle"
              label="Activate"
              @click="activateUser(row)"
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
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showCreateModal = false" />
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
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                v-model="createForm.full_name"
                type="text"
                required
                placeholder="e.g. John Doe"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
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
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Code</label>
              <input
                v-model="createForm.employee_code"
                type="text"
                placeholder="e.g. EMP-004"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (E.164)</label>
              <input
                v-model="createForm.phone_number"
                type="text"
                placeholder="+85569382165"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
              />
              <label v-if="createForm.phone_number" class="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600 cursor-pointer">
                <input v-model="createForm.phone_verified" type="checkbox" />
                <span>Mark phone number as verified</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Roles (Multi-Role Supported) *</label>
            <div class="grid grid-cols-2 gap-2 p-2.5 border border-gray-200 rounded-md">
              <label
                v-for="r in roles"
                :key="r.id"
                class="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-200 cursor-pointer p-1"
              >
                <input
                  v-model="createForm.role_ids"
                  type="checkbox"
                  :value="r.id"
                  :disabled="r.name === 'ADMIN' && !authStore.isAdmin"
                  class="mt-0.5"
                />
                <div>
                  <div class="font-semibold">{{ r.name }}</div>
                  <div class="text-[11px] text-gray-500">{{ r.permissions?.length || 0 }} permissions</div>
                </div>
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showCreateModal = false" />
            <AppButton type="submit" variant="primary" label="Create Account" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Edit User & Role Management Modal -->
    <AppModal v-model="showEditModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold">Manage User &amp; Roles: @{{ selectedUser?.username }}</h3>
              <p class="text-xs text-gray-500 font-mono">ID: {{ selectedUser?.id }}</p>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showEditModal = false" />
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="handleUpdateUser">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                v-model="editForm.full_name"
                type="text"
                required
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Code</label>
              <input
                v-model="editForm.employee_code"
                type="text"
                placeholder="EMP-001"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                v-model="editForm.email"
                type="email"
                required
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Normalized E.164)</label>
              <input
                v-model="editForm.phone_number"
                type="text"
                placeholder="+85569382165"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono"
              />
              <label class="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600 cursor-pointer">
                <input v-model="editForm.phone_verified" type="checkbox" :disabled="!editForm.phone_number" />
                <span>Verified phone ownership</span>
              </label>
            </div>
          </div>

          <!-- Telegram Identity Summary -->
          <div class="p-3 rounded-md border border-gray-200 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-gray-500" />
              <div class="text-xs">
                <div class="font-medium text-gray-900 dark:text-white">Telegram External Identity</div>
                <div v-if="selectedUser?.telegram_id && !editForm.unlink_telegram" class="text-gray-500 font-mono">
                  Linked: {{ selectedUser.telegram_username ? `@${selectedUser.telegram_username}` : '' }} (ID: {{ selectedUser.telegram_id }})
                  <span v-if="selectedUser.telegram_linked_at" class="block text-[11px] text-gray-400 font-sans">
                    Linked at: {{ formatDateTime(selectedUser.telegram_linked_at) }}
                  </span>
                </div>
                <div v-else class="text-gray-400">No Telegram account linked</div>
              </div>
            </div>
            <AppButton
              v-if="selectedUser?.telegram_id && !editForm.unlink_telegram"
              size="sm"
              variant="ghost"
              icon="i-heroicons-link-slash"
              label="Unlink Telegram"
              @click="editForm.unlink_telegram = true"
            />
            <span v-else-if="editForm.unlink_telegram" class="text-xs text-gray-500">Will unlink on save</span>
          </div>

          <!-- Multi-Role Assignment -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Assigned Roles</label>
              <span v-if="isEditingSelf" class="text-[11px] text-gray-500 flex items-center gap-1">
                <UIcon name="i-heroicons-lock-closed" class="w-3.5 h-3.5" />
                Self-role modification is locked
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 p-2.5 border border-gray-200 rounded-md">
              <label
                v-for="r in roles"
                :key="r.id"
                class="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-200 p-1"
                :class="isEditingSelf || (r.name === 'ADMIN' && !authStore.isAdmin) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'"
              >
                <input
                  v-model="editForm.role_ids"
                  type="checkbox"
                  :value="r.id"
                  :disabled="isEditingSelf || (r.name === 'ADMIN' && !authStore.isAdmin)"
                  class="mt-0.5"
                />
                <div>
                  <div class="font-semibold">{{ r.name }}</div>
                  <div class="text-[11px] text-gray-500">{{ r.description || `${r.permissions?.length || 0} permissions` }}</div>
                </div>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Account Status</label>
              <select
                v-model="editForm.status"
                :disabled="isEditingSelf"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reset Password (Optional)</label>
              <input
                v-model="editForm.password"
                type="password"
                minlength="8"
                placeholder="Leave blank to keep existing"
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <AppButton variant="ghost" label="Cancel" @click="showEditModal = false" />
            <AppButton type="submit" variant="primary" label="Save Changes" :loading="saving" />
          </div>
        </form>
      </AppCard>
    </AppModal>

    <!-- Role & Account Audit History Modal -->
    <AppModal v-model="showHistoryModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold">Role &amp; Account History: @{{ historyUser?.username }}</h3>
              <p class="text-xs text-gray-500">{{ historyUser?.full_name }}</p>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showHistoryModal = false" />
          </div>
        </template>

        <div v-if="historyLoading" class="py-8 text-center text-sm text-gray-500">
          Loading audit history...
        </div>
        <div v-else-if="roleHistory.length === 0" class="py-8 text-center text-sm text-gray-400">
          No audit records found for this user.
        </div>
        <div v-else class="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          <div
            v-for="item in roleHistory"
            :key="item.id"
            class="p-3 rounded-md border border-gray-200 bg-gray-50 dark:bg-gray-800/40 text-xs space-y-1"
          >
            <div class="flex items-center justify-between">
              <AppBadge :label="item.action" color="primary" size="sm" variant="subtle" />
              <span class="text-gray-400 font-mono">{{ formatDateTime(item.created_at || item.created_datetime) }}</span>
            </div>
            <div v-if="item.old_data?.roles || item.new_data?.roles" class="text-gray-700 dark:text-gray-200">
              <span class="text-gray-500">Roles:</span>
              <span class="font-mono ml-1">{{ (item.old_data?.roles || []).join(', ') || 'None' }}</span>
              <UIcon name="i-heroicons-arrow-right" class="w-3 h-3 inline mx-1" />
              <span class="font-mono font-semibold">{{ (item.new_data?.roles || []).join(', ') || 'None' }}</span>
            </div>
            <div v-if="item.new_data?.phone_number" class="text-gray-600 dark:text-gray-300 font-mono">
              Phone: {{ item.new_data.phone_number }}
            </div>
            <div v-if="item.new_data?.telegram_id" class="text-gray-600 dark:text-gray-300 font-mono">
              Telegram ID: {{ item.new_data.telegram_id }}
            </div>
          </div>
        </div>
      </AppCard>
    </AppModal>

    <!-- My Identity & Security Modal (Link Telegram / Verify Phone via OTP) -->
    <AppModal v-model="showSelfSecurityModal">
      <AppCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-base font-semibold">My Identity &amp; Verification</h3>
              <p class="text-xs text-gray-500">Link your verified phone number and Telegram account</p>
            </div>
            <AppButton variant="ghost" size="sm" icon="i-heroicons-x-mark" @click="showSelfSecurityModal = false" />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Verified Phone Section -->
          <div class="p-3 rounded-md border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-500" />
                <span class="text-sm font-medium">Verified Phone Number</span>
              </div>
              <AppBadge
                :color="authStore.currentUser?.phone_verified ? 'emerald' : 'gray'"
                :label="authStore.currentUser?.phone_verified ? `Verified (${authStore.currentUser?.phone_number})` : 'Unverified'"
                size="sm"
                variant="subtle"
              />
            </div>

            <div class="flex gap-2">
              <input
                v-model="selfPhoneForm.phone_number"
                type="text"
                placeholder="+85569382165 or 069382165"
                class="flex-1 rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-mono"
              />
              <AppButton
                size="sm"
                variant="secondary"
                label="Send OTP"
                :loading="selfSecurityLoading"
                @click="handleRequestPhoneOtp"
              />
            </div>

            <div v-if="selfPhoneForm.challengeSent" class="flex gap-2 pt-1">
              <input
                v-model="selfPhoneForm.otp_code"
                type="text"
                maxlength="6"
                placeholder="Enter 6-digit OTP code"
                class="flex-1 rounded-md border border-gray-200 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm font-mono"
              />
              <AppButton
                size="sm"
                variant="primary"
                label="Verify & Link"
                :loading="selfSecurityLoading"
                @click="handleConfirmPhoneOtp"
              />
            </div>
          </div>

          <!-- Telegram Identity Section -->
          <div class="p-3 rounded-md border border-gray-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-paper-airplane" class="w-4 h-4 text-gray-500" />
                <span class="text-sm font-medium">Telegram Account</span>
              </div>
              <AppBadge
                :color="authStore.currentUser?.telegram_id ? 'emerald' : 'gray'"
                :label="authStore.currentUser?.telegram_id ? `Linked (ID: ${authStore.currentUser?.telegram_id})` : 'Not Linked'"
                size="sm"
                variant="subtle"
              />
            </div>

            <div v-if="authStore.currentUser?.telegram_id" class="flex items-center justify-between text-xs text-gray-600">
              <span>
                Connected as
                <strong>{{ authStore.currentUser.telegram_username ? `@${authStore.currentUser.telegram_username}` : authStore.currentUser.telegram_id }}</strong>
              </span>
              <AppButton
                size="sm"
                variant="danger"
                icon="i-heroicons-link-slash"
                label="Unlink"
                :loading="selfSecurityLoading"
                @click="handleSelfUnlinkTelegram"
              />
            </div>
            <div v-else class="space-y-2">
              <p class="text-xs text-gray-500">
                Paste a signed Telegram Login verification payload to link your Telegram identity:
              </p>
              <textarea
                v-model="selfTelegramJson"
                rows="3"
                placeholder='{"id": 123456789, "first_name": "Admin", "username": "admin_tg", "auth_date": 1730000000, "hash": "..."}'
                class="w-full rounded-md border border-gray-200 bg-white dark:bg-gray-800 p-2 text-xs font-mono"
              />
              <AppButton
                size="sm"
                variant="primary"
                icon="i-heroicons-check-badge"
                label="Verify & Link Telegram"
                :loading="selfSecurityLoading"
                @click="handleSelfLinkTelegram"
              />
            </div>
          </div>
        </div>
      </AppCard>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const userApi = useUserApi()
const authStore = useAuthStore()
const toast = useAppToast()

const loading = ref(false)
const saving = ref(false)
const users = ref<any[]>([])
const roles = ref<any[]>([])

const filters = reactive({
  search: '',
  role: '',
  status: '',
  identityFilter: '',
})

const columns = [
  { key: 'username', label: 'Account Identity' },
  { key: 'phone_number', label: 'Verified Phone' },
  { key: 'telegram', label: 'Telegram Identity' },
  { key: 'roles', label: 'Assigned Roles' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showHistoryModal = ref(false)
const showSelfSecurityModal = ref(false)

const selectedUser = ref<any>(null)
const historyUser = ref<any>(null)
const roleHistory = ref<any[]>([])
const historyLoading = ref(false)
const selfSecurityLoading = ref(false)

const isEditingSelf = computed(() => {
  return Boolean(selectedUser.value && authStore.currentUser && selectedUser.value.id === authStore.currentUser.id)
})

const createForm = ref({
  username: '',
  full_name: '',
  email: '',
  password: '',
  employee_code: '',
  phone_number: '',
  phone_verified: false,
  role_ids: [] as string[],
})

const editForm = ref({
  full_name: '',
  email: '',
  employee_code: '',
  phone_number: '',
  phone_verified: false,
  unlink_telegram: false,
  status: 'ACTIVE',
  password: '',
  role_ids: [] as string[],
})

const selfPhoneForm = reactive({
  phone_number: '',
  otp_code: '',
  challengeSent: false,
})
const selfTelegramJson = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null
function debouncedFetchUsers() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchUsers()
  }, 250)
}

function clearSearch() {
  filters.search = ''
  fetchUsers()
}

function getInitials(name: string): string {
  return (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U'
}

function formatShortDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return ''
  }
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return String(iso)
  }
}

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
  const defaultRole = roles.value.find((r: any) => r.name === 'CASHIER') || roles.value[0]
  createForm.value = {
    username: '',
    full_name: '',
    email: '',
    password: '',
    employee_code: '',
    phone_number: '',
    phone_verified: false,
    role_ids: defaultRole ? [defaultRole.id] : [],
  }
  showCreateModal.value = true
}

function openEditModal(user: any) {
  selectedUser.value = user
  editForm.value = {
    full_name: user.full_name || '',
    email: user.email || '',
    employee_code: user.employee_code || '',
    phone_number: user.phone_number || '',
    phone_verified: Boolean(user.phone_verified),
    unlink_telegram: false,
    status: user.status || 'ACTIVE',
    password: '',
    role_ids: (user.roles || []).map((r: any) => r.id),
  }
  showEditModal.value = true
}

async function openHistoryModal(user: any) {
  historyUser.value = user
  roleHistory.value = []
  showHistoryModal.value = true
  historyLoading.value = true
  try {
    roleHistory.value = await userApi.getUserRoleHistory(user.id)
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to load history', color: 'red' })
  } finally {
    historyLoading.value = false
  }
}

function openSelfSecurityModal() {
  selfPhoneForm.phone_number = authStore.currentUser?.phone_number || ''
  selfPhoneForm.otp_code = ''
  selfPhoneForm.challengeSent = false
  selfTelegramJson.value = ''
  showSelfSecurityModal.value = true
}

async function fetchUsers() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (filters.search.trim()) params.search = filters.search.trim()
    if (filters.role) params.role = filters.role
    if (filters.status) params.status = filters.status
    if (filters.identityFilter === 'phone_verified') params.phone_verified = true
    if (filters.identityFilter === 'telegram_linked') params.telegram_linked = true

    const data = await userApi.listUsers(params) as any[]
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
  if (createForm.value.role_ids.length === 0) {
    toast.add({ title: 'Validation', description: 'Select at least one role', color: 'amber' })
    return
  }
  saving.value = true
  try {
    await userApi.createUser({
      username: createForm.value.username,
      full_name: createForm.value.full_name,
      email: createForm.value.email,
      password: createForm.value.password,
      employee_code: createForm.value.employee_code || undefined,
      phone_number: createForm.value.phone_number || undefined,
      phone_verified: createForm.value.phone_verified,
      role_ids: createForm.value.role_ids,
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
    const body: Record<string, unknown> = {
      full_name: editForm.value.full_name,
      email: editForm.value.email,
      employee_code: editForm.value.employee_code || null,
      phone_number: editForm.value.phone_number,
      phone_verified: editForm.value.phone_verified,
      status: editForm.value.status,
    }
    if (!isEditingSelf.value) {
      body.role_ids = editForm.value.role_ids
    }
    if (editForm.value.unlink_telegram) {
      body.unlink_telegram = true
    }
    if (editForm.value.password && editForm.value.password.trim()) {
      body.password = editForm.value.password.trim()
    }

    await userApi.updateUser(selectedUser.value.id, body)
    toast.add({ title: 'Success', description: 'User account & roles updated', color: 'green' })
    showEditModal.value = false
    await fetchUsers()
    if (isEditingSelf.value) {
      await authStore.fetchCurrentUser()
    }
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  } finally {
    saving.value = false
  }
}

async function deactivateUser(user: any) {
  if (!confirm(`Deactivate user "${user.username}"? Active sessions will be revoked immediately.`)) return
  try {
    await userApi.deleteUser(user.id)
    toast.add({ title: 'Success', description: `User ${user.username} deactivated`, color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

async function activateUser(user: any) {
  try {
    await userApi.activateUser(user.id)
    toast.add({ title: 'Success', description: `User ${user.username} activated`, color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message, color: 'red' })
  }
}

async function handleRequestPhoneOtp() {
  if (!selfPhoneForm.phone_number.trim()) return
  selfSecurityLoading.value = true
  try {
    const res = await authStore.requestPhoneVerification(selfPhoneForm.phone_number.trim())
    selfPhoneForm.phone_number = res.normalized_phone
    selfPhoneForm.challengeSent = true
    toast.add({ title: 'OTP Sent', description: res.message, color: 'green' })
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    selfSecurityLoading.value = false
  }
}

async function handleConfirmPhoneOtp() {
  if (!selfPhoneForm.phone_number.trim() || !selfPhoneForm.otp_code.trim()) return
  selfSecurityLoading.value = true
  try {
    await authStore.verifyPhone(selfPhoneForm.phone_number.trim(), selfPhoneForm.otp_code.trim())
    selfPhoneForm.challengeSent = false
    selfPhoneForm.otp_code = ''
    toast.add({ title: 'Phone Verified', description: 'Phone number verified and linked to your account', color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    selfSecurityLoading.value = false
  }
}

async function handleSelfLinkTelegram() {
  if (!selfTelegramJson.value.trim()) return
  selfSecurityLoading.value = true
  try {
    const payload = JSON.parse(selfTelegramJson.value)
    await authStore.linkTelegram(payload)
    selfTelegramJson.value = ''
    toast.add({ title: 'Telegram Linked', description: 'Telegram identity verified and linked', color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message || 'Invalid Telegram payload', color: 'red' })
  } finally {
    selfSecurityLoading.value = false
  }
}

async function handleSelfUnlinkTelegram() {
  selfSecurityLoading.value = true
  try {
    await authStore.unlinkTelegram()
    toast.add({ title: 'Telegram Unlinked', description: 'Telegram identity removed from your account', color: 'green' })
    await fetchUsers()
  } catch (err: any) {
    toast.add({ title: 'Error', description: err?.data?.detail || err.message, color: 'red' })
  } finally {
    selfSecurityLoading.value = false
  }
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
})
</script>
