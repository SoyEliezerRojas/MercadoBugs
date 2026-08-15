import { supabase } from '../../../lib/supabase'
import type { CheckoutOrder, CheckoutPayload, PaymentMethod, ShippingMethod } from '../types'
import { CheckoutOperationError } from '../types'
import { functionError, isRecord } from './functionErrors'

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function isShippingMethod(value: unknown): value is ShippingMethod {
  return value === 'standard' || value === 'express'
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'simulated_card' || value === 'simulated_transfer'
}

function readOrder(value: unknown): CheckoutOrder {
  if (!isRecord(value)) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió un pedido inválido.')
  }

  const subtotal = readNumber(value.subtotal)
  const discount = readNumber(value.discount)
  const shippingCost = readNumber(value.shippingCost)
  const total = readNumber(value.total)

  if (
    typeof value.id !== 'string'
    || value.status !== 'confirmed'
    || subtotal === null
    || discount === null
    || shippingCost === null
    || total === null
    || !isShippingMethod(value.shippingMethod)
    || !isPaymentMethod(value.paymentMethod)
    || typeof value.checkoutRequestId !== 'string'
    || typeof value.createdAt !== 'string'
  ) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió un pedido incompleto.')
  }

  return {
    id: value.id,
    status: value.status,
    subtotal,
    discount,
    shippingCost,
    total,
    couponCode: typeof value.couponCode === 'string' ? value.couponCode : null,
    shippingMethod: value.shippingMethod,
    paymentMethod: value.paymentMethod,
    checkoutRequestId: value.checkoutRequestId,
    createdAt: value.createdAt,
    idempotentReplay: value.idempotentReplay === true,
  }
}

export async function performCheckout(payload: CheckoutPayload): Promise<CheckoutOrder> {
  const { data, error } = await supabase.functions.invoke<unknown>('checkout', { body: payload }) as {
    data: unknown
    error: unknown
  }

  if (error) {
    throw await functionError(error, 'No pudimos procesar tu compra. Intenta nuevamente.')
  }

  if (!isRecord(data)) {
    throw new CheckoutOperationError('invalid_response', 'El servidor devolvió una respuesta inválida.')
  }

  return readOrder(data.order)
}
