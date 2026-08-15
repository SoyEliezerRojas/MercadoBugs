import { Link } from 'react-router-dom'
import { useIsMutating } from '@tanstack/react-query'
import { CouponControl } from '../../checkout/components/CouponControl'
import { checkoutKeys, useCheckoutPricing } from '../../checkout/hooks/useCheckout'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { CartTotals } from '../types'

interface CartSummaryProps {
  canCheckout: boolean
  cartVersion: string
  totals: CartTotals
  userId: string
}

export function CartSummary({ canCheckout, cartVersion, totals, userId }: CartSummaryProps) {
  const pricingQuery = useCheckoutPricing(userId, null, cartVersion)
  const pricing = pricingQuery.data
  const isChangingCoupon = useIsMutating({ mutationKey: [...checkoutKeys.all, 'coupon'] }) > 0

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
          <dd>{formatCurrency(pricing?.subtotal ?? totals.subtotal)}</dd>
        </div>
        <div>
          <dt>Envío</dt>
          <dd>Se calcula en checkout</dd>
        </div>
        <div>
          <dt>Descuento</dt>
          <dd>{pricing && pricing.discount > 0 ? `-${formatCurrency(pricing.discount)}` : '—'}</dd>
        </div>
        <div className="cart-summary__total">
          <dt>Total sin envío</dt>
          <dd>{formatCurrency(pricing ? pricing.subtotal - pricing.discount : totals.subtotal)}</dd>
        </div>
      </dl>
      <CouponControl pricing={pricing ?? null} shippingMethod={null} userId={userId} />
      {pricingQuery.isError && (
        <p className="cart-summary__error" role="alert">
          {pricingQuery.error instanceof Error ? pricingQuery.error.message : 'No pudimos calcular el descuento.'}
        </p>
      )}
      {canCheckout && !pricingQuery.isError && !isChangingCoupon ? (
        <Link className="button button--primary cart-summary__checkout" to="/checkout">
          Continuar al checkout
        </Link>
      ) : (
        <button className="button button--primary cart-summary__checkout" disabled type="button">
          Continuar al checkout
        </button>
      )}
      <p>Precios, cupón y stock se validarán nuevamente al confirmar.</p>
    </aside>
  )
}
