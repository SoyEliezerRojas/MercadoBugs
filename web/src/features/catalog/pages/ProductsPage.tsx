import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CatalogError, ProductGridSkeleton } from '../components/CatalogFeedback'
import { CatalogFilters } from '../components/CatalogFilters'
import { ProductCard } from '../components/ProductCard'
import { useCategories, useProducts } from '../hooks/useCatalogQueries'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { SortOption } from '../types'
import { filtersFromSearchParams, validatePriceRange } from '../utils/catalogParams'

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams])
  const debouncedSearch = useDebouncedValue(filters.search, 300)
  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [debouncedSearch, filters],
  )
  const priceValidationError = validatePriceRange(filters.minPrice, filters.maxPrice)
  const categoriesQuery = useCategories()
  const productsQuery = useProducts(queryFilters, !priceValidationError)

  const updateParams = (updates: Record<string, string | null>, replace = false) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || (key === 'sort' && value === 'default')) {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })

    setSearchParams(nextParams, { replace })
  }

  const resetFilters = () => setSearchParams({})
  const products = productsQuery.data ?? []
  const hasFilters = Boolean(
    filters.search
    || filters.category
    || filters.minPrice !== null
    || filters.maxPrice !== null
    || filters.sort !== 'default',
  )

  return (
    <div className="catalog-page page-width">
      <header className="catalog-page__header">
        <span className="eyebrow">Catálogo</span>
        <h1>Explora todos los productos</h1>
        <p>Encuentra artículos por nombre, categoría o rango de precio.</p>
      </header>

      <div className="catalog-layout">
        <CatalogFilters
          categories={categoriesQuery.data ?? []}
          filters={filters}
          isCategoriesLoading={categoriesQuery.isPending}
          key={`${filters.minPrice ?? ''}-${filters.maxPrice ?? ''}`}
          onApplyPrice={(minPrice, maxPrice) => updateParams({
            min: minPrice === null ? null : String(minPrice),
            max: maxPrice === null ? null : String(maxPrice),
          })}
          onCategoryChange={(category) => updateParams({ category: category || null })}
          onReset={resetFilters}
          onSearchChange={(search) => updateParams({ search: search || null }, true)}
          onSortChange={(sort: SortOption) => updateParams({ sort })}
        />

        <main className="catalog-results">
          <div className="catalog-results__summary" aria-live="polite">
            <p>
              {productsQuery.isPending
                ? 'Buscando productos…'
                : `${products.length} ${products.length === 1 ? 'resultado' : 'resultados'}`}
            </p>
            {productsQuery.isFetching && !productsQuery.isPending && <span>Actualizando…</span>}
          </div>

          {categoriesQuery.isError && (
            <div className="catalog-inline-alert" role="status">
              Las categorías no están disponibles por el momento.
              <button onClick={() => { void categoriesQuery.refetch() }} type="button">Reintentar</button>
            </div>
          )}

          {priceValidationError && (
            <div className="catalog-feedback catalog-feedback--error" role="alert">
              <span aria-hidden="true">!</span>
              <div>
                <h3>Revisa el rango de precio</h3>
                <p>{priceValidationError}</p>
                <button className="button button--secondary button--compact" onClick={resetFilters} type="button">
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {!priceValidationError && productsQuery.isPending && <ProductGridSkeleton count={9} />}

          {!priceValidationError && productsQuery.isError && (
            <CatalogError onRetry={() => { void productsQuery.refetch() }} />
          )}

          {!priceValidationError && productsQuery.isSuccess && products.length === 0 && (
            <div className="catalog-empty">
              <span aria-hidden="true">⌕</span>
              <h2>No encontramos productos</h2>
              <p>Prueba con otra búsqueda o quita alguno de los filtros.</p>
              {hasFilters ? (
                <button className="button button--primary" onClick={resetFilters} type="button">
                  Limpiar filtros
                </button>
              ) : (
                <Link className="button button--secondary" to="/">Volver al inicio</Link>
              )}
            </div>
          )}

          {!priceValidationError && productsQuery.isSuccess && products.length > 0 && (
            <div className="product-grid">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
