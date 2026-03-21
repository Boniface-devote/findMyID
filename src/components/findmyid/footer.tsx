'use client'

import { useAppStore, type PageType } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const { setCurrentPage } = useAppStore()

  const handleNavClick = (page: PageType) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-slate-50 border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">FindMyID</h3>
            <p className="text-sm text-muted-foreground">
              Helping people recover their lost identification documents through community cooperation.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
                onClick={() => handleNavClick('upload')}
              >
                Report Found Document
              </Button>
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
                onClick={() => handleNavClick('search')}
              >
                Search Lost Document
              </Button>
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
                onClick={() => handleNavClick('admin')}
              >
                Admin Dashboard
              </Button>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Legal</h4>
            <div className="flex flex-col gap-2">
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
              >
                About Us
              </Button>
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
              >
                Contact
              </Button>
              <Button 
                variant="link" 
                className="justify-start p-0 h-auto text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FindMyID. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with care to help reunite people with their important documents.
          </p>
        </div>
      </div>
    </footer>
  )
}
