import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { AuthLoadingPage } from './AuthLoadingPage'

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingPage />

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
