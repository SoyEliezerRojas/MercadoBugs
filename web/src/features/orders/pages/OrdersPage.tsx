import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { OrderCard } from '../components/OrderCard'
import { useOrders } from '../hooks/useOrders'

export function OrdersPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const ordersQuery = useOrders(userId)

  if (!userId) return null

  if (ordersQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando pedidos" className="orders-page page-width">
        <header className="orders-page__header orders-page__header--loading" />
        <div className="orders-page__skeleton"><div /><div /></div>
      </div>
    )
  }

  if (ordersQuery.isError) {
    return (
      <div className="orders-state page-width">
        <span className="eyebrow">Mis pedidos</span>
        <h1>No pudimos cargar tus pedidos</h1>
        <p>Revisa tu conexión e inténtalo nuevamente.</p>
        <button className="button button--primary" onClick={() => { void ordersQuery.refetch() }} type="button">
          Reintentar
        </button>
      </div>
    )
  }

  const orders = ordersQuery.data

  if (orders.length === 0) {
    return (
      <div className="orders-state page-width">
        <span aria-hidden="true" className="orders-empty__mark">MB</span>
        <span className="eyebrow">Mis pedidos</span>
        <h1>Aún no tienes pedidos</h1>
        <p>Cuando completes una compra simulada, aparecerá aquí.</p>
        <Link className="button button--primary" to="/products">Explorar productos</Link>
      </div>
    )
  }

  return (
    <div className="orders-page page-width">
      <header className="orders-page__header">
        <div>
          <span className="eyebrow">Tu historial</span>
          <h1>Mis pedidos</h1>
          <p>{orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}</p>
        </div>
        <Link className="button button--secondary" to="/products">Seguir comprando</Link>
      </header>

      <div className="orders-list">
        {orders.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>
    </div>
  )
}
