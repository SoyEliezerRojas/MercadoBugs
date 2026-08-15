import type { OrderDetail } from '../types'
import {
  getPaymentMethodLabel,
  getShippingMethodLabel,
} from '../utils/orderPresentation'

interface OrderDeliveryDetailsProps {
  order: OrderDetail
}

export function OrderDeliveryDetails({ order }: OrderDeliveryDetailsProps) {
  return (
    <section className="order-panel" aria-labelledby="order-delivery-title">
      <div className="order-panel__heading">
        <span className="order-panel__number">02</span>
        <div>
          <h2 id="order-delivery-title">Entrega y pago</h2>
          <p>Datos ficticios ingresados durante el checkout.</p>
        </div>
      </div>

      <dl className="order-delivery">
        <div><dt>Nombre</dt><dd>{order.shippingName}</dd></div>
        <div><dt>Dirección</dt><dd>{order.shippingAddress}</dd></div>
        <div><dt>Ciudad</dt><dd>{order.shippingCity}</dd></div>
        <div><dt>Código postal</dt><dd>{order.shippingPostalCode}</dd></div>
        <div><dt>Método de envío</dt><dd>{getShippingMethodLabel(order.shippingMethod)}</dd></div>
        <div><dt>Método de pago</dt><dd>{getPaymentMethodLabel(order.paymentMethod)}</dd></div>
      </dl>
    </section>
  )
}
