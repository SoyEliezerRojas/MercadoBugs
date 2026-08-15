import { Link, useParams } from 'react-router-dom'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import { useOrderConfirmation } from '../hooks/useCheckout'

export function CheckoutSuccessPage() {
  const { orderId = '' } = useParams()
  const orderQuery = useOrderConfirmation(orderId)

  if (orderQuery.isPending) {
    return <div aria-busy="true" className="checkout-success page-width">Cargando confirmación…</div>
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="checkout-success page-width">
        <span className="checkout-success__mark">!</span>
        <h1>No encontramos este pedido</h1>
        <p>Comprueba que el enlace pertenece a tu sesión actual.</p>
        <Link className="button button--primary" to="/products">Volver a productos</Link>
      </div>
    )
  }

  const order = orderQuery.data

  return (
    <div className="checkout-success page-width">
      <span aria-hidden="true" className="checkout-success__mark">✓</span>
      <span className="eyebrow">Pedido confirmado</span>
      <h1>¡Compra realizada!</h1>
      <p>Tu pago fue simulado correctamente y el stock ya fue actualizado.</p>
      <dl className="checkout-success__details">
        <div><dt>Pedido</dt><dd>#{order.id.slice(0, 8).toUpperCase()}</dd></div>
        <div><dt>Total</dt><dd>{formatCurrency(order.total)}</dd></div>
        <div><dt>Estado</dt><dd>Confirmado</dd></div>
      </dl>
      <div className="checkout-success__actions">
        <Link className="button button--primary" to="/products">Volver a productos</Link>
        <Link className="button button--secondary" to="/orders">Ver mis pedidos</Link>
      </div>
    </div>
  )
}
