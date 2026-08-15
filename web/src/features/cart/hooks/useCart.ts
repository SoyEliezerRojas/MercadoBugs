import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addProductToCart,
  clearActiveCart,
  getActiveCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../api/cartApi'

export const cartKeys = {
  all: ['cart'] as const,
  active: (userId: string) => [...cartKeys.all, 'active', userId] as const,
}

export function useCart(userId: string | null) {
  return useQuery({
    queryKey: cartKeys.active(userId ?? 'anonymous'),
    queryFn: () => userId ? getActiveCart(userId) : Promise.resolve(null),
    enabled: Boolean(userId),
  })
}

export function useAddToCart(userId: string | null, productId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...cartKeys.all, 'add', userId, productId],
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Debes iniciar sesión para usar el carrito.')
      }

      await addProductToCart(userId, productId)
    },
    onSuccess: async () => {
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
      }
    },
  })
}

export function useUpdateCartItem(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...cartKeys.all, 'update', userId],
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItemQuantity(userId, itemId, quantity),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
    },
  })
}

export function useRemoveCartItem(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...cartKeys.all, 'remove', userId],
    mutationFn: (itemId: string) => removeCartItem(userId, itemId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
    },
  })
}

export function useClearCart(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...cartKeys.all, 'clear', userId],
    mutationFn: () => clearActiveCart(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
    },
  })
}
