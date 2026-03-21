'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile, getUserProfile } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, adminCode?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await getUserProfile(user.id)
      setProfile(userProfile)
    } else {
      setProfile(null)
    }
  }, [user])

  useEffect(() => {
    let mounted = true

    // Get initial session
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Fetch profile for logged in user
        if (session?.user) {
          const userProfile = await getUserProfile(session.user.id)
          if (mounted) {
            setProfile(userProfile)
          }
        }
        
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Fetch profile for logged in user
        if (session?.user) {
          const userProfile = await getUserProfile(session.user.id)
          if (mounted) {
            setProfile(userProfile)
          }
        } else {
          setProfile(null)
        }
        
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, fullName: string, adminCode?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: adminCode ? 'admin' : 'user',
          admin_code: adminCode
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isLoading,
      isAdmin,
      refreshProfile,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
