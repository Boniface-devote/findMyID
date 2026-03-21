'use client'

import { useAuth } from '@/contexts/auth-context'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, LogIn, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const { setCurrentPage } = useAppStore()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access this page.
            </p>
            <Button onClick={() => setCurrentPage('login')}>
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have admin privileges to access this page.
            </p>
            <Button variant="outline" onClick={() => setCurrentPage('home')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
