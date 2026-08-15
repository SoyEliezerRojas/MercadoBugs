import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { AuthLoadingPage } from './AuthLoadingPage'

export function AdminRoute() {
  const location = useLocation()
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) return <AuthLoadingPage />

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (role !== 'admin') {
    return <Navigate replace to="/forbidden" />
  }

  return <Outlet />
}
