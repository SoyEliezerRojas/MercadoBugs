import { mapDatabaseError } from '../_shared/errors.ts'
import { isAllowedOrigin, jsonResponse, preflightResponse } from '../_shared/http.ts'
import { createAuthenticatedClient } from '../_shared/supabase.ts'

type CouponAction = 'quote' | 'apply' | 'remove'

interface CouponRequest {
  action?: unknown
  code?: unknown
  shippingMethod?: unknown
}

function isCouponAction(value: unknown): value is CouponAction {
  return value === 'quote' || value === 'apply' || value === 'remove'
}

Deno.serve(async (request) => {
  if (!isAllowedOrigin(request)) {
    return jsonResponse(request, { code: 'origin_not_allowed', message: 'Origen no permitido.' }, 403)
  }

  if (request.method === 'OPTIONS') {
    return preflightResponse(request)
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { code: 'method_not_allowed', message: 'Método no permitido.' }, 405)
  }

  const authenticated = await createAuthenticatedClient(request)

  if (!authenticated) {
    return jsonResponse(request, { code: 'auth_required', message: 'Debes iniciar sesión.' }, 401)
  }

  let payload: CouponRequest

  try {
    payload = await request.json() as CouponRequest
  } catch {
    return jsonResponse(request, { code: 'invalid_payload', message: 'El cuerpo debe ser JSON válido.' }, 400)
  }

  if (!isCouponAction(payload.action)) {
    return jsonResponse(request, { code: 'invalid_coupon_action', message: 'Operación de cupón inválida.' }, 400)
  }

  const code = typeof payload.code === 'string' ? payload.code.trim() : null
  const shippingMethod = typeof payload.shippingMethod === 'string' ? payload.shippingMethod : null

  if (payload.action === 'apply' && (!code || code.length > 40)) {
    return jsonResponse(request, { code: 'invalid_coupon_code', message: 'Ingresa un código de cupón válido.' }, 400)
  }

  if (shippingMethod !== null && shippingMethod !== 'standard' && shippingMethod !== 'express') {
    return jsonResponse(request, { code: 'invalid_shipping_method', message: 'Método de envío inválido.' }, 400)
  }

  const { data, error } = await authenticated.client.rpc('manage_cart_coupon', {
    action: payload.action,
    coupon_code: code,
    shipping_method: shippingMethod,
  })

  if (error) {
    const mapped = mapDatabaseError(error, 'No pudimos validar el cupón. Intenta nuevamente.')
    return jsonResponse(request, mapped.body, mapped.status)
  }

  return jsonResponse(request, { pricing: data })
})
