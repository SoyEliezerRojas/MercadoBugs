import { supabase } from '../../../lib/supabase'
import type { CheckoutPricing, ShippingMethod, ShippingOption } from '../types'
import { CheckoutOperationError } from '../types'
import { functionError, isRecord } from './functionErrors'

type CouponAction = 'quote' | 'apply' | 'remove'

interface CouponRequest {
  action: CouponAction
  code?: string
  shippingMethod?: ShippingMethod
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function readShippingOptions(value: unknown): ShippingOption[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((option) => {
    if (!isRecord(option)) return []
    const method = option.method
    const cost = readNumber(option.cost)

    return (method === 'standard' || method === 'express') && cost !== null
      ? [{ method, cost }]
      : []
  })
}

function readPricing(value: unknown): CheckoutPricing {
  if (!isRecord(value)) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió un resumen inválido.')
  }

  const subtotal = readNumber(value.subtotal)
  const discount = readNumber(value.discount)
  const shippingCost = readNumber(value.shippingCost)
  const total = readNumber(value.total)

  if (subtotal === null || discount === null || shippingCost === null || total === null) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió importes inválidos.')
  }

  let coupon: CheckoutPricing['coupon'] = null

  if (isRecord(value.coupon)) {
    const discountValue = readNumber(value.coupon.discountValue)
    const minimumPurchase = readNumber(value.coupon.minimumPurchase)
    const discountType = value.coupon.discountType

    if (
      typeof value.coupon.code === 'string'
      && (discountType === 'percentage' || discountType === 'fixed')
      && discountValue !== null
      && minimumPurchase !== null
    ) {
      coupon = {
        code: value.coupon.code,
        discountType,
        discountValue,
        minimumPurchase,
      }
    }
  }

  return {
    cartId: typeof value.cartId === 'string' ? value.cartId : null,
    subtotal,
    coupon,
    discount,
    shippingMethod: value.shippingMethod === 'standard' || value.shippingMethod === 'express'
      ? value.shippingMethod
      : null,
    shippingCost,
    shippingOptions: readShippingOptions(value.shippingOptions),
    total,
    notice: typeof value.notice === 'string' ? value.notice : null,
  }
}

async function invokeCoupon(request: CouponRequest): Promise<CheckoutPricing> {
  const { data, error } = await supabase.functions.invoke<unknown>('validate-coupon', { body: request }) as {
    data: unknown
    error: unknown
  }

  if (error) {
    throw await functionError(error, 'No pudimos actualizar el cupón. Intenta nuevamente.')
  }

  if (!isRecord(data)) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió una respuesta inválida.')
  }

  return readPricing(data.pricing)
}

export function getCartPricing(shippingMethod?: ShippingMethod): Promise<CheckoutPricing> {
  return invokeCoupon({ action: 'quote', shippingMethod })
}

export function applyCoupon(code: string, shippingMethod?: ShippingMethod): Promise<CheckoutPricing> {
  return invokeCoupon({ action: 'apply', code, shippingMethod })
}

export function removeCoupon(shippingMethod?: ShippingMethod): Promise<CheckoutPricing> {
  return invokeCoupon({ action: 'remove', shippingMethod })
}
