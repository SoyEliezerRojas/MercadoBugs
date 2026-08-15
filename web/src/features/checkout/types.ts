export type ShippingMethod = 'standard' | 'express'
export type PaymentMethod = 'simulated_card' | 'simulated_transfer'

export interface AppliedCoupon {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumPurchase: number
}

export interface ShippingOption {
  method: ShippingMethod
  cost: number
}

export interface CheckoutPricing {
  cartId: string | null
  subtotal: number
  coupon: AppliedCoupon | null
  discount: number
  shippingMethod: ShippingMethod | null
  shippingCost: number
  shippingOptions: ShippingOption[]
  total: number
  notice: string | null
}

export interface CheckoutOrder {
  id: string
  status: 'confirmed'
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  couponCode: string | null
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
  checkoutRequestId: string
  createdAt: string
  idempotentReplay: boolean
}

export interface CheckoutPayload {
  checkoutRequestId: string
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
}

export interface OrderConfirmation {
  id: string
  status: string
  total: number
  couponCode: string | null
  shippingMethod: string
  paymentMethod: string
  createdAt: string
}

export class CheckoutOperationError extends Error {
  code: string
  details: Record<string, unknown> | null

  constructor(code: string, message: string, details: Record<string, unknown> | null = null) {
    super(message)
    this.name = 'CheckoutOperationError'
    this.code = code
    this.details = details
  }
}
