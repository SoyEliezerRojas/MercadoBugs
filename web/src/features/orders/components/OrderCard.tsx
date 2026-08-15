import { Link } from 'react-router-dom'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { OrderListItem } from '../types'
import {
  formatOrderDate,
  formatOrderId,
  formatUnitCount,
  getPaymentMethodLabel,
} from '../utils/orderPresentation'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderCardProps {
  order: OrderListItem
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <article className="order-card">
      <div className="order-card__heading">
        <div>
          <span className="order-card__label">Pedido</span>
          <h2>{formatOrderId(order.id)}</h2>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <dl className="order-card__facts">
        <div>
          <dt>Fecha</dt>
          <dd><time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></dd>
        </div>
        <div>
          <dt>Productos</dt>
          <dd>{formatUnitCount(order.totalUnits)}</dd>
        </div>
        <div>
          <dt>Pago</dt>
          <dd>{getPaymentMethodLabel(order.paymentMethod)}</dd>
        </div>
      </dl>

      <div className="order-card__footer">
        <div>
          <span>Total</span>
          <strong>{formatCurrency(order.total)}</strong>
        </div>
        <Link aria-label={`Ver detalle del pedido ${formatOrderId(order.id)}`} className="text-link" to={`/orders/${order.id}`}>
          Ver detalle <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}
