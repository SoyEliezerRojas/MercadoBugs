import { createClient } from '@supabase/supabase-js'

function requireEnvironmentVariable(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Falta ${name}. Copia .env.example como web/.env.local y configura Supabase antes de iniciar la aplicación.`,
    )
  }

  return value
}

const supabaseUrl = requireEnvironmentVariable(
  'VITE_SUPABASE_URL',
  import.meta.env.VITE_SUPABASE_URL,
)

const supabasePublishableKey = requireEnvironmentVariable(
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
  },
})

/**
 * Performs a harmless request through Supabase JS without requiring an
 * application table. This is only called during local development.
 */
export async function checkSupabaseConnection(): Promise<void> {
  const { error } = await supabase.storage.listBuckets()

  if (error) {
    throw new Error(`Supabase local no respondió correctamente: ${error.message}`)
  }
}
