import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '../../cart/hooks/useCart'
import { catalogKeys } from '../../catalog/hooks/useCatalogQueries'
import { applyCoupon, getCartPricing, removeCoupon } from '../api/couponApi'
import { getOrderConfirmation, performCheckout } from '../api/checkoutApi'
import type { CheckoutPayload, ShippingMethod } from '../types'

export const checkoutKeys = {
  all: ['checkout'] as const,
  pricingRoot: (userId: string) => [...checkoutKeys.all, 'pricing', userId] as const,
  pricing: (userId: string, shippingMethod: ShippingMethod | null, cartVersion: string) =>
    [...checkoutKeys.pricingRoot(userId), shippingMethod ?? 'cart', cartVersion] as const,
  confirmation: (orderId: string) => [...checkoutKeys.all, 'confirmation', orderId] as const,
}

export function useCheckoutPricing(
  userId: string,
  shippingMethod: ShippingMethod | null,
  cartVersion: string,
  enabled = true,
) {
  return useQuery({
    queryKey: checkoutKeys.pricing(userId, shippingMethod, cartVersion),
    queryFn: () => getCartPricing(shippingMethod ?? undefined),
    enabled,
  })
}
export function useApplyCoupon(userId: string, shippingMethod: ShippingMethod | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...checkoutKeys.all, 'coupon', 'apply', userId],
    mutationFn: (code: string) => applyCoupon(code, shippingMethod ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: checkoutKeys.pricingRoot(userId) })
      void queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
    },
  })
}

export function useRemoveCoupon(userId: string, shippingMethod: ShippingMethod | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...checkoutKeys.all, 'coupon', 'remove', userId],
    mutationFn: () => removeCoupon(shippingMethod ?? undefined),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: checkoutKeys.pricingRoot(userId) })
      void queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
    },
  })
}

export function usePerformCheckout(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: [...checkoutKeys.all, 'perform', userId],
    mutationFn: (payload: CheckoutPayload) => performCheckout(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartKeys.active(userId) })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
      void queryClient.invalidateQueries({ queryKey: checkoutKeys.pricingRoot(userId) })
    },
  })
}

export function useOrderConfirmation(orderId: string) {
  return useQuery({
    queryKey: checkoutKeys.confirmation(orderId),
    queryFn: () => getOrderConfirmation(orderId),
    enabled: Boolean(orderId),
  })
}
