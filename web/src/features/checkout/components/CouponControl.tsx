import { useState, type KeyboardEvent } from 'react'
import { formatCurrency } from '../../catalog/utils/formatCurrency'
import { useApplyCoupon, useRemoveCoupon } from '../hooks/useCheckout'
import type { CheckoutPricing, ShippingMethod } from '../types'
import { CheckoutOperationError } from '../types'

interface CouponControlProps {
  pricing: CheckoutPricing | null
  shippingMethod: ShippingMethod | null
  userId: string
}

function couponDescription(pricing: CheckoutPricing): string {
  const coupon = pricing.coupon

  if (!coupon) return ''
  return coupon.discountType === 'percentage'
    ? `-${coupon.discountValue}%`
    : `-${formatCurrency(coupon.discountValue)}`
}

function couponErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null

  if (error instanceof CheckoutOperationError && error.code === 'coupon_minimum_purchase') {
    const minimum = error.details?.minimumPurchase
    const numericMinimum = typeof minimum === 'number' || typeof minimum === 'string'
      ? Number(minimum)
      : Number.NaN

    if (Number.isFinite(numericMinimum)) {
      return `Este cupón requiere una compra mínima de ${formatCurrency(numericMinimum)}.`
    }
  }

  return error.message
}

export function CouponControl({ pricing, shippingMethod, userId }: CouponControlProps) {
  const [code, setCode] = useState('')
  const applyMutation = useApplyCoupon(userId, shippingMethod)
  const removeMutation = useRemoveCoupon(userId, shippingMethod)
  const isBusy = applyMutation.isPending || removeMutation.isPending
  const errorMessage = couponErrorMessage(applyMutation.error) ?? couponErrorMessage(removeMutation.error)

  function handleApply() {
    const normalizedCode = code.trim().toUpperCase()

    if (!normalizedCode) return

    applyMutation.mutate(normalizedCode, {
      onSuccess: () => setCode(''),
    })
  }

  if (pricing?.coupon) {
    return (
      <div className="coupon-control coupon-control--applied">
        <div>
          <span>Código promocional</span>
          <strong>{pricing.coupon.code} aplicado</strong>
          <small>{couponDescription(pricing)} · Ahorras {formatCurrency(pricing.discount)}</small>
        </div>
        <button
          className="coupon-control__remove"
          disabled={isBusy}
          onClick={() => removeMutation.mutate()}
          type="button"
        >
          {removeMutation.isPending ? 'Quitando…' : 'Quitar'}
        </button>
        {errorMessage && <p className="coupon-control__error" role="alert">{errorMessage}</p>}
      </div>
    )
  }

  return (
    <div className="coupon-control">
      <label htmlFor={`coupon-code-${shippingMethod ?? 'cart'}`}>Código promocional</label>
      <div className="coupon-control__form">
        <input
          autoComplete="off"
          disabled={isBusy}
          id={`coupon-code-${shippingMethod ?? 'cart'}`}
          maxLength={40}
          onChange={(event) => {
            setCode(event.target.value.toUpperCase())
            applyMutation.reset()
          }}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleApply()
            }
          }}
          placeholder="BIENVENIDO10"
          value={code}
        />
        <button
          className="button button--secondary button--compact"
          disabled={isBusy || !code.trim()}
          onClick={handleApply}
          type="button"
        >
          {applyMutation.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {pricing?.notice && (
        <p className="coupon-control__notice" role="status">
          El cupón anterior dejó de ser válido y fue retirado.
        </p>
      )}
      {errorMessage && <p className="coupon-control__error" role="alert">{errorMessage}</p>}
    </div>
  )
}
