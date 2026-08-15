import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useAddToCart } from '../hooks/useCart'

interface AddToCartButtonProps {
  compact?: boolean
  productId: string
  stock: number
}

export function AddToCartButton({ compact = false, productId, stock }: AddToCartButtonProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, user } = useAuth()
  const addMutation = useAddToCart(user?.id ?? null, productId)
  const hasStock = stock > 0
  const feedbackId = `add-to-cart-feedback-${productId}`

  const handleAdd = () => {
    if (!isAuthenticated) {
      void navigate('/login', { state: { from: location } })
      return
    }

    addMutation.mutate()
  }

  let label = 'Agregar al carrito'

  if (!hasStock) label = 'Sin stock'
  else if (isLoading) label = 'Comprobando sesión…'
  else if (addMutation.isPending) label = 'Agregando…'
  else if (addMutation.isSuccess) label = 'Agregar otra unidad'

  return (
    <div className={`add-to-cart ${compact ? 'add-to-cart--compact' : ''}`}>
      <button
        aria-describedby={addMutation.isError || addMutation.isSuccess ? feedbackId : undefined}
        className={`button button--primary add-to-cart__button ${compact ? 'button--compact' : ''}`}
        disabled={!hasStock || isLoading || addMutation.isPending}
        onClick={handleAdd}
        type="button"
      >
        {label}
      </button>
      <span
        aria-live="polite"
        className={`add-to-cart__feedback ${addMutation.isError ? 'add-to-cart__feedback--error' : ''}`}
        id={feedbackId}
      >
        {addMutation.isError && (addMutation.error instanceof Error
          ? addMutation.error.message
          : 'No pudimos agregar el producto.')}
        {addMutation.isSuccess && 'Producto agregado correctamente.'}
      </span>
    </div>
  )
}
