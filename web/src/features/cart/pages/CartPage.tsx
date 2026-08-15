import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CartItemRow } from '../components/CartItemRow'
import { CartSummary } from '../components/CartSummary'
import { ClearCartDialog } from '../components/ClearCartDialog'
import { useAuth } from '../../auth/useAuth'
import { useCart, useClearCart } from '../hooks/useCart'
import { getCartTotals } from '../utils/cartTotals'

export function CartPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const cartQuery = useCart(userId)
  const clearMutation = useClearCart(userId ?? '')
  const [showClearDialog, setShowClearDialog] = useState(false)

  if (!userId) {
    return null
  }

  if (cartQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando carrito" className="cart-page page-width">
        <header className="cart-page__header cart-page__header--loading" />
        <div className="cart-page__skeleton"><div /><div /></div>
      </div>
    )
  }

  if (cartQuery.isError) {
    return (
      <div className="cart-page cart-page--state page-width">
        <span className="phase-badge">Carrito</span>
        <h1>No pudimos cargar tu carrito</h1>
        <p>Revisa tu conexión e inténtalo nuevamente.</p>
        <button className="button button--primary" onClick={() => { void cartQuery.refetch() }} type="button">
          Reintentar
        </button>
      </div>
    )
  }

  const cart = cartQuery.data
  const items = cart?.items ?? []
  const totals = getCartTotals(cart)

  if (items.length === 0) {
    return (
      <div className="cart-page cart-page--state page-width">
        <span aria-hidden="true" className="cart-empty__mark">MB</span>
        <span className="eyebrow">Tu carrito</span>
        <h1>Tu carrito está vacío</h1>
        <p>Explora el catálogo y agrega los productos que quieras conservar.</p>
        <Link className="button button--primary" to="/products">Explorar productos</Link>
      </div>
    )
  }

  const confirmClear = () => {
    clearMutation.mutate(undefined, {
      onSuccess: () => setShowClearDialog(false),
    })
  }

  return (
    <div className="cart-page page-width">
      <header className="cart-page__header">
        <div>
          <span className="eyebrow">Compra</span>
          <h1>Tu carrito</h1>
          <p>{totals.totalUnits} {totals.totalUnits === 1 ? 'unidad seleccionada' : 'unidades seleccionadas'}</p>
        </div>
        <button className="cart-page__clear" onClick={() => setShowClearDialog(true)} type="button">
          Vaciar carrito
        </button>
      </header>

      {clearMutation.isError && (
        <div className="form-alert form-alert--error" role="alert">
          {clearMutation.error instanceof Error ? clearMutation.error.message : 'No pudimos vaciar tu carrito.'}
        </div>
      )}

      <div className="cart-page__layout">
        <ul className="cart-items" aria-label="Productos en el carrito">
          {items.map((item) => <CartItemRow item={item} key={item.id} userId={userId} />)}
        </ul>
        <CartSummary
          canCheckout={items.every((item) => Boolean(item.product && item.product.stock >= item.quantity))}
          cartVersion={[
            cart?.updatedAt ?? 'none',
            ...items.map((item) => `${item.id}:${item.quantity}:${item.updatedAt}`),
          ].join('|')}
          totals={totals}
          userId={userId}
        />
      </div>

      {showClearDialog && (
        <ClearCartDialog
          isClearing={clearMutation.isPending}
          onCancel={() => setShowClearDialog(false)}
          onConfirm={confirmClear}
        />
      )}
    </div>
  )
}
