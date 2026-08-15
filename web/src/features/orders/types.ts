export type OrderStatus = 'pending' | 'confirmed' | 'cancelled'
export type OrderShippingMethod = 'standard' | 'express'
export type OrderPaymentMethod = 'simulated_card' | 'simulated_transfer'

export interface OrderListItem {
  id: string
  status: OrderStatus
  total: number
  totalUnits: number
  paymentMethod: OrderPaymentMethod
  createdAt: string
}

export interface OrderItemSnapshot {
  id: string
  productId: string | null
  productName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  createdAt: string
}

export interface OrderDetail {
  id: string
  status: OrderStatus
  subtotal: number
  discount: number
  shippingCost: number
  total: number
  couponCode: string | null
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingMethod: OrderShippingMethod
  paymentMethod: OrderPaymentMethod
  createdAt: string
  items: OrderItemSnapshot[]
}
