// System & Telegram Logs Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export function createSystemService(client: AdminApiClient) {
  return {
    listBots: () =>
      client.get(API_ENDPOINTS.system.bots),

    createBot: (body: { code: string; name: string; token: string; status_code?: string }) =>
      client.post(API_ENDPOINTS.system.bots, body),

    sendTestMessage: (body: { chat_id?: string; message: string }) =>
      client.post(API_ENDPOINTS.system.sendTelegram, body),

    listSystemLogs: (params?: { limit?: number; offset?: number }) =>
      client.get(API_ENDPOINTS.system.systemLogs, params as Record<string, unknown>),

    listTelegramOutboundLogs: (params?: { limit?: number }) =>
      client.get(API_ENDPOINTS.system.telegramLogs, params as Record<string, unknown>),
  }
}

