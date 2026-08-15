import type { OrderStatus } from '../types'
import { getOrderStatusLabel } from '../utils/orderPresentation'

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={`order-status order-status--${status}`}>
      {getOrderStatusLabel(status)}
    </span>
  )
}
