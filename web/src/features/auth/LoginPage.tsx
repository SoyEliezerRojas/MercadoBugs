import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthFormLayout } from './AuthFormLayout'
import { getAuthErrorMessage } from './authErrors'
import { normalizeEmail, validateLogin, type LoginFormErrors } from './validation'

interface RedirectState {
  from?: {
    hash?: string
    pathname?: string
    search?: string
  }
}

function getDestination(state: RedirectState | null): string {
  const from = state?.from

  if (!from?.pathname) return '/'

  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const nextErrors = validateLogin(email, password)
    setErrors(nextErrors)
    setRequestError(null)

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      })

      if (error) throw error

      void navigate(getDestination(location.state as RedirectState | null), { replace: true })
    } catch (error) {
      setRequestError(getAuthErrorMessage(error, 'login'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormLayout
      eyebrow="Bienvenido de nuevo"
      footer={
        <p>
          ¿Todavía no tienes una cuenta? <Link to="/register">Regístrate</Link>
        </p>
      }
      subtitle="Continúa explorando escenarios y registrando tus hallazgos."
      title="Inicia sesión"
    >
      <form
        className="auth-form"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(event)
        }}
      >
        {requestError && (
          <div aria-live="polite" className="form-alert form-alert--error" role="alert">
            {requestError}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="login-email">Email</label>
          <input
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tester@example.com"
            required
            type="email"
            value={email}
          />
          {errors.email && <span id="login-email-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            id="login-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            required
            type="password"
            value={password}
          />
          {errors.password && <span id="login-password-error">{errors.password}</span>}
        </div>

        <button className="button button--primary auth-form__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthFormLayout>
  )
}
