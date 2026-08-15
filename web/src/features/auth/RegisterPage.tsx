import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AuthFormLayout } from './AuthFormLayout'
import { getAuthErrorMessage } from './authErrors'
import {
  normalizeEmail,
  validateRegistration,
  type RegisterFormErrors,
} from './validation'

export function RegisterPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedUsername = username.trim()
    const nextErrors = validateRegistration(username, email, password, confirmPassword)
    setErrors(nextErrors)
    setRequestError(null)

    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)

    try {
      const availabilityResult = await supabase.rpc(
        'is_username_available',
        { candidate_username: normalizedUsername },
      )

      if (availabilityResult.error) throw availabilityResult.error

      if (availabilityResult.data !== true) {
        setErrors({ username: 'Ese nombre de usuario ya está en uso.' })
        return
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizeEmail(email),
        password,
        options: {
          data: {
            username: normalizedUsername,
          },
        },
      })

      if (error) throw error

      if (!data.session) {
        setRequestError(
          'La cuenta fue creada, pero requiere confirmación de email. Revisa la configuración de Supabase.',
        )
        return
      }

      void navigate('/', { replace: true })
    } catch (error) {
      setRequestError(getAuthErrorMessage(error, 'register'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFormLayout
      eyebrow="Comienza tu práctica"
      footer={
        <p>
          ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      }
      subtitle="Crea una identidad de tester para guardar tu progreso en MercadoBugs."
      title="Crea tu cuenta"
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
          <label htmlFor="register-username">Username</label>
          <input
            aria-describedby={errors.username ? 'register-username-error' : 'register-username-help'}
            aria-invalid={Boolean(errors.username)}
            autoCapitalize="none"
            autoComplete="username"
            id="register-username"
            maxLength={20}
            minLength={3}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="tester01"
            required
            type="text"
            value={username}
          />
          {errors.username ? (
            <span id="register-username-error">{errors.username}</span>
          ) : (
            <small id="register-username-help">3–20 caracteres: letras, números o _</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-email">Email</label>
          <input
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            id="register-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="tester01@example.com"
            required
            type="email"
            value={email}
          />
          {errors.email && <span id="register-email-error">{errors.email}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="register-password">Contraseña</label>
          <input
            aria-describedby={errors.password ? 'register-password-error' : 'register-password-help'}
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            id="register-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
            type="password"
            value={password}
          />
          {errors.password ? (
            <span id="register-password-error">{errors.password}</span>
          ) : (
            <small id="register-password-help">Utiliza al menos 8 caracteres.</small>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="register-confirm-password">Confirmar contraseña</label>
          <input
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            aria-invalid={Boolean(errors.confirmPassword)}
            autoComplete="new-password"
            id="register-confirm-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repite tu contraseña"
            required
            type="password"
            value={confirmPassword}
          />
          {errors.confirmPassword && (
            <span id="register-confirm-password-error">{errors.confirmPassword}</span>
          )}
        </div>

        <button className="button button--primary auth-form__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
    </AuthFormLayout>
  )
}
