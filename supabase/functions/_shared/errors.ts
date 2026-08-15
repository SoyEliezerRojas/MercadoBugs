interface FunctionError {
  body: Record<string, unknown>
  status: number
}

const messages: Record<string, string> = {
  auth_required: 'Debes iniciar sesión para continuar.',
  cart_changed: 'Tu carrito cambió durante el checkout. Revísalo e intenta nuevamente.',
  cart_empty: 'Tu carrito está vacío.',
  cart_not_found: 'No encontramos un carrito activo.',
  checkout_request_conflict: 'Este identificador de compra ya fue utilizado.',
  coupon_expired: 'Cupón expirado.',
  coupon_inactive: 'Cupón no válido.',
  coupon_minimum_purchase: 'El carrito no alcanza la compra mínima requerida por este cupón.',
  coupon_not_found: 'Cupón no válido.',
  coupon_not_started: 'Este cupón todavía no está vigente.',
  insufficient_stock: 'Uno o más productos ya no tienen stock suficiente.',
  invalid_cart_quantity: 'El carrito contiene una cantidad inválida.',
  invalid_coupon_action: 'La operación de cupón no es válida.',
  invalid_coupon_code: 'Ingresa un código de cupón válido.',
  invalid_payment_method: 'Selecciona un método de pago válido.',
  invalid_shipping_address: 'Ingresa una dirección válida.',
  invalid_shipping_city: 'Ingresa una ciudad válida.',
  invalid_shipping_method: 'Selecciona un método de envío válido.',
  invalid_shipping_name: 'Ingresa un nombre completo válido.',
  invalid_shipping_postal_code: 'Ingresa un código postal válido.',
  product_unavailable: 'Uno o más productos ya no están disponibles.',
}

function parseDetails(details: string | null | undefined): Record<string, unknown> | null {
  if (!details) return null

  try {
    const parsed: unknown = JSON.parse(details)
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

export function mapDatabaseError(
  error: { details?: string | null; message?: string | null },
  fallbackMessage: string,
): FunctionError {
  const code = error.message ?? 'unexpected_error'
  const knownMessage = messages[code]

  if (!knownMessage) {
    console.error('[MercadoBugs Edge] Error de base de datos no esperado.', {
      code,
      details: error.details,
    })
    return {
      status: 500,
      body: { code: 'unexpected_error', message: fallbackMessage },
    }
  }

  const details = parseDetails(error.details)
  const status = code === 'coupon_not_found' ? 404 : 409

  return {
    status,
    body: {
      code,
      message: knownMessage,
      ...(details ? { details } : {}),
    },
  }
}
