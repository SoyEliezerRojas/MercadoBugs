type AuthAction = 'login' | 'register'

export function getAuthErrorMessage(error: unknown, action: AuthAction): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (message.includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (message.includes('user already registered')) {
    return 'Ya existe una cuenta con ese email.'
  }

  if (
    message.includes('username_unavailable') ||
    (action === 'register' && message.includes('database error saving new user'))
  ) {
    return 'Ese nombre de usuario ya está en uso.'
  }

  if (message.includes('password') && (message.includes('short') || message.includes('characters'))) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('connection')
  ) {
    return 'No pudimos conectar con el servicio. Verifica tu conexión e intenta nuevamente.'
  }

  if (message.includes('email rate limit')) {
    return 'Se realizaron demasiados intentos. Espera un momento antes de continuar.'
  }

  return action === 'login'
    ? 'No pudimos iniciar sesión. Intenta nuevamente.'
    : 'No pudimos crear la cuenta. Revisa los datos e intenta nuevamente.'
}
