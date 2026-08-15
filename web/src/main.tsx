import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from './App'
import { AuthProvider } from './features/auth/AuthProvider'
import { checkSupabaseConnection } from './lib/supabase'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

const rootElement = document.getElementById('root')

if (import.meta.env.DEV) {
  void checkSupabaseConnection()
    .then(() => {
      console.info('[MercadoBugs] Conexión con Supabase local verificada.')
    })
    .catch((error: unknown) => {
      console.error('[MercadoBugs] No se pudo conectar con Supabase local.', error)
    })
}

if (!rootElement) {
  throw new Error('No se encontró el elemento raíz de la aplicación.')
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
