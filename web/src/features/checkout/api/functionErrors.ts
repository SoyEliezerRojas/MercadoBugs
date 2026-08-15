import { CheckoutOperationError } from '../types'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function readFunctionBody(error: unknown): Promise<Record<string, unknown> | null> {
  if (!isRecord(error) || !(error.context instanceof Response)) {
    return null
  }

  try {
    const body: unknown = await error.context.json()
    return isRecord(body) ? body : null
  } catch {
    return null
  }
}

export async function functionError(
  error: unknown,
  fallbackMessage: string,
): Promise<CheckoutOperationError> {
  const body = await readFunctionBody(error)
  const code = typeof body?.code === 'string' ? body.code : 'function_unavailable'
  const message = typeof body?.message === 'string' ? body.message : fallbackMessage
  const details = isRecord(body?.details) ? body.details : null

  return new CheckoutOperationError(code, message, details)
}
