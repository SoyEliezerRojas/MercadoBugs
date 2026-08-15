import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { OrderDetail } from '../types'
import { getShippingMethodLabel } from '../utils/orderPresentation'

interface OrderFinancialSummaryProps {
  order: OrderDetail
}

export function OrderFinancialSummary({ order }: OrderFinancialSummaryProps) {
  return (
    <section className="order-summary" aria-labelledby="order-summary-title">
      <h2 id="order-summary-title">Resumen</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCurrency(order.subtotal)}</dd>
        </div>
        <div>
          <dt>{order.couponCode ? `Descuento ${order.couponCode}` : 'Descuento'}</dt>
          <dd>{order.discount > 0 ? `-${formatCurrency(order.discount)}` : formatCurrency(0)}</dd>
        </div>
        <div>
          <dt>{getShippingMethodLabel(order.shippingMethod)}</dt>
          <dd>{formatCurrency(order.shippingCost)}</dd>
        </div>
        <div className="order-summary__total">
          <dt>Total</dt>
          <dd>{formatCurrency(order.total)}</dd>
        </div>
      </dl>
      <p className="order-summary__coupon">
        {order.couponCode ? `Cupón aplicado: ${order.couponCode}` : 'Sin cupón'}
      </p>
      <p className="order-summary__authority">Importes históricos almacenados al confirmar el pedido.</p>
    </section>
  )
}
