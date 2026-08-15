import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ProductDetailPage } from '../features/catalog/pages/ProductDetailPage'
import { ProductsPage } from '../features/catalog/pages/ProductsPage'
import { AdminRoute } from './AdminRoute'
import { ForbiddenPage } from './ForbiddenPage'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { PhasePlaceholderPage } from './PhasePlaceholderPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

const authenticatedRoutes = [
  { path: 'cart', title: 'Tu carrito', phase: 7, description: 'Productos, cantidades y totales persistentes.' },
  { path: 'checkout', title: 'Finalizar compra', phase: 8, description: 'Checkout completamente simulado.' },
  { path: 'orders', title: 'Mis pedidos', phase: 9, description: 'Historial de pedidos del usuario.' },
  { path: 'orders/:id', title: 'Detalle del pedido', phase: 9, description: 'Productos y estado de un pedido.' },
  { path: 'report-bug', title: 'Reportar un bug', phase: 12, description: 'Formulario de hallazgos de testing.' },
  { path: 'my-reports', title: 'Mis reportes', phase: 12, description: 'Seguimiento de reportes enviados.' },
] as const

const adminRoutes = [
  { path: 'admin', title: 'Panel de administración', phase: 13, description: 'Resumen privado para administradores.' },
  { path: 'admin/users', title: 'Usuarios', phase: 13, description: 'Consulta administrativa de testers.' },
  { path: 'admin/reports', title: 'Revisión de reportes', phase: 13, description: 'Clasificación manual de hallazgos.' },
  { path: 'admin/bugs', title: 'Bugs conocidos', phase: 10, description: 'Registro interno protegido de defectos intencionales.' },
] as const

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="forbidden" element={<ForbiddenPage />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />

        <Route element={<ProtectedRoute />}>
          {authenticatedRoutes.map((route) => (
            <Route
              element={
                <PhasePlaceholderPage
                  description={route.description}
                  phase={route.phase}
                  title={route.title}
                />
              }
              key={route.path}
              path={route.path}
            />
          ))}
        </Route>

        <Route element={<AdminRoute />}>
          {adminRoutes.map((route) => (
            <Route
              element={
                <PhasePlaceholderPage
                  description={route.description}
                  phase={route.phase}
                  title={route.title}
                />
              }
              key={route.path}
              path={route.path}
            />
          ))}
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
