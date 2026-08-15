import { BugDefinitionCard } from '../components/BugDefinitionCard'
import { useBugDefinitions } from '../hooks/useBugDefinitions'

export function BugDefinitionsPage() {
  const bugsQuery = useBugDefinitions()

  if (bugsQuery.isPending) {
    return (
      <div aria-busy="true" aria-label="Cargando bugs conocidos" className="admin-bugs page-width">
        <header className="admin-page-header admin-page-header--loading" />
        <div className="admin-bugs__skeleton">
          {Array.from({ length: 5 }, (_, index) => <div key={index} />)}
        </div>
      </div>
    )
  }

  if (bugsQuery.isError) {
    return (
      <div className="admin-state page-width">
        <span className="eyebrow">Catálogo interno</span>
        <h1>No pudimos cargar los bugs conocidos</h1>
        <p>Comprueba tu conexión y tus permisos administrativos.</p>
        <button className="button button--primary" onClick={() => { void bugsQuery.refetch() }} type="button">
          Reintentar
        </button>
      </div>
    )
  }

  const bugs = bugsQuery.data

  return (
    <div className="admin-bugs page-width">
      <header className="admin-page-header">
        <span className="eyebrow">Catálogo interno</span>
        <h1>Bugs conocidos</h1>
        <p>
          Definiciones oficiales del laboratorio. En FASE 11 los cinco comportamientos están
          activos y disponibles para las prácticas de testing.
        </p>
      </header>

      {bugs.length === 0 ? (
        <section className="admin-bugs__empty">
          <h2>No hay bugs registrados</h2>
          <p>El catálogo administrativo todavía no contiene definiciones.</p>
        </section>
      ) : (
        <div className="admin-bugs__grid">
          {bugs.map((bug) => <BugDefinitionCard bug={bug} key={bug.id} />)}
        </div>
      )}
    </div>
  )
}
