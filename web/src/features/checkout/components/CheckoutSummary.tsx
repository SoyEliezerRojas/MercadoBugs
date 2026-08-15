import { Link } from 'react-router-dom'
import type { Cart } from '../../cart/types'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { CheckoutPricing } from '../types'

interface CheckoutSummaryProps {
  cart: Cart
  pricing: CheckoutPricing | null
}

export function CheckoutSummary({ cart, pricing }: CheckoutSummaryProps) {
  return (
    <aside className="checkout-summary" aria-labelledby="checkout-summary-title">
      <div className="checkout-summary__heading">
        <h2 id="checkout-summary-title">Tu pedido</h2>
        <Link to="/cart">Editar carrito</Link>
      </div>

      <ul className="checkout-summary__items">
        {cart.items.map((item) => (
          <li key={item.id}>
            <span>{item.product?.name ?? 'Producto no disponible'} × {item.quantity}</span>
            <strong>{item.product ? formatCurrency(item.product.price * item.quantity) : '—'}</strong>
          </li>
        ))}
      </ul>

      <dl className="checkout-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{pricing ? formatCurrency(pricing.subtotal) : 'Calculando…'}</dd>
        </div>
        <div>
          <dt>Cupón {pricing?.coupon?.code ?? ''}</dt>
          <dd>{pricing && pricing.discount > 0 ? `-${formatCurrency(pricing.discount)}` : '—'}</dd>
        </div>
        <div>
          <dt>Envío {pricing?.shippingMethod ?? ''}</dt>
          <dd>{pricing ? formatCurrency(pricing.shippingCost) : 'Calculando…'}</dd>
        </div>
        <div className="checkout-totals__total">
          <dt>Total</dt>
          <dd>{pricing ? formatCurrency(pricing.total) : '—'}</dd>
        </div>
      </dl>
      <p className="checkout-summary__authority">El servidor validará nuevamente precios, cupón y stock.</p>
    </aside>
  )
}
