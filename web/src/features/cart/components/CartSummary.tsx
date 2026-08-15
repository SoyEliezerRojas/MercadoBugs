import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { CartTotals } from '../types'

interface CartSummaryProps {
  totals: CartTotals
}

export function CartSummary({ totals }: CartSummaryProps) {
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title">Resumen</h2>
      <dl>
        <div>
          <dt>Unidades</dt>
          <dd>{totals.totalUnits}</dd>
        </div>
        <div>
          <dt>Productos</dt>
          <dd>{formatCurrency(totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Envío</dt>
          <dd>Se calcula en checkout</dd>
        </div>
        <div>
          <dt>Descuento</dt>
          <dd>—</dd>
        </div>
        <div className="cart-summary__total">
          <dt>Subtotal</dt>
          <dd>{formatCurrency(totals.subtotal)}</dd>
        </div>
      </dl>
      <button className="button button--primary cart-summary__checkout" disabled type="button">
        Continuar compra
      </button>
      <p>El checkout estará disponible en la próxima fase.</p>
    </aside>
  )
}
