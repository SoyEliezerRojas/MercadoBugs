import { mapDatabaseError } from '../_shared/errors.ts'
import { isAllowedOrigin, jsonResponse, preflightResponse } from '../_shared/http.ts'
import { createAuthenticatedClient } from '../_shared/supabase.ts'

interface CheckoutRequest {
  checkoutRequestId?: unknown
  paymentMethod?: unknown
  shippingAddress?: unknown
  shippingCity?: unknown
  shippingMethod?: unknown
  shippingName?: unknown
  shippingPostalCode?: unknown
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readText(value: unknown, minimum: number, maximum: number): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length >= minimum && normalized.length <= maximum ? normalized : null
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

  let payload: CheckoutRequest

  try {
    payload = await request.json() as CheckoutRequest
  } catch {
    return jsonResponse(request, { code: 'invalid_payload', message: 'El cuerpo debe ser JSON válido.' }, 400)
  }

  const checkoutRequestId = typeof payload.checkoutRequestId === 'string'
    && uuidPattern.test(payload.checkoutRequestId)
    ? payload.checkoutRequestId
    : null
  const shippingName = readText(payload.shippingName, 2, 100)
  const shippingAddress = readText(payload.shippingAddress, 5, 200)
  const shippingCity = readText(payload.shippingCity, 2, 100)
  const shippingPostalCode = readText(payload.shippingPostalCode, 2, 20)
  const shippingMethod = payload.shippingMethod === 'standard' || payload.shippingMethod === 'express'
    ? payload.shippingMethod
    : null
  const paymentMethod = payload.paymentMethod === 'simulated_card'
    || payload.paymentMethod === 'simulated_transfer'
    ? payload.paymentMethod
    : null

  if (!checkoutRequestId) {
    return jsonResponse(request, { code: 'invalid_checkout_request_id', message: 'Identificador de compra inválido.' }, 400)
  }

  if (!shippingName || !shippingAddress || !shippingCity || !shippingPostalCode) {
    return jsonResponse(request, { code: 'invalid_shipping_data', message: 'Revisa los datos de envío.' }, 400)
  }

  if (!shippingMethod) {
    return jsonResponse(request, { code: 'invalid_shipping_method', message: 'Selecciona un método de envío válido.' }, 400)
  }

  if (!paymentMethod) {
    return jsonResponse(request, { code: 'invalid_payment_method', message: 'Selecciona un método de pago válido.' }, 400)
  }

  const { data, error } = await authenticated.client.rpc('perform_checkout', {
    checkout_request_id: checkoutRequestId,
    payment_method: paymentMethod,
    shipping_address: shippingAddress,
    shipping_city: shippingCity,
    shipping_method: shippingMethod,
    shipping_name: shippingName,
    shipping_postal_code: shippingPostalCode,
  })

  if (error) {
    const mapped = mapDatabaseError(error, 'No pudimos procesar tu compra. Intenta nuevamente.')
    return jsonResponse(request, mapped.body, mapped.status)
  }

  return jsonResponse(request, { order: data })
})
