import type {
  OrderPaymentMethod,
  OrderShippingMethod,
  OrderStatus,
} from '../types'

const orderDateFormatter = new Intl.DateTimeFormat('es-UY', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
}

const paymentLabels: Record<OrderPaymentMethod, string> = {
  simulated_card: 'Tarjeta simulada',
  simulated_transfer: 'Transferencia simulada',
}

const shippingLabels: Record<OrderShippingMethod, string> = {
  standard: 'Envío estándar',
  express: 'Envío express',
}

export function formatOrderDate(value: string): string {
  return orderDateFormatter.format(new Date(value))
}

export function formatOrderId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}

export function formatUnitCount(quantity: number): string {
  return `${quantity} ${quantity === 1 ? 'producto' : 'productos'}`
}

export function getOrderStatusLabel(status: OrderStatus): string {
  return statusLabels[status]
}

export function getPaymentMethodLabel(method: OrderPaymentMethod): string {
  return paymentLabels[method]
}

export function getShippingMethodLabel(method: OrderShippingMethod): string {
  return shippingLabels[method]
}
