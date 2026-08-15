import { supabase } from '../../../lib/supabase'
import type { Category, Product, ProductFilters } from '../types'

interface CategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
}

interface ProductCategoryRow {
  id: string
  name: string
  slug: string
}

interface ProductRow {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  price: number | string
  stock: number
  image_url: string | null
  created_at: string
  category: ProductCategoryRow | ProductCategoryRow[] | null
}

const PRODUCT_SELECT = `
  id,
  category_id,
  name,
  slug,
  description,
  price,
  stock,
  image_url,
  created_at,
  category:categories!products_category_id_fkey!inner (
    id,
    name,
    slug
  )
`

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
  }
}

function mapProduct(row: ProductRow): Product {
  const category = Array.isArray(row.category) ? row.category[0] : row.category

  if (!category) {
    throw new Error('El producto no tiene una categoría pública asociada.')
  }

  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    category,
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`No se pudieron cargar las categorías: ${error.message}`)
  }

  return (data as unknown as CategoryRow[]).map(mapCategory)
}

export async function getProducts(filters: ProductFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .eq('category.active', true)

  if (filters.search) {
    const literalSearch = filters.search.replace(/[%_]/g, '').trim()

    if (literalSearch) {
      query = query.ilike('name', `%${literalSearch}%`)
    }
  }

  if (filters.category) {
    query = query.eq('category.slug', filters.category)
  }

  if (filters.minPrice !== null) {
    query = query.gte('price', filters.minPrice)
  }

  if (filters.maxPrice !== null) {
    query = query.lte('price', filters.maxPrice)
  }

  if (filters.sort === 'price-asc') {
    query = query.order('price', { ascending: true })
  } else if (filters.sort === 'price-desc') {
    query = query.order('price', { ascending: false })
  } else {
    query = query.order('name', { ascending: true })
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`No se pudo cargar el catálogo: ${error.message}`)
  }

  return (data as unknown as ProductRow[]).map(mapProduct)
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .eq('category.active', true)
    .gt('stock', 0)
    .order('name', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`No se pudieron cargar los productos destacados: ${error.message}`)
  }

  return (data as unknown as ProductRow[]).map(mapProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .eq('active', true)
    .eq('category.active', true)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo cargar el producto: ${error.message}`)
  }

  return data ? mapProduct(data) : null
}
