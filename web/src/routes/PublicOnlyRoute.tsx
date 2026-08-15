import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { AuthLoadingPage } from './AuthLoadingPage'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <AuthLoadingPage />

  return isAuthenticated ? <Navigate replace to="/" /> : <Outlet />
}
