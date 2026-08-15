import { NavLink } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { getCartTotals } from '../utils/cartTotals'

interface CartButtonProps {
  userId: string
}

export function CartButton({ userId }: CartButtonProps) {
  const cartQuery = useCart(userId)
  const { totalUnits } = getCartTotals(cartQuery.data)
  const accessibleCount = cartQuery.isPending
    ? 'cargando cantidad'
    : `${totalUnits} ${totalUnits === 1 ? 'unidad' : 'unidades'}`

  return (
    <NavLink
      aria-label={`Carrito, ${accessibleCount}`}
      className="button button--ghost button--compact cart-nav-button"
      to="/cart"
    >
      <svg aria-hidden="true" className="cart-nav-button__icon" fill="none" viewBox="0 0 24 24">
        <path d="M3 4h2l2.1 9.1a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 1.9-1.4L20 8H6.1M9.5 19a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Zm8 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
      <span>Carrito</span>
      {totalUnits > 0 && <strong aria-hidden="true" className="cart-nav-button__badge">{totalUnits}</strong>}
    </NavLink>
  )
}
