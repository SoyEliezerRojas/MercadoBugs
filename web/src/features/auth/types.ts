import type { User } from '@supabase/supabase-js'

export type AppRole = 'tester' | 'admin'

export interface Profile {
  id: string
  username: string
  role: AppRole
  created_at: string
  updated_at: string
}

export interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  profile: Profile | null
  profileError: string | null
  role: AppRole | null
  signOut: () => Promise<void>
  user: User | null
}
