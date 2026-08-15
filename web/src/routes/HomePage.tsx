import { Link } from 'react-router-dom'
import { CatalogError, ProductGridSkeleton } from '../features/catalog/components/CatalogFeedback'
import { ProductCard } from '../features/catalog/components/ProductCard'
import { useCategories, useFeaturedProducts } from '../features/catalog/hooks/useCatalogQueries'

const highlights = [
  {
    eyebrow: 'Variedad',
    title: 'Opciones para cada espacio',
    description: 'Tecnología, hogar, audio, gaming y accesorios en un solo catálogo.',
  },
  {
    eyebrow: 'Información clara',
    title: 'Precios y stock visibles',
    description: 'Consulta la disponibilidad antes de elegir el producto que necesitas.',
  },
  {
    eyebrow: 'Navegación simple',
    title: 'Encuentra productos rápido',
    description: 'Usa búsqueda, categorías y filtros para acortar tu recorrido.',
  },
]

export function HomePage() {
  const categoriesQuery = useCategories()
  const featuredQuery = useFeaturedProducts()
  const categories = categoriesQuery.data ?? []
  const featuredProducts = featuredQuery.data ?? []

  return (
    <>
      <section className="hero page-width">
        <div className="hero__content">
          <span className="eyebrow">Tecnología para tu día a día</span>
          <h1>Todo lo que buscas, <span>en un solo lugar.</span></h1>
          <p>
            Descubre una selección de productos para trabajar, disfrutar y renovar tus espacios.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" to="/products">
              Explorar catálogo
            </Link>
            <Link className="button button--secondary" to="/register">
              Crear una cuenta
            </Link>
          </div>
        </div>
        <div aria-label="Vista previa del marketplace" className="hero__visual">
          <div className="visual-card visual-card--featured">
            <span className="visual-card__tag">Selección MercadoBugs</span>
            <div className="visual-card__product" aria-hidden="true">MB</div>
            <strong>{featuredProducts[0]?.name ?? 'Productos seleccionados'}</strong>
            <span>Explora alternativas para cada necesidad</span>
          </div>
          <div className="visual-card visual-card--stat">
            <strong>{categoriesQuery.isSuccess ? categories.length : '—'}</strong>
            <span>categorías disponibles</span>
          </div>
        </div>
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Categorías</span>
            <h2>Encuentra lo que buscas</h2>
          </div>
          <Link className="text-link" to="/products">Ver todo <span aria-hidden="true">→</span></Link>
        </div>

        {categoriesQuery.isPending && (
          <div aria-busy="true" aria-label="Cargando categorías" className="category-list">
            {Array.from({ length: 7 }, (_, index) => <div className="category-chip category-chip--skeleton" key={index} />)}
          </div>
        )}
        {categoriesQuery.isError && <CatalogError onRetry={() => { void categoriesQuery.refetch() }} />}
        {categoriesQuery.isSuccess && categories.length === 0 && (
          <div className="catalog-inline-alert" role="status">No hay categorías disponibles.</div>
        )}
        {categories.length > 0 && (
          <div className="category-list">
            {categories.map((category, index) => (
              <Link
                className="category-chip"
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
              >
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section page-width">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Destacados</span>
            <h2>Productos para descubrir</h2>
          </div>
          <Link className="text-link" to="/products">Explorar catálogo <span aria-hidden="true">→</span></Link>
        </div>

        {featuredQuery.isPending && <ProductGridSkeleton />}
        {featuredQuery.isError && <CatalogError onRetry={() => { void featuredQuery.refetch() }} />}
        {featuredQuery.isSuccess && featuredProducts.length === 0 && (
          <div className="catalog-inline-alert" role="status">No hay productos destacados disponibles.</div>
        )}
        {featuredProducts.length > 0 && (
          <div className="product-grid product-grid--home">
            {featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </section>

      <section className="section page-width">
        <div className="highlight-grid">
          {highlights.map((highlight) => (
            <article className="highlight-card" key={highlight.title}>
              <span className="eyebrow">{highlight.eyebrow}</span>
              <h3>{highlight.title}</h3>
              <p>{highlight.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
