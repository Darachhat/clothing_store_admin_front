// Audit Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AUDIT_LOG_RESPONSE_SCHEMA } from '~/types/api.generated'

export function createAuditService(client: AdminApiClient) {
  return {
    listAuditLogs: (params?: {
      action?: string
      entity_type?: string
      user_id?: string
      skip?: number
      limit?: number
    }) => client.get<AUDIT_LOG_RESPONSE_SCHEMA[]>(API_ENDPOINTS.audit.logs, params as Record<string, unknown>),
  }
}

