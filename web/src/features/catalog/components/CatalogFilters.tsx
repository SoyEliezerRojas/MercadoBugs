import { useState, type FormEvent } from 'react'
import type { Category, ProductFilters, SortOption } from '../types'
import { validatePriceRange } from '../utils/catalogParams'

interface CatalogFiltersProps {
  categories: Category[]
  filters: ProductFilters
  isCategoriesLoading: boolean
  onApplyPrice: (minPrice: number | null, maxPrice: number | null) => void
  onCategoryChange: (category: string) => void
  onReset: () => void
  onSearchChange: (search: string) => void
  onSortChange: (sort: SortOption) => void
}

function parsePrice(value: string): number | null {
  if (value.trim() === '') {
    return null
  }

  return Number(value)
}

export function CatalogFilters({
  categories,
  filters,
  isCategoriesLoading,
  onApplyPrice,
  onCategoryChange,
  onReset,
  onSearchChange,
  onSortChange,
}: CatalogFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? '')
  const [priceError, setPriceError] = useState<string | null>(null)

  const handlePriceSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextMinPrice = parsePrice(minPrice)
    const nextMaxPrice = parsePrice(maxPrice)

    if (
      (nextMinPrice !== null && !Number.isFinite(nextMinPrice))
      || (nextMaxPrice !== null && !Number.isFinite(nextMaxPrice))
    ) {
      setPriceError('Ingresa precios válidos.')
      return
    }

    const validationError = validatePriceRange(nextMinPrice, nextMaxPrice)
    setPriceError(validationError)

    if (!validationError) {
      onApplyPrice(nextMinPrice, nextMaxPrice)
    }
  }

  return (
    <>
      <button
        aria-controls="catalog-filter-panel"
        aria-expanded={isOpen}
        className="catalog-filter-toggle button button--secondary"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {isOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
      </button>

      <aside className={`catalog-filters ${isOpen ? 'catalog-filters--open' : ''}`} id="catalog-filter-panel">
        <div className="catalog-filters__heading">
          <h2>Filtrar productos</h2>
          <button className="text-link catalog-filters__reset" onClick={onReset} type="button">
            Limpiar todo
          </button>
        </div>

        <div className="catalog-control">
          <label htmlFor="catalog-search">Buscar por nombre</label>
          <input
            autoComplete="off"
            id="catalog-search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Ej. teclado"
            type="search"
            value={filters.search}
          />
        </div>

        <div className="catalog-control">
          <label htmlFor="catalog-category">Categoría</label>
          <select
            disabled={isCategoriesLoading}
            id="catalog-category"
            onChange={(event) => onCategoryChange(event.target.value)}
            value={filters.category}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>{category.name}</option>
            ))}
          </select>
        </div>

        <form className="price-filter" noValidate onSubmit={handlePriceSubmit}>
          <fieldset>
            <legend>Rango de precio</legend>
            <div className="price-filter__fields">
              <label>
                <span>Mínimo</span>
                <input
                  aria-invalid={Boolean(priceError)}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="0"
                  step="0.01"
                  type="number"
                  value={minPrice}
                />
              </label>
              <label>
                <span>Máximo</span>
                <input
                  aria-invalid={Boolean(priceError)}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="1000"
                  step="0.01"
                  type="number"
                  value={maxPrice}
                />
              </label>
            </div>
            {priceError && <p className="catalog-control__error" role="alert">{priceError}</p>}
            <button className="button button--secondary button--compact" type="submit">Aplicar precio</button>
          </fieldset>
        </form>

        <div className="catalog-control">
          <label htmlFor="catalog-sort">Ordenar por</label>
          <select
            id="catalog-sort"
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            value={filters.sort}
          >
            <option value="default">Predeterminado</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name-asc">Nombre: A–Z</option>
          </select>
        </div>
      </aside>
    </>
  )
}
