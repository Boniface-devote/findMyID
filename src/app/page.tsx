'use client'

import { useAppStore } from '@/store/app-store'
import { AuthProvider } from '@/contexts/auth-context'
import { Navigation } from '@/components/findmyid/navigation'
import { Footer } from '@/components/findmyid/footer'
import { HomePage } from '@/components/findmyid/home-page'
import { UploadPage } from '@/components/findmyid/upload-page'
import { SearchPage } from '@/components/findmyid/search-page'
import { ResultsPage } from '@/components/findmyid/results-page'
import { VerificationPage } from '@/components/findmyid/verification-page'
import { AdminDashboard } from '@/components/findmyid/admin-dashboard'
import { LoginPage } from '@/components/findmyid/login-page'
import { RegisterPage } from '@/components/findmyid/register-page'
import { ProtectedRoute } from '@/components/findmyid/protected-route'

function AppContent() {
  const { currentPage } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'upload':
        return <UploadPage />
      case 'search':
        return <SearchPage />
      case 'results':
        return <ResultsPage />
      case 'verification':
        return <VerificationPage />
      case 'admin':
        return (
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        )
      case 'login':
        return <LoginPage />
      case 'register':
        return <RegisterPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  )
}

export default function FindMyIDApp() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
