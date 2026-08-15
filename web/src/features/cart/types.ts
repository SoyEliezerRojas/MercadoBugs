export type CartStatus = 'active' | 'converted' | 'abandoned'

export interface CartProductCategory {
  id: string
  name: string
  slug: string
}

export interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  imageUrl: string | null
  category: CartProductCategory
}

export interface CartItem {
  id: string
  cartId: string
  productId: string
  quantity: number
  createdAt: string
  updatedAt: string
  product: CartProduct | null
}

export interface Cart {
  id: string
  userId: string
  status: CartStatus
  createdAt: string
  updatedAt: string
  items: CartItem[]
}

export interface CartTotals {
  lineCount: number
  subtotal: number
  totalUnits: number
}

export type CartErrorCode =
  | 'cart-unavailable'
  | 'concurrent-change'
  | 'invalid-quantity'
  | 'product-unavailable'
  | 'stock-exceeded'

export class CartOperationError extends Error {
  code: CartErrorCode

  constructor(code: CartErrorCode, message: string) {
    super(message)
    this.name = 'CartOperationError'
    this.code = code
  }
}
