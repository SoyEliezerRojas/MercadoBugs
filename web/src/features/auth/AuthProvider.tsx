import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext } from './AuthContext'
import type { AuthContextValue, Profile } from './types'

interface AuthProviderProps {
  children: ReactNode
}

interface ProfileState {
  error: string | null
  isResolved: boolean
  profile: Profile | null
  userId: string | null
}

const emptyProfileState: ProfileState = {
  error: null,
  isResolved: true,
  profile: null,
  userId: null,
}

function profileStateForSession(
  currentState: ProfileState,
  nextSession: Session | null,
): ProfileState {
  const nextUserId = nextSession?.user.id ?? null

  if (currentState.userId === nextUserId) return currentState
  if (!nextUserId) return emptyProfileState

  return {
    error: null,
    isResolved: false,
    profile: null,
    userId: nextUserId,
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [profileState, setProfileState] = useState<ProfileState>(emptyProfileState)
  const [isSessionLoading, setIsSessionLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return

      if (error) {
        console.error('[MercadoBugs] No se pudo restaurar la sesión.', error)
      }

      setSession(data.session)
      setProfileState((currentState) => profileStateForSession(currentState, data.session))
      setIsSessionLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return

      setSession(nextSession)
      setProfileState((currentState) => profileStateForSession(currentState, nextSession))
      setIsSessionLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isCancelled = false
    const userId = session?.user.id

    if (!userId) {
      return () => {
        isCancelled = true
      }
    }

    void supabase
      .from('profiles')
      .select('id, username, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (isCancelled) return

        if (error) {
          setProfileState({
            error: 'Tu sesión está activa, pero no pudimos cargar tu perfil.',
            isResolved: true,
            profile: null,
            userId,
          })
          console.error('[MercadoBugs] Error al cargar el perfil.', error)
        } else if (!data) {
          setProfileState({
            error:
              'Tu cuenta no tiene un perfil asociado. Cierra sesión y contacta al administrador.',
            isResolved: true,
            profile: null,
            userId,
          })
        } else {
          setProfileState({
            error: null,
            isResolved: true,
            profile: data,
            userId,
          })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [session?.user.id])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    setSession(null)
    setProfileState(emptyProfileState)
  }, [])

  const user = session?.user ?? null
  const profileBelongsToSession = profileState.userId === user?.id
  const profile = profileBelongsToSession ? profileState.profile : null
  const profileError = profileBelongsToSession ? profileState.error : null

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role: profile?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading:
        isSessionLoading ||
        (Boolean(user) && (!profileBelongsToSession || !profileState.isResolved)),
      profileError,
      signOut,
    }),
    [
      isSessionLoading,
      profile,
      profileBelongsToSession,
      profileError,
      profileState.isResolved,
      signOut,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
