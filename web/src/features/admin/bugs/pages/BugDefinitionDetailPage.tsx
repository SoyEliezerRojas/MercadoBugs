import { Link, useParams } from 'react-router-dom'
import { BugDefinitionBadges } from '../components/BugDefinitionBadges'
import { useBugDefinition } from '../hooks/useBugDefinitions'
import { getBugCategoryLabel } from '../utils/bugPresentation'

export function BugDefinitionDetailPage() {
  const { code = '' } = useParams()
  const bugQuery = useBugDefinition(code)

  if (bugQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando detalle del bug" className="admin-bug-detail page-width">
        <div className="admin-bug-detail__skeleton"><div /><div /><div /></div>
      </div>
    )
  }

  if (bugQuery.isError) {
    return (
      <div className="admin-state page-width">
        <span className="eyebrow">Catálogo interno</span>
        <h1>No pudimos cargar la definición</h1>
        <p>Comprueba tu conexión y tus permisos administrativos.</p>
        <button className="button button--primary" onClick={() => { void bugQuery.refetch() }} type="button">
          Reintentar
        </button>
      </div>
    )
  }

  const bug = bugQuery.data

  if (!bug) {
    return (
      <div className="admin-state page-width">
        <span className="eyebrow">Catálogo interno</span>
        <h1>Bug no encontrado</h1>
        <p>La definición solicitada no existe en el catálogo oficial.</p>
        <Link className="button button--primary" to="/admin/bugs">Volver a bugs conocidos</Link>
      </div>
    )
  }

  return (
    <article className="admin-bug-detail page-width">
      <Link className="admin-bug-detail__back" to="/admin/bugs"><span aria-hidden="true">←</span> Bugs conocidos</Link>

      <header className="admin-bug-detail__header">
        <div>
          <span className="eyebrow">{bug.code}</span>
          <h1>{bug.name}</h1>
          <p>{bug.description}</p>
        </div>
        <BugDefinitionBadges severity={bug.severity} status={bug.status} />
      </header>

      <dl className="bug-definition-meta">
        <div><dt>Código</dt><dd>{bug.code}</dd></div>
        <div><dt>Categoría</dt><dd>{getBugCategoryLabel(bug.category)}</dd></div>
      </dl>

      <div className="bug-definition-sections">
        <section>
          <span className="bug-definition-section__number">01</span>
          <div><h2>Precondiciones</h2><p>{bug.preconditions}</p></div>
        </section>
        <section>
          <span className="bug-definition-section__number">02</span>
          <div><h2>Pasos para reproducir</h2><p>{bug.reproductionSteps}</p></div>
        </section>
        <section className="bug-definition-section--expected">
          <span className="bug-definition-section__number">03</span>
          <div><h2>Resultado esperado</h2><p>{bug.expectedResult}</p></div>
        </section>
        <section className="bug-definition-section--actual">
          <span className="bug-definition-section__number">04</span>
          <div>
            <h2>Resultado actual planificado</h2>
            <p>{bug.actualResult}</p>
            <small>Este comportamiento todavía no está habilitado.</small>
          </div>
        </section>
      </div>
    </article>
  )
}
