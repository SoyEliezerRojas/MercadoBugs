import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2.112.3'

interface AuthenticatedClient {
  client: SupabaseClient
  user: User
}

export async function createAuthenticatedClient(request: Request): Promise<AuthenticatedClient | null> {
  const authorization = request.headers.get('authorization')
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return null
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
  const { data, error } = await client.auth.getUser(token)

  if (error || !data.user) {
    return null
  }

  return { client, user: data.user }
}
