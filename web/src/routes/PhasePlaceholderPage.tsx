import { Link } from 'react-router-dom'

interface PhasePlaceholderPageProps {
  description: string
  phase: number
  title: string
}

export function PhasePlaceholderPage({
  description,
  phase,
  title,
}: PhasePlaceholderPageProps) {
  return (
    <section className="placeholder page-width">
      <span className="phase-badge">Fase {phase}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="placeholder__note">
        Esta ruta ya forma parte del mapa de navegación, pero su funcionalidad se incorporará en la
        fase indicada.
      </div>
      <Link className="button button--secondary" to="/">
        Volver al inicio
      </Link>
    </section>
  )
}
