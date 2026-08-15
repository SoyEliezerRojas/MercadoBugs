import { Link, useParams } from 'react-router-dom'
import { AddToCartButton } from '../../cart/components/AddToCartButton'
import { CatalogError } from '../components/CatalogFeedback'
import { ProductImage } from '../components/ProductImage'
import { useProduct } from '../hooks/useCatalogQueries'
import { formatCurrency } from '../utils/formatCurrency'
import { isUuid } from '../utils/catalogParams'

function ProductNotFound() {
  return (
    <div className="product-not-found page-width">
      <span className="phase-badge">Producto no encontrado</span>
      <h1>Este producto no está disponible</h1>
      <p>Puede que el enlace no sea válido o que el artículo ya no forme parte del catálogo.</p>
      <Link className="button button--primary" to="/products">Volver al catálogo</Link>
    </div>
  )
}

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const validId = isUuid(id)
  const productQuery = useProduct(id, validId)

  if (!validId) {
    return <ProductNotFound />
  }

  if (productQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando producto" className="product-detail-skeleton page-width">
        <div />
        <div><span /><span /><span /><span /></div>
      </div>
    )
  }

  if (productQuery.isError) {
    return (
      <div className="product-detail-state page-width">
        <CatalogError onRetry={() => { void productQuery.refetch() }} />
        <Link className="text-link" to="/products">← Volver al catálogo</Link>
      </div>
    )
  }

  const product = productQuery.data

  if (!product) {
    return <ProductNotFound />
  }

  const hasStock = product.stock > 0

  return (
    <article className="product-detail page-width">
      <nav aria-label="Migas de pan" className="breadcrumbs">
        <Link to="/">Inicio</Link>
        <span aria-hidden="true">/</span>
        <Link to="/products">Productos</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className="product-detail__layout">
        <div className="product-detail__media">
          <ProductImage alt={product.name} className="product-detail__image" eager src={product.imageUrl} />
        </div>

        <div className="product-detail__content">
          <Link className="product-detail__category" to={`/products?category=${encodeURIComponent(product.category.slug)}`}>
            {product.category.name}
          </Link>
          <h1>{product.name}</h1>
          <p className="product-detail__price">{formatCurrency(product.price)}</p>
          <span className={`stock-label stock-label--detail ${hasStock ? 'stock-label--available' : 'stock-label--empty'}`}>
            {hasStock ? `${product.stock} unidades disponibles` : 'Producto sin stock'}
          </span>
          <AddToCartButton productId={product.id} stock={product.stock} />
          <div className="product-detail__description">
            <h2>Descripción</h2>
            <p>{product.description || 'Este producto no tiene una descripción disponible.'}</p>
          </div>
          <Link className="button button--secondary product-detail__back" to="/products">
            ← Volver al catálogo
          </Link>
        </div>
      </div>
    </article>
  )
}
