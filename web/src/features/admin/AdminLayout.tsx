import { NavLink, Outlet } from 'react-router-dom'

const adminNavigation = [
  { to: '/admin', label: 'Inicio', end: true },
  { to: '/admin/bugs', label: 'Bugs conocidos', end: false },
] as const

export function AdminLayout() {
  return (
    <div className="admin-area">
      <div className="admin-nav-wrap page-width">
        <nav aria-label="Navegación administrativa" className="admin-nav">
          <span className="admin-nav__label">Administración</span>
          {adminNavigation.map((item) => (
            <NavLink
              className={({ isActive }) =>
                isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'
              }
              end={item.end}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
