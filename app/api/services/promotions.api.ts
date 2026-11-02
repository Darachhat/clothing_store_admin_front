// Promotions Domain API Service
import type { AdminApiClient } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { Promotion, CouponValidationRequest, CouponValidationResponse } from '~/types/api.generated'

export function createPromotionService(client: AdminApiClient) {
  return {
    listPromotions: (params?: Record<string, unknown>) =>
      client.get<Promotion[]>(API_ENDPOINTS.promotions.base, params),

    createPromotion: (body: unknown) =>
      client.post<Promotion>(API_ENDPOINTS.promotions.base, body),

    getPromotion: (id: string) =>
      client.get<Promotion>(API_ENDPOINTS.promotions.detail(id)),

    updatePromotion: (id: string, body: unknown) =>
      client.put<Promotion>(API_ENDPOINTS.promotions.detail(id), body),

    deletePromotion: (id: string) =>
      client.delete(API_ENDPOINTS.promotions.detail(id)),

    validateCoupon: (body: CouponValidationRequest) =>
      client.post<CouponValidationResponse>(API_ENDPOINTS.promotions.validate, body),
  }
}

