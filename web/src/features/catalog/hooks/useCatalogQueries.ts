import { useQuery } from '@tanstack/react-query'
import { getCategories, getFeaturedProducts, getProductById, getProducts } from '../api/catalogApi'
import type { ProductFilters } from '../types'

export const catalogKeys = {
  all: ['catalog'] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  products: (filters: ProductFilters) => [...catalogKeys.all, 'products', filters] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  product: (id: string) => [...catalogKeys.all, 'product', id] as const,
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
}

export function useProducts(filters: ProductFilters, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.products(filters),
    queryFn: () => getProducts(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: catalogKeys.featured(),
    queryFn: () => getFeaturedProducts(8),
    staleTime: 5 * 60_000,
  })
}

export function useProduct(id: string, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => getProductById(id),
    enabled,
  })
}
