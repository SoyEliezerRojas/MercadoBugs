const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface LoginFormErrors {
  email?: string
  password?: string
}

export interface RegisterFormErrors extends LoginFormErrors {
  confirmPassword?: string
  username?: string
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validateLogin(email: string, password: string): LoginFormErrors {
  const errors: LoginFormErrors = {}
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    errors.email = 'Ingresa tu email.'
  } else if (!emailPattern.test(normalizedEmail)) {
    errors.email = 'Ingresa un email válido.'
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña.'
  }

  return errors
}

export function validateRegistration(
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
): RegisterFormErrors {
  const errors: RegisterFormErrors = validateLogin(email, password)
  const normalizedUsername = username.trim()

  if (!normalizedUsername) {
    errors.username = 'Ingresa un nombre de usuario.'
  } else if (!usernamePattern.test(normalizedUsername)) {
    errors.username = 'Usa entre 3 y 20 letras, números o guiones bajos.'
  }

  if (password && password.length < 8) {
    errors.password = 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.'
  }

  return errors
}
