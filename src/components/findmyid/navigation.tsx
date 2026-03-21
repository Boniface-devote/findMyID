'use client'

import { useAppStore, type PageType } from '@/store/app-store'
import { useAuth } from '@/contexts/auth-context'
import { cn } from '@/lib/utils'
import { 
  Home, 
  Upload, 
  Search, 
  Shield, 
  Menu,
  X,
  FileSearch,
  LogIn,
  LogOut,
  User,
  UserPlus
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Navigation() {
  const { currentPage, setCurrentPage } = useAppStore()
  const { user, profile, isAdmin, signOut, isLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page)
    setMobileMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentPage('home')
    setMobileMenuOpen(false)
  }

  const navItems: { id: PageType; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'home', label: 'Home', icon: <Home className="h-4 w-4" /> },
    { id: 'upload', label: 'Report Found Document', icon: <Upload className="h-4 w-4" /> },
    { id: 'search', label: 'Search Lost Document', icon: <Search className="h-4 w-4" /> },
    { id: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" />, adminOnly: true },
  ]

  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  )

  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user?.email?.[0]?.toUpperCase() || 'U'
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleNavClick('home')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <FileSearch className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">FindMyID</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {filteredNavItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'gap-2 transition-all duration-200',
                  currentPage === item.id && 'bg-primary text-white shadow-md'
                )}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            ))}
          </nav>

          {/* Auth Section - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-8 animate-pulse bg-muted rounded-full" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      {isAdmin && (
                        <span className="text-xs text-primary font-medium mt-1">Admin</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => setCurrentPage('admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentPage('login')}
                  className="gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentPage('register')}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {filteredNavItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? 'default' : 'ghost'}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    'justify-start gap-2 w-full',
                    currentPage === item.id && 'bg-primary text-white'
                  )}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="border-t pt-4 mt-2">
                {isLoading ? null : user ? (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{profile?.full_name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="justify-start gap-2 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavClick('login')}
                      className="justify-start gap-2 w-full"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleNavClick('register')}
                      className="justify-start gap-2 w-full"
                    >
                      <UserPlus className="h-4 w-4" />
                      Register
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
