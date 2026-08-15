import { Navigate, useParams } from 'react-router-dom'

export function CheckoutSuccessPage() {
  const { orderId = '' } = useParams()

  return <Navigate replace to={orderId ? `/orders/${orderId}` : '/orders'} />
}
