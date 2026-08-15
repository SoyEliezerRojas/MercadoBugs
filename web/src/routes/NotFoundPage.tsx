import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="placeholder page-width">
      <span className="phase-badge">404</span>
      <h1>Esta página no está en el catálogo</h1>
      <p>La dirección que ingresaste no corresponde a una ruta disponible.</p>
      <Link className="button button--primary" to="/">
        Ir al inicio
      </Link>
    </section>
  )
}
