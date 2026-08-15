import { useQuery } from '@tanstack/react-query'
import { getOrderById, getOrders } from '../api/ordersApi'

export const ordersKeys = {
  all: ['orders'] as const,
  list: (userId: string) => [...ordersKeys.all, 'list', userId] as const,
  detail: (userId: string, orderId: string) =>
    [...ordersKeys.all, 'detail', userId, orderId] as const,
}

export function useOrders(userId: string) {
  return useQuery({
    queryKey: ordersKeys.list(userId),
    queryFn: () => getOrders(userId),
    enabled: Boolean(userId),
    staleTime: 60_000,
  })
}

export function useOrder(userId: string, orderId: string) {
  return useQuery({
    queryKey: ordersKeys.detail(userId, orderId),
    queryFn: () => getOrderById(userId, orderId),
    enabled: Boolean(userId && orderId),
    staleTime: 60_000,
  })
}
