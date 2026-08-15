import { useMemo, useState, type FormEvent } from 'react'
import { useIsMutating } from '@tanstack/react-query'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { useCart } from '../../cart/hooks/useCart'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import { CheckoutSummary } from '../components/CheckoutSummary'
import { CouponControl } from '../components/CouponControl'
import { checkoutKeys, useCheckoutPricing, usePerformCheckout } from '../hooks/useCheckout'
import type { PaymentMethod, ShippingMethod } from '../types'

interface FormValues {
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  shippingMethod: ShippingMethod
  paymentMethod: PaymentMethod
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const initialValues: FormValues = {
  shippingName: '',
  shippingAddress: '',
  shippingCity: '',
  shippingPostalCode: '',
  shippingMethod: 'standard',
  paymentMethod: 'simulated_card',
}

function cartVersion(cart: ReturnType<typeof useCart>['data']): string {
  if (!cart) return 'none'
  return [cart.updatedAt, ...cart.items.map((item) => `${item.id}:${item.quantity}:${item.updatedAt}`)].join('|')
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const nameLength = values.shippingName.trim().length
  const addressLength = values.shippingAddress.trim().length
  const cityLength = values.shippingCity.trim().length
  const postalLength = values.shippingPostalCode.trim().length

  if (nameLength < 2 || nameLength > 100) errors.shippingName = 'Ingresa un nombre de 2 a 100 caracteres.'
  if (addressLength < 5 || addressLength > 200) errors.shippingAddress = 'Ingresa una dirección de 5 a 200 caracteres.'
  if (cityLength < 2 || cityLength > 100) errors.shippingCity = 'Ingresa una ciudad de 2 a 100 caracteres.'
  if (postalLength < 2 || postalLength > 20) errors.shippingPostalCode = 'Ingresa un código postal de 2 a 20 caracteres.'

  return errors
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const cartQuery = useCart(userId)
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [checkoutRequestId] = useState(() => crypto.randomUUID())
  const version = useMemo(() => cartVersion(cartQuery.data), [cartQuery.data])
  const pricingQuery = useCheckoutPricing(
    userId,
    values.shippingMethod,
    version,
    Boolean(userId && cartQuery.data?.items.length),
  )
  const checkoutMutation = usePerformCheckout(userId)
  const isChangingCoupon = useIsMutating({ mutationKey: [...checkoutKeys.all, 'coupon'] }) > 0
  const cart = cartQuery.data

  if (cartQuery.isPending) {
    return <div aria-busy="true" className="checkout-page checkout-page--state page-width">Cargando checkout…</div>
  }

  if (cartQuery.isError) {
    return (
      <div className="checkout-page checkout-page--state page-width">
        <h1>No pudimos preparar el checkout</h1>
        <p>Vuelve al carrito e inténtalo nuevamente.</p>
        <Link className="button button--primary" to="/cart">Volver al carrito</Link>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return <Navigate replace to="/cart" />
  }

  const hasUnavailableItem = cart.items.some((item) => !item.product || item.quantity > item.product.stock)

  function updateField<Key extends keyof FormValues>(field: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    checkoutMutation.reset()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateForm(values)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    checkoutMutation.mutate(
      {
        checkoutRequestId,
        shippingName: values.shippingName.trim(),
        shippingAddress: values.shippingAddress.trim(),
        shippingCity: values.shippingCity.trim(),
        shippingPostalCode: values.shippingPostalCode.trim(),
        shippingMethod: values.shippingMethod,
        paymentMethod: values.paymentMethod,
      },
      {
        onSuccess: (order) => {
          void navigate(`/orders/${order.id}`, {
            replace: true,
            state: { checkoutCompleted: true },
          })
        },
      },
    )
  }

  return (
    <div className="checkout-page page-width">
      <header className="checkout-page__header">
        <span className="eyebrow">Compra simulada</span>
        <h1>Finalizar compra</h1>
        <p>No ingreses datos bancarios reales. Esta tienda es un entorno de testing.</p>
      </header>

      <div className="checkout-page__layout">
        <form className="checkout-form" noValidate onSubmit={handleSubmit}>
          <section className="checkout-section">
            <span className="checkout-section__number">01</span>
            <div>
              <h2>Datos de envío</h2>
              <p>Usa información ficticia para completar el ejercicio.</p>
            </div>

            <div className="checkout-fields">
              <div className="form-field checkout-field--full">
                <label htmlFor="shipping-name">Nombre completo</label>
                <input
                  aria-invalid={Boolean(errors.shippingName)}
                  autoComplete="name"
                  id="shipping-name"
                  maxLength={100}
                  onChange={(event) => updateField('shippingName', event.target.value)}
                  value={values.shippingName}
                />
                {errors.shippingName && <small role="alert">{errors.shippingName}</small>}
              </div>

              <div className="form-field checkout-field--full">
                <label htmlFor="shipping-address">Dirección</label>
                <input
                  aria-invalid={Boolean(errors.shippingAddress)}
                  autoComplete="street-address"
                  id="shipping-address"
                  maxLength={200}
                  onChange={(event) => updateField('shippingAddress', event.target.value)}
                  value={values.shippingAddress}
                />
                {errors.shippingAddress && <small role="alert">{errors.shippingAddress}</small>}
              </div>

              <div className="form-field">
                <label htmlFor="shipping-city">Ciudad</label>
                <input
                  aria-invalid={Boolean(errors.shippingCity)}
                  autoComplete="address-level2"
                  id="shipping-city"
                  maxLength={100}
                  onChange={(event) => updateField('shippingCity', event.target.value)}
                  value={values.shippingCity}
                />
                {errors.shippingCity && <small role="alert">{errors.shippingCity}</small>}
              </div>

              <div className="form-field">
                <label htmlFor="shipping-postal-code">Código postal</label>
                <input
                  aria-invalid={Boolean(errors.shippingPostalCode)}
                  autoComplete="postal-code"
                  id="shipping-postal-code"
                  maxLength={20}
                  onChange={(event) => updateField('shippingPostalCode', event.target.value)}
                  value={values.shippingPostalCode}
                />
                {errors.shippingPostalCode && <small role="alert">{errors.shippingPostalCode}</small>}
              </div>
            </div>
          </section>

          <section className="checkout-section">
            <span className="checkout-section__number">02</span>
            <div>
              <h2>Método de envío</h2>
              <p>El precio proviene del servidor y se incluye en el total.</p>
            </div>
            <div className="checkout-options">
              {(pricingQuery.data?.shippingOptions ?? []).map((option) => (
                <label className="checkout-option" key={option.method}>
                  <input
                    checked={values.shippingMethod === option.method}
                    name="shipping-method"
                    onChange={() => updateField('shippingMethod', option.method)}
                    type="radio"
                  />
                  <span>
                    <strong>{option.method === 'standard' ? 'Envío estándar' : 'Envío express'}</strong>
                    <small>{option.method === 'standard' ? 'Entrega simulada regular' : 'Entrega simulada prioritaria'}</small>
                  </span>
                  <b>{formatCurrency(option.cost)}</b>
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-section">
            <span className="checkout-section__number">03</span>
            <div>
              <h2>Método de pago</h2>
              <p>Pago completamente simulado; no se procesará dinero real.</p>
            </div>
            <div className="checkout-options">
              <label className="checkout-option">
                <input
                  checked={values.paymentMethod === 'simulated_card'}
                  name="payment-method"
                  onChange={() => updateField('paymentMethod', 'simulated_card')}
                  type="radio"
                />
                <span><strong>Tarjeta simulada</strong><small>Sin número, CVV ni vencimiento</small></span>
              </label>
              <label className="checkout-option">
                <input
                  checked={values.paymentMethod === 'simulated_transfer'}
                  name="payment-method"
                  onChange={() => updateField('paymentMethod', 'simulated_transfer')}
                  type="radio"
                />
                <span><strong>Transferencia simulada</strong><small>Sin datos bancarios reales</small></span>
              </label>
            </div>
          </section>

          <section className="checkout-section checkout-section--coupon">
            <span className="checkout-section__number">04</span>
            <div><h2>Cupón</h2><p>El cupón aplicado permanece guardado en tu carrito.</p></div>
            <CouponControl pricing={pricingQuery.data ?? null} shippingMethod={values.shippingMethod} userId={userId} />
          </section>

          {pricingQuery.isError && (
            <div className="form-alert form-alert--error" role="alert">
              {pricingQuery.error instanceof Error ? pricingQuery.error.message : 'No pudimos calcular el total.'}
            </div>
          )}
          {checkoutMutation.isError && (
            <div className="form-alert form-alert--error" role="alert">
              {checkoutMutation.error instanceof Error
                ? checkoutMutation.error.message
                : 'No pudimos procesar tu compra. Intenta nuevamente.'}
            </div>
          )}

          <button
            className="button button--primary checkout-submit"
            disabled={
              checkoutMutation.isPending
              || isChangingCoupon
              || pricingQuery.isPending
              || pricingQuery.isError
              || hasUnavailableItem
            }
            type="submit"
          >
            {checkoutMutation.isPending ? 'Procesando…' : 'Confirmar compra'}
          </button>
        </form>

        <CheckoutSummary cart={cart} pricing={pricingQuery.data ?? null} />
      </div>
    </div>
  )
}
