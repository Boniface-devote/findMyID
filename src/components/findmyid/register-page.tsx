'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  UserPlus,
  Loader2,
  Shield,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Key
} from 'lucide-react'

// Admin registration code - in production, this should be stored securely
const ADMIN_REGISTRATION_CODE = 'FINDMYID-ADMIN-2024'

export function RegisterPage() {
  const { setCurrentPage } = useAppStore()
  const { signUp } = useAuth()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    adminCode: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.fullName || !formData.adminCode) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      })
      return
    }

    // Verify admin code
    if (formData.adminCode !== ADMIN_REGISTRATION_CODE) {
      toast({
        title: 'Invalid Admin Code',
        description: 'The admin registration code is incorrect.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.adminCode)

      if (error) {
        throw error
      }

      toast({
        title: 'Registration Successful!',
        description: 'Your admin account has been created. You can now sign in.',
      })
      setCurrentPage('login')
    } catch (error: unknown) {
      console.error('Registration error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account. Please try again.'
      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setCurrentPage('home')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Admin Registration</CardTitle>
            <CardDescription>
              Create an admin account to manage documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminCode" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Admin Registration Code
                </Label>
                <Input
                  id="adminCode"
                  name="adminCode"
                  type="password"
                  placeholder="Enter admin code"
                  value={formData.adminCode}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Contact the system administrator for the registration code
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Button 
            variant="link" 
            className="p-0 h-auto"
            onClick={() => setCurrentPage('login')}
          >
            Sign in here
          </Button>
        </p>
      </div>
    </div>
  )
}
