export function AuthLoadingPage() {
  return (
    <section aria-busy="true" aria-live="polite" className="route-loader page-width">
      <span aria-hidden="true" className="route-loader__spinner" />
      <p>Comprobando tu sesión...</p>
    </section>
  )
}
