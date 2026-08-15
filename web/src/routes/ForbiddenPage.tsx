import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <section className="placeholder page-width">
      <span className="phase-badge">403</span>
      <h1>No tienes permisos para acceder a esta página</h1>
      <p>Esta sección está disponible únicamente para administradores de MercadoBugs.</p>
      <Link className="button button--primary" to="/">
        Volver al inicio
      </Link>
    </section>
  )
}
