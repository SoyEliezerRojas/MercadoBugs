import { Link, useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { OrderDeliveryDetails } from '../components/OrderDeliveryDetails'
import { OrderFinancialSummary } from '../components/OrderFinancialSummary'
import { OrderItemsList } from '../components/OrderItemsList'
import { OrderStatusBadge } from '../components/OrderStatusBadge'
import { useOrder } from '../hooks/useOrders'
import {
  formatOrderDate,
  formatOrderId,
  formatUnitCount,
} from '../utils/orderPresentation'

interface OrderLocationState {
  checkoutCompleted?: boolean
}

export function OrderDetailPage() {
  const { user } = useAuth()
  const { id = '' } = useParams()
  const location = useLocation()
  const userId = user?.id ?? ''
  const orderQuery = useOrder(userId, id)
  const checkoutCompleted = (location.state as OrderLocationState | null)?.checkoutCompleted === true

  if (!userId) return null

  if (orderQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando pedido" className="order-detail page-width">
        <div className="order-detail__skeleton"><div /><div /><div /></div>
      </div>
    )
  }

  if (orderQuery.isError) {
    return (
      <div className="orders-state page-width">
        <span className="eyebrow">Detalle del pedido</span>
        <h1>No pudimos cargar el pedido</h1>
        <p>Revisa tu conexión e inténtalo nuevamente.</p>
        <button className="button button--primary" onClick={() => { void orderQuery.refetch() }} type="button">
          Reintentar
        </button>
      </div>
    )
  }

  const order = orderQuery.data

  if (!order) {
    return (
      <div className="orders-state page-width">
        <span aria-hidden="true" className="orders-empty__mark">?</span>
        <span className="eyebrow">Detalle del pedido</span>
        <h1>Pedido no encontrado</h1>
        <p>El pedido no existe o no pertenece a tu cuenta.</p>
        <Link className="button button--primary" to="/orders">Volver a mis pedidos</Link>
      </div>
    )
  }

  const totalUnits = order.items.reduce((total, item) => total + item.quantity, 0)

  return (
    <div className="order-detail page-width">
      {checkoutCompleted && (
        <div className="order-complete-banner" role="status">
          <span aria-hidden="true">✓</span>
          <div><strong>¡Compra realizada correctamente!</strong><p>Tu pago fue simulado y el pedido quedó confirmado.</p></div>
        </div>
      )}

      <Link className="order-detail__back" to="/orders"><span aria-hidden="true">←</span> Mis pedidos</Link>

      <header className="order-detail__header">
        <div>
          <span className="eyebrow">Detalle del pedido</span>
          <h1>Pedido {formatOrderId(order.id)}</h1>
          <p>
            <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
            <span aria-hidden="true"> · </span>
            {formatUnitCount(totalUnits)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="order-detail__layout">
        <div className="order-detail__main">
          <OrderItemsList items={order.items} />
          <OrderDeliveryDetails order={order} />
        </div>
        <OrderFinancialSummary order={order} />
      </div>
    </div>
  )
}
