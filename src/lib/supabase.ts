import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fooardqejgvhezjubvah.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_F7HpZqKgwxa7OCU-HF3Z7w_k82P0cd8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User roles
export type UserRole = 'admin' | 'user'

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  created_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAdmin: boolean
}

// Document types
export type DocumentType = 'National ID' | 'Passport' | "Driver's License" | 'Student ID' | 'Other'

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'returned'

export interface Document {
  id: string
  full_name: string
  date_of_birth: string
  id_number: string | null
  document_type: DocumentType
  image_url: string
  location_found: string
  finder_phone: string
  reward_amount: number | null
  status: DocumentStatus
  created_at: string
}

export interface Claim {
  id: string
  document_id: string
  owner_name: string
  owner_phone: string
  verification_passed: boolean
  claim_date: string
}

export interface SearchResult {
  id: string
  full_name: string
  document_type: DocumentType
  location_found: string
  image_url: string
  date_of_birth: string
  status: DocumentStatus
}

// Auth helper functions
export async function signUp(email: string, password: string, fullName: string, adminCode?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: adminCode ? 'admin' : 'user'
      }
    }
  })
  
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }
  
  return data as UserProfile
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return profile?.role === 'admin'
}
