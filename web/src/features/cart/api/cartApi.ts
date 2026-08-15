import { supabase } from '../../../lib/supabase'
import { CartOperationError, type Cart, type CartItem, type CartProduct, type CartStatus } from '../types'

interface CartProductCategoryRow {
  id: string
  name: string
  slug: string
  active: boolean
}

interface CartProductRow {
  id: string
  name: string
  slug: string
  price: number | string
  stock: number
  image_url: string | null
  active: boolean
  category: CartProductCategoryRow | CartProductCategoryRow[] | null
}

interface CartItemRow {
  id: string
  cart_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product: CartProductRow | CartProductRow[] | null
}

interface CartRow {
  id: string
  user_id: string
  status: CartStatus
  created_at: string
  updated_at: string
  items: CartItemRow[] | null
}

interface CartItemQuantityRow {
  id: string
  product_id: string
  quantity: number
}

interface CartIdRow {
  id: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readCartIdRow(value: unknown): CartIdRow | null {
  if (!isRecord(value) || typeof value.id !== 'string') {
    return null
  }

  return { id: value.id }
}

function readStock(value: unknown): number | null {
  if (!isRecord(value) || typeof value.stock !== 'number') {
    return null
  }

  return value.stock
}

function readCartItemQuantityRow(value: unknown): CartItemQuantityRow | null {
  if (
    !isRecord(value)
    || typeof value.id !== 'string'
    || typeof value.product_id !== 'string'
    || typeof value.quantity !== 'number'
  ) {
    return null
  }

  return {
    id: value.id,
    product_id: value.product_id,
    quantity: value.quantity,
  }
}

const CART_SELECT = `
  id,
  user_id,
  status,
  created_at,
  updated_at,
  items:cart_items (
    id,
    cart_id,
    product_id,
    quantity,
    created_at,
    updated_at,
    product:products!cart_items_product_id_fkey (
      id,
      name,
      slug,
      price,
      stock,
      image_url,
      active,
      category:categories!products_category_id_fkey (
        id,
        name,
        slug,
        active
      )
    )
  )
`

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function mapProduct(row: CartProductRow | CartProductRow[] | null): CartProduct | null {
  const product = one(row)
  const category = product ? one(product.category) : null

  if (!product || !product.active || !category || !category.active) {
    return null
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: Number(product.price),
    stock: product.stock,
    imageUrl: product.image_url,
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
    },
  }
}

function mapCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    cartId: row.cart_id,
    productId: row.product_id,
    quantity: row.quantity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    product: mapProduct(row.product),
  }
}

function mapCart(row: CartRow): Cart {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.items ?? []).map(mapCartItem).sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  }
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function databaseFailure(message: string): CartOperationError {
  return new CartOperationError('cart-unavailable', message)
}

async function findActiveCartId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw databaseFailure('No pudimos consultar tu carrito. Inténtalo nuevamente.')
  }

  return readCartIdRow(data)?.id ?? null
}

async function ensureActiveCart(userId: string): Promise<string> {
  const existingId = await findActiveCartId(userId)

  if (existingId) {
    return existingId
  }

  const { data, error } = await supabase
    .from('carts')
    .insert({ user_id: userId, status: 'active' })
    .select('id')
    .single()

  const createdCart = readCartIdRow(data)

  if (!error && createdCart) {
    return createdCart.id
  }

  if (isUniqueViolation(error)) {
    const concurrentlyCreatedId = await findActiveCartId(userId)

    if (concurrentlyCreatedId) {
      return concurrentlyCreatedId
    }
  }

  throw databaseFailure('No pudimos preparar tu carrito. Inténtalo nuevamente.')
}

async function getAvailableStock(productId: string): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .select('stock')
    .eq('id', productId)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    throw databaseFailure('No pudimos verificar la disponibilidad del producto.')
  }

  const stock = readStock(data)

  if (stock === null) {
    throw new CartOperationError('product-unavailable', 'Este producto ya no está disponible.')
  }

  return stock
}

async function findCartItem(cartId: string, productId: string): Promise<CartItemQuantityRow | null> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) {
    throw databaseFailure('No pudimos consultar el producto en tu carrito.')
  }

  return readCartItemQuantityRow(data)
}

export async function getActiveCart(userId: string): Promise<Cart | null> {
  const { data, error } = await supabase
    .from('carts')
    .select(CART_SELECT)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    throw databaseFailure('No pudimos cargar tu carrito. Inténtalo nuevamente.')
  }

  return data ? mapCart(data) : null
}

export async function addProductToCart(userId: string, productId: string): Promise<void> {
  const stock = await getAvailableStock(productId)

  if (stock < 1) {
    throw new CartOperationError('stock-exceeded', 'Este producto no tiene stock disponible.')
  }

  const cartId = await ensureActiveCart(userId)

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const existingItem = await findCartItem(cartId, productId)

    if (!existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: productId, quantity: 1 })

      if (!error) {
        return
      }

      if (isUniqueViolation(error)) {
        continue
      }

      throw databaseFailure('No pudimos agregar el producto al carrito.')
    }

    const nextQuantity = existingItem.quantity + 1

    if (nextQuantity > stock) {
      throw new CartOperationError(
        'stock-exceeded',
        `Solo hay ${stock} ${stock === 1 ? 'unidad disponible' : 'unidades disponibles'}.`,
      )
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: nextQuantity })
      .eq('id', existingItem.id)
      .eq('cart_id', cartId)
      .eq('quantity', existingItem.quantity)
      .select('id')
      .maybeSingle()

    if (error) {
      throw databaseFailure('No pudimos actualizar la cantidad del producto.')
    }

    if (data) {
      return
    }
  }

  throw new CartOperationError(
    'concurrent-change',
    'El carrito cambió al mismo tiempo. Revisa la cantidad e inténtalo nuevamente.',
  )
}

export async function updateCartItemQuantity(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<void> {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CartOperationError('invalid-quantity', 'La cantidad debe ser un número entero mayor que cero.')
  }

  const cartId = await findActiveCartId(userId)

  if (!cartId) {
    throw databaseFailure('No encontramos un carrito activo para actualizar.')
  }

  const { data: itemData, error: itemError } = await supabase
    .from('cart_items')
    .select('id, product_id, quantity')
    .eq('id', itemId)
    .eq('cart_id', cartId)
    .maybeSingle()

  if (itemError) {
    throw databaseFailure('No pudimos consultar el producto en tu carrito.')
  }

  const item = readCartItemQuantityRow(itemData)

  if (!item) {
    throw databaseFailure('Este producto ya no está en tu carrito.')
  }

  const stock = await getAvailableStock(item.product_id)

  if (quantity > stock && quantity >= item.quantity) {
    throw new CartOperationError(
      'stock-exceeded',
      `Solo hay ${stock} ${stock === 1 ? 'unidad disponible' : 'unidades disponibles'}.`,
    )
  }

  if (quantity === item.quantity) {
    return
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', item.id)
    .eq('cart_id', cartId)
    .eq('quantity', item.quantity)
    .select('id')
    .maybeSingle()

  if (error) {
    throw databaseFailure('No pudimos actualizar la cantidad del producto.')
  }

  if (!data) {
    throw new CartOperationError(
      'concurrent-change',
      'La cantidad cambió en otra pestaña. El carrito se actualizará para mostrar el valor actual.',
    )
  }
}

export async function removeCartItem(userId: string, itemId: string): Promise<void> {
  const cartId = await findActiveCartId(userId)

  if (!cartId) {
    return
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cartId)

  if (error) {
    throw databaseFailure('No pudimos eliminar el producto del carrito.')
  }
}

export async function clearActiveCart(userId: string): Promise<void> {
  const cartId = await findActiveCartId(userId)

  if (!cartId) {
    return
  }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)

  if (error) {
    throw databaseFailure('No pudimos vaciar tu carrito.')
  }
}
