import { Link } from 'react-router-dom'

export function AdminHomePage() {
  return (
    <div className="admin-home page-width">
      <header className="admin-page-header">
        <span className="eyebrow">Área privada</span>
        <h1>Administración</h1>
        <p>Herramientas internas para mantener el laboratorio MercadoBugs.</p>
      </header>

      <section className="admin-home__grid" aria-label="Secciones administrativas disponibles">
        <article className="admin-home-card">
          <span className="admin-home-card__mark" aria-hidden="true">05</span>
          <div>
            <span className="admin-home-card__eyebrow">Fase 10</span>
            <h2>Bugs conocidos</h2>
            <p>Consulta el catálogo oficial de defectos planificados y sus casos de reproducción.</p>
          </div>
          <Link className="button button--primary" to="/admin/bugs">Abrir catálogo</Link>
        </article>
      </section>
    </div>
  )
}
