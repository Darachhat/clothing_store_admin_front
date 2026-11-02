// POS Terminals Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { PosTerminal, PosTerminalCreate, PosTerminalUpdate } from '~/types'

export function createTerminalService(client: AdminApiClient) {
  return {
    listTerminals: (params?: { branch_id?: string; status_code?: string }) =>
      client.get<PosTerminal[]>(API_ENDPOINTS.terminals.base, params),

    getTerminal: (id: string) =>
      client.get<PosTerminal>(API_ENDPOINTS.terminals.detail(id)),

    createTerminal: (body: PosTerminalCreate) =>
      client.post<PosTerminal>(API_ENDPOINTS.terminals.base, body),

    updateTerminal: (id: string, body: PosTerminalUpdate) =>
      client.put<PosTerminal>(API_ENDPOINTS.terminals.detail(id), body),

    deleteTerminal: (id: string) =>
      client.delete<{ message: string }>(API_ENDPOINTS.terminals.detail(id)),

    heartbeat: (id: string) =>
      client.post<PosTerminal>(API_ENDPOINTS.terminals.heartbeat(id)),
  }
}

