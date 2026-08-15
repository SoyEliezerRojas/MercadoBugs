import { SORT_OPTIONS, type ProductFilters, type SortOption } from '../types'

export const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  sort: 'default',
}

function readNonNegativeNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

function isSortOption(value: string | null): value is SortOption {
  return value !== null && SORT_OPTIONS.some((option) => option === value)
}

export function filtersFromSearchParams(params: URLSearchParams): ProductFilters {
  const sort = params.get('sort')

  return {
    search: params.get('search')?.trim() ?? '',
    category: params.get('category')?.trim() ?? '',
    minPrice: readNonNegativeNumber(params.get('min')),
    maxPrice: readNonNegativeNumber(params.get('max')),
    sort: isSortOption(sort) ? sort : DEFAULT_FILTERS.sort,
  }
}

export function validatePriceRange(minPrice: number | null, maxPrice: number | null): string | null {
  if (minPrice !== null && minPrice < 0) {
    return 'El precio mínimo no puede ser negativo.'
  }

  if (maxPrice !== null && maxPrice < 0) {
    return 'El precio máximo no puede ser negativo.'
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    return 'El precio mínimo no puede superar al máximo.'
  }

  return null
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
