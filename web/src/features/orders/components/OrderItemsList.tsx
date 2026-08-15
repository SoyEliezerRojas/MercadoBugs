import { formatCurrency } from '../../catalog/utils/formatCurrency'
import type { OrderItemSnapshot } from '../types'

interface OrderItemsListProps {
  items: OrderItemSnapshot[]
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <section className="order-panel" aria-labelledby="order-products-title">
      <div className="order-panel__heading">
        <span className="order-panel__number">01</span>
        <div>
          <h2 id="order-products-title">Productos</h2>
          <p>Nombre y precio conservados al confirmar la compra.</p>
        </div>
      </div>

      <ul className="order-products">
        {items.map((item) => (
          <li key={item.id}>
            <div className="order-product__mark" aria-hidden="true">MB</div>
            <div className="order-product__main">
              <h3>{item.productName}</h3>
              <p>{formatCurrency(item.unitPrice)} por unidad</p>
            </div>
            <div className="order-product__quantity">
              <span>Cantidad</span>
              <strong>{item.quantity}</strong>
            </div>
            <div className="order-product__total">
              <span>Total de línea</span>
              <strong>{formatCurrency(item.lineTotal)}</strong>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
