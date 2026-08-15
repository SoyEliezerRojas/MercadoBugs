import type { Cart, CartTotals } from '../types'

export function getCartTotals(cart: Cart | null | undefined): CartTotals {
  if (!cart) {
    return { lineCount: 0, subtotal: 0, totalUnits: 0 }
  }

  return cart.items.reduce<CartTotals>(
    (totals, item) => ({
      lineCount: totals.lineCount + 1,
      subtotal: totals.subtotal + (item.product ? item.product.price * item.quantity : 0),
      totalUnits: totals.totalUnits + item.quantity,
    }),
    { lineCount: 0, subtotal: 0, totalUnits: 0 },
  )
}
