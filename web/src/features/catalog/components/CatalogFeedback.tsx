interface CatalogErrorProps {
  message?: string
  onRetry: () => void
}

interface ProductGridSkeletonProps {
  count?: number
}

export function CatalogError({ message, onRetry }: CatalogErrorProps) {
  return (
    <div className="catalog-feedback catalog-feedback--error" role="alert">
      <span aria-hidden="true">!</span>
      <div>
        <h3>No pudimos cargar esta sección</h3>
        <p>{message ?? 'Revisa tu conexión e inténtalo nuevamente.'}</p>
        <button className="button button--secondary button--compact" onClick={onRetry} type="button">
          Reintentar
        </button>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div aria-busy="true" aria-label="Cargando productos" className="product-grid">
      {Array.from({ length: count }, (_, index) => (
        <div aria-hidden="true" className="product-skeleton" key={index}>
          <div className="product-skeleton__image" />
          <div className="product-skeleton__line product-skeleton__line--short" />
          <div className="product-skeleton__line" />
          <div className="product-skeleton__line product-skeleton__line--price" />
        </div>
      ))}
    </div>
  )
}
