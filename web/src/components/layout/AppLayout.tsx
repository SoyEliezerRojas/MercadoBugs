import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

const navigation = [
  { to: '/', label: 'Inicio' },
  { to: '/products', label: 'Productos' },
]

export function AppLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, profile, profileError, role, signOut } = useAuth()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleSignOut() {
    if (isSigningOut) return

    setIsSigningOut(true)
    setLogoutError(null)

    try {
      await signOut()
      void navigate('/', { replace: true })
    } catch {
      setLogoutError('No pudimos cerrar la sesión. Intenta nuevamente.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-header__content">
          <NavLink aria-label="MercadoBugs, ir al inicio" className="brand" to="/">
            <span aria-hidden="true" className="brand__mark">
              MB
            </span>
            <span>
              <strong>MercadoBugs</strong>
              <small>QA Testing Playground</small>
            </span>
          </NavLink>

          <nav aria-label="Navegación principal" className="main-nav">
            {navigation.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'main-nav__link main-nav__link--active' : 'main-nav__link'
                }
                end={item.to === '/'}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            {isLoading ? (
              <span aria-label="Cargando sesión" className="auth-skeleton" />
            ) : isAuthenticated ? (
              <>
                {role === 'admin' && (
                  <NavLink className="button button--ghost button--compact" to="/admin">
                    Admin
                  </NavLink>
                )}
                <span className="user-chip" title={profile?.username}>
                  {profile?.username ?? 'Perfil no disponible'}
                </span>
                <button
                  className="button button--ghost button--compact"
                  disabled={isSigningOut}
                  onClick={() => void handleSignOut()}
                  type="button"
                >
                  {isSigningOut ? 'Saliendo...' : 'Cerrar sesión'}
                </button>
              </>
            ) : (
              <>
                <NavLink className="button button--ghost button--compact" to="/login">
                  Iniciar sesión
                </NavLink>
                <NavLink className="button button--primary button--compact" to="/register">
                  Registrarse
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      {(profileError || logoutError) && (
        <div className="session-notice" role="alert">
          <div className="page-width">{logoutError ?? profileError}</div>
        </div>
      )}

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__content">
          <p>
            <strong>MercadoBugs</strong> · Un espacio para practicar testing funcional.
          </p>
          <p>
            Entorno ficticio de entrenamiento. Todos los productos, pagos y pedidos son simulados.
          </p>
        </div>
      </footer>
    </div>
  )
}
