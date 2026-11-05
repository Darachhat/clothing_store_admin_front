// Users & Roles Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { User, Role, Permission } from '~/types/api.generated'

export function createUserService(client: AdminApiClient) {
  return {
    listUsers: (params?: Record<string, unknown>) =>
      client.get<User[]>(API_ENDPOINTS.users.base, params),

    getUser: (id: string) =>
      client.get<User>(API_ENDPOINTS.users.detail(id)),

    createUser: (body: unknown) =>
      client.post<User>(API_ENDPOINTS.users.base, body),

    updateUser: (id: string, body: unknown) =>
      client.patch<User>(API_ENDPOINTS.users.detail(id), body),

    deleteUser: (id: string) =>
      client.delete(API_ENDPOINTS.users.detail(id)),

    activateUser: (id: string) =>
      client.post<User>(API_ENDPOINTS.users.activate(id), {}),

    getUserRoleHistory: (id: string, limit = 50) =>
      client.get<any[]>(API_ENDPOINTS.users.roleHistory(id), { limit }),

    listRoles: () =>
      client.get<Role[]>(API_ENDPOINTS.users.roles),

    createRole: (body: unknown) =>
      client.post<Role>(API_ENDPOINTS.users.roles, body),

    updateRole: (id: string, body: unknown) =>
      client.patch<Role>(API_ENDPOINTS.users.roleDetail(id), body),

    listPermissions: () =>
      client.get<Permission[]>(API_ENDPOINTS.users.permissions),
  }
}

