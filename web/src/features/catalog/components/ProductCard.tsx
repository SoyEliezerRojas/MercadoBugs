import { Link } from 'react-router-dom'
import { AddToCartButton } from '../../cart/components/AddToCartButton'
import type { Product } from '../types'
import { formatCurrency } from '../utils/formatCurrency'
import { ProductImage } from './ProductImage'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const hasStock = product.stock > 0

  return (
    <article className="product-card">
      <Link aria-label={`Ver ${product.name}`} className="product-card__image-link" to={`/products/${product.id}`}>
        <ProductImage alt={product.name} className="product-card__image" src={product.imageUrl} />
      </Link>
      <div className="product-card__body">
        <span className="product-card__category">{product.category.name}</span>
        <h3>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card__price">{formatCurrency(product.price)}</p>
        <div className="product-card__footer">
          <span className={`stock-label ${hasStock ? 'stock-label--available' : 'stock-label--empty'}`}>
            {hasStock ? `${product.stock} disponibles` : 'Sin stock'}
          </span>
          <Link className="text-link" to={`/products/${product.id}`}>
            Ver detalle <span aria-hidden="true">→</span>
          </Link>
        </div>
        <AddToCartButton compact productId={product.id} stock={product.stock} />
      </div>
    </article>
  )
}
