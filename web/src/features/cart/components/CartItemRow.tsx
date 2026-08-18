import { Link } from 'react-router-dom'
import { ProductImage } from '../../catalog/components/ProductImage'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import { useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart'
import type { CartItem } from '../types'

interface CartItemRowProps {
  item: CartItem
  userId: string
}

function mutationErrorMessage(error: unknown): string | null {
  return error instanceof Error ? error.message : null
}

export function CartItemRow({ item, userId }: CartItemRowProps) {
  const updateMutation = useUpdateCartItem(userId)
  const removeMutation = useRemoveCartItem(userId)
  const product = item.product
  const isBusy = updateMutation.isPending || removeMutation.isPending
  const errorMessage = mutationErrorMessage(updateMutation.error) ?? mutationErrorMessage(removeMutation.error)

  if (!product) {
    return (
      <li className="cart-item cart-item--unavailable">
        <div aria-hidden="true" className="cart-item__unavailable-image">MB</div>
        <div className="cart-item__main">
          <span className="product-card__category">No disponible</span>
          <h2>Producto no disponible</h2>
          <p>Este artículo ya no forma parte del catálogo. Puedes retirarlo del carrito.</p>
        </div>
        <button
          className="button button--secondary button--compact cart-item__remove"
          disabled={removeMutation.isPending}
          onClick={() => removeMutation.mutate(item.id)}
          type="button"
        >
          {removeMutation.isPending ? 'Eliminando…' : 'Eliminar'}
        </button>
        {errorMessage && <p className="cart-item__error" role="alert">{errorMessage}</p>}
      </li>
    )
  }

  const atMaximum = item.quantity >= product.stock
  const noStock = product.stock < 1
  const lineSubtotal = product.price * item.quantity

  return (
    <li className="cart-item">
      <Link aria-label={`Ver ${product.name}`} className="cart-item__image-link" to={`/products/${product.id}`}>
        <ProductImage alt={`Foto de ${product.name}`} className="cart-item__image" src={product.imageUrl} />
      </Link>

      <div className="cart-item__main">
        <span className="product-card__category">{product.category.name}</span>
        <h2><Link to={`/products/${product.id}`}>{product.name}</Link></h2>
        <p className="cart-item__price">{formatCurrency(product.price)} por unidad</p>
        <p className={`cart-item__stock ${noStock ? 'cart-item__stock--warning' : ''}`}>
          {noStock ? 'Sin stock disponible actualmente' : `Stock disponible: ${product.stock}`}
        </p>

        <div className="quantity-control" aria-label={`Cantidad de ${product.name}`}>
          <button
            aria-label={`Disminuir cantidad de ${product.name}`}
            disabled={isBusy || item.quantity <= 1}
            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
            type="button"
          >
            −
          </button>
          <output aria-live="polite" aria-label={`${item.quantity} unidades`}>{item.quantity}</output>
          <button
            aria-label={`Aumentar cantidad de ${product.name}`}
            disabled={isBusy || atMaximum || noStock}
            onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
            type="button"
          >
            +
          </button>
        </div>

        {(atMaximum || noStock) && (
          <p className="cart-item__limit" role="status">
            {noStock ? 'No puedes agregar más unidades.' : 'Has alcanzado el stock disponible.'}
          </p>
        )}
      </div>

      <div className="cart-item__aside">
        <span>Subtotal</span>
        <strong>{formatCurrency(lineSubtotal)}</strong>
        <button
          className="cart-item__remove"
          disabled={isBusy}
          onClick={() => removeMutation.mutate(item.id)}
          type="button"
        >
          {removeMutation.isPending ? 'Eliminando…' : 'Eliminar'}
        </button>
      </div>

      {updateMutation.isPending && <p className="cart-item__status" role="status">Actualizando cantidad…</p>}
      {errorMessage && <p className="cart-item__error" role="alert">{errorMessage}</p>}
    </li>
  )
}
