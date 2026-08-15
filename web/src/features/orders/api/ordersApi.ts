import { supabase } from '../../../lib/supabase'
import type {
  OrderDetail,
  OrderItemSnapshot,
  OrderListItem,
  OrderPaymentMethod,
  OrderShippingMethod,
  OrderStatus,
} from '../types'

interface OrderListRow {
  id: unknown
  status: unknown
  total: unknown
  payment_method: unknown
  created_at: unknown
  items: unknown
}

interface OrderDetailRow extends OrderListRow {
  subtotal: unknown
  discount: unknown
  shipping_cost: unknown
  coupon_code: unknown
  shipping_name: unknown
  shipping_address: unknown
  shipping_city: unknown
  shipping_postal_code: unknown
  shipping_method: unknown
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readNumber(value: unknown, field: string): number {
  const numberValue = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numberValue)) {
    throw new Error(`El pedido contiene un valor inválido en ${field}.`)
  }

  return numberValue
}

function readString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`El pedido contiene un valor inválido en ${field}.`)
  }

  return value
}

function readStatus(value: unknown): OrderStatus {
  if (value === 'pending' || value === 'confirmed' || value === 'cancelled') return value
  throw new Error('El pedido contiene un estado desconocido.')
}

function readPaymentMethod(value: unknown): OrderPaymentMethod {
  if (value === 'simulated_card' || value === 'simulated_transfer') return value
  throw new Error('El pedido contiene un método de pago desconocido.')
}

function readShippingMethod(value: unknown): OrderShippingMethod {
  if (value === 'standard' || value === 'express') return value
  throw new Error('El pedido contiene un método de envío desconocido.')
}

function readItems(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('El pedido no contiene una lista de productos válida.')
  }

  return value
}

function readItemSnapshot(value: unknown): OrderItemSnapshot {
  if (!value || typeof value !== 'object') {
    throw new Error('El pedido contiene un producto inválido.')
  }

  const row = value as Record<string, unknown>

  return {
    id: readString(row.id, 'producto.id'),
    productId: typeof row.product_id === 'string' ? row.product_id : null,
    productName: readString(row.product_name, 'producto.nombre'),
    unitPrice: readNumber(row.unit_price, 'producto.precio'),
    quantity: readNumber(row.quantity, 'producto.cantidad'),
    lineTotal: readNumber(row.line_total, 'producto.total'),
    createdAt: readString(row.created_at, 'producto.fecha'),
  }
}

function mapOrderListItem(row: OrderListRow): OrderListItem {
  const totalUnits = readItems(row.items).reduce<number>(
    (total, item) => {
      if (!item || typeof item !== 'object') {
        throw new Error('El pedido contiene una cantidad inválida.')
      }

      return total + readNumber((item as Record<string, unknown>).quantity, 'producto.cantidad')
    },
    0,
  )

  return {
    id: readString(row.id, 'id'),
    status: readStatus(row.status),
    total: readNumber(row.total, 'total'),
    totalUnits,
    paymentMethod: readPaymentMethod(row.payment_method),
    createdAt: readString(row.created_at, 'fecha'),
  }
}

function mapOrderDetail(row: OrderDetailRow): OrderDetail {
  return {
    id: readString(row.id, 'id'),
    status: readStatus(row.status),
    subtotal: readNumber(row.subtotal, 'subtotal'),
    discount: readNumber(row.discount, 'descuento'),
    shippingCost: readNumber(row.shipping_cost, 'envío'),
    total: readNumber(row.total, 'total'),
    couponCode: typeof row.coupon_code === 'string' ? row.coupon_code : null,
    shippingName: readString(row.shipping_name, 'nombre de envío'),
    shippingAddress: readString(row.shipping_address, 'dirección'),
    shippingCity: readString(row.shipping_city, 'ciudad'),
    shippingPostalCode: readString(row.shipping_postal_code, 'código postal'),
    shippingMethod: readShippingMethod(row.shipping_method),
    paymentMethod: readPaymentMethod(row.payment_method),
    createdAt: readString(row.created_at, 'fecha'),
    items: readItems(row.items).map(readItemSnapshot),
  }
}

export async function getOrders(userId: string): Promise<OrderListItem[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      payment_method,
      created_at,
      items:order_items!order_items_order_id_fkey (quantity)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(`No se pudieron cargar tus pedidos: ${error.message}`)
  }

  return (data as unknown as OrderListRow[]).map(mapOrderListItem)
}

export async function getOrderById(userId: string, orderId: string): Promise<OrderDetail | null> {
  if (!UUID_PATTERN.test(orderId)) return null

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      status,
      subtotal,
      discount,
      shipping_cost,
      total,
      coupon_code,
      shipping_name,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_method,
      payment_method,
      created_at,
      items:order_items!order_items_order_id_fkey (
        id,
        product_id,
        product_name,
        unit_price,
        quantity,
        line_total,
        created_at
      )
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo cargar el pedido: ${error.message}`)
  }

  return data ? mapOrderDetail(data) : null
}
