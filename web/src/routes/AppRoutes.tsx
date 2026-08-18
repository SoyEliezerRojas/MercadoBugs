import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AdminLayout } from '../features/admin/AdminLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { CartPage } from '../features/cart/pages/CartPage'
import { CheckoutPage } from '../features/checkout/pages/CheckoutPage'
import { CheckoutSuccessPage } from '../features/checkout/pages/CheckoutSuccessPage'
import { ProductDetailPage } from '../features/catalog/pages/ProductDetailPage'
import { ProductsPage } from '../features/catalog/pages/ProductsPage'
import { OrderDetailPage } from '../features/orders/pages/OrderDetailPage'
import { OrdersPage } from '../features/orders/pages/OrdersPage'
import { AdminRoute } from './AdminRoute'
import { ForbiddenPage } from './ForbiddenPage'
import { HomePage } from './HomePage'
import { NotFoundPage } from './NotFoundPage'
import { PhasePlaceholderPage } from './PhasePlaceholderPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

const adminRoutes = [
  { path: 'admin/users', title: 'Usuarios', phase: 13, description: 'Consulta administrativa de testers.' },
] as const

const AdminHomePage = lazy(() => import('../features/admin/pages/AdminHomePage').then((module) => ({
  default: module.AdminHomePage,
})))
const BugDefinitionsPage = lazy(() => import('../features/admin/bugs/pages/BugDefinitionsPage').then((module) => ({
  default: module.BugDefinitionsPage,
})))
const BugDefinitionDetailPage = lazy(() => import('../features/admin/bugs/pages/BugDefinitionDetailPage').then((module) => ({
  default: module.BugDefinitionDetailPage,
})))

function AdminPageLoading() {
  return <div aria-busy="true" className="admin-lazy-loading page-width">Cargando administración…</div>
}

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
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="checkout/success/:orderId" element={<CheckoutSuccessPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="admin" element={<Suspense fallback={<AdminPageLoading />}><AdminHomePage /></Suspense>} />
            <Route path="admin/bugs" element={<Suspense fallback={<AdminPageLoading />}><BugDefinitionsPage /></Suspense>} />
            <Route path="admin/bugs/:code" element={<Suspense fallback={<AdminPageLoading />}><BugDefinitionDetailPage /></Suspense>} />
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
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
