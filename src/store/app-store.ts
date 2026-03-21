import { create } from 'zustand'
import type { Document, SearchResult } from '@/lib/supabase'

export type PageType = 'home' | 'upload' | 'search' | 'results' | 'verification' | 'admin' | 'login' | 'register'

interface AppState {
  currentPage: PageType
  searchResults: SearchResult[]
  selectedDocument: SearchResult | null
  verificationSuccess: boolean
  verifiedDocument: Document | null
  
  // Actions
  setCurrentPage: (page: PageType) => void
  setSearchResults: (results: SearchResult[]) => void
  setSelectedDocument: (doc: SearchResult | null) => void
  setVerificationSuccess: (success: boolean, doc?: Document | null) => void
  resetState: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'home',
  searchResults: [],
  selectedDocument: null,
  verificationSuccess: false,
  verifiedDocument: null,
  
  setCurrentPage: (page) => set({ currentPage: page }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
  setVerificationSuccess: (success, doc) => set({ 
    verificationSuccess: success, 
    verifiedDocument: doc || null 
  }),
  resetState: () => set({
    currentPage: 'home',
    searchResults: [],
    selectedDocument: null,
    verificationSuccess: false,
    verifiedDocument: null,
  }),
}))
