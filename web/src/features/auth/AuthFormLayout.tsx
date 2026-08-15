import type { ReactNode } from 'react'

interface AuthFormLayoutProps {
  children: ReactNode
  eyebrow: string
  footer: ReactNode
  subtitle: string
  title: string
}

export function AuthFormLayout({
  children,
  eyebrow,
  footer,
  subtitle,
  title,
}: AuthFormLayoutProps) {
  return (
    <section className="auth-page page-width">
      <div className="auth-panel">
        <div className="auth-panel__intro">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="auth-panel__assurance">
            <span aria-hidden="true">✓</span>
            <p>
              Este es un entorno ficticio. Utiliza siempre información de prueba y nunca una
              contraseña personal.
            </p>
          </div>
        </div>

        <div className="auth-card">
          {children}
          <div className="auth-card__footer">{footer}</div>
        </div>
      </div>
    </section>
  )
}
