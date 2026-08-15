export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Product {
  id: string
  categoryId: string
  name: string
  slug: string
  description: string | null
  price: number
  stock: number
  imageUrl: string | null
  createdAt: string
  category: Pick<Category, 'id' | 'name' | 'slug'>
}

export const SORT_OPTIONS = ['default', 'price-asc', 'price-desc', 'name-asc'] as const

export type SortOption = (typeof SORT_OPTIONS)[number]

export interface ProductFilters {
  search: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  sort: SortOption
}
