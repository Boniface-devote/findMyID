'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Search, 
  CheckCircle2, 
  FileSearch, 
  Handshake, 
  MapPin,
  Shield,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react'

const steps = [
  {
    number: 1,
    title: 'Someone Finds a Document',
    description: 'A good Samaritan discovers a lost ID, passport, or other identification document on the street, in a store, or anywhere else.',
    icon: <FileSearch className="h-8 w-8" />,
  },
  {
    number: 2,
    title: 'They Upload It to the Platform',
    description: 'The finder securely uploads the document information and photo to FindMyID, providing details about where it was found.',
    icon: <Upload className="h-8 w-8" />,
  },
  {
    number: 3,
    title: 'The Owner Searches for It',
    description: 'The document owner searches the platform using their name, ID number, or date of birth to find their lost document.',
    icon: <Search className="h-8 w-8" />,
  },
  {
    number: 4,
    title: 'Verification and Recovery',
    description: 'After verifying ownership, the owner contacts the finder to arrange a safe meetup and recover their document.',
    icon: <Handshake className="h-8 w-8" />,
  },
]

const features = [
  {
    icon: <Shield className="h-6 w-6 text-primary" />,
    title: 'Secure & Private',
    description: 'Document images are blurred by default, and sensitive information is protected until ownership is verified.',
  },
  {
    icon: <Users className="h-6 w-6 text-primary" />,
    title: 'Community Driven',
    description: 'Built on the kindness of strangers helping each other recover important documents.',
  },
  {
    icon: <Clock className="h-6 w-6 text-primary" />,
    title: 'Fast Recovery',
    description: 'Get reunited with your lost documents quickly without dealing with lengthy bureaucracy.',
  },
  {
    icon: <MapPin className="h-6 w-6 text-primary" />,
    title: 'Location Tracking',
    description: 'Know exactly where your document was found to help you plan your recovery.',
  },
]

export function HomePage() {
  const { setCurrentPage } = useAppStore()

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-primary/10 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              Trusted by thousands of users
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Lost your ID?{' '}
              <span className="text-primary">Someone may have found it.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              FindMyID connects people who have found lost identification documents with their rightful owners. 
              Report a found document or search for yours today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="gap-2 text-lg px-8"
                onClick={() => setCurrentPage('upload')}
              >
                <Upload className="h-5 w-5" />
                Report Found Document
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="gap-2 text-lg px-8"
                onClick={() => setCurrentPage('search')}
              >
                <Search className="h-5 w-5" />
                Search Lost Document
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A simple four-step process to help reunite people with their lost identification documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card 
                key={step.number}
                className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300 group"
              >
                <CardContent className="pt-8 pb-6 px-6">
                  <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-bl-2xl flex items-end justify-start p-2">
                    <span className="text-lg font-bold text-primary">{step.number}</span>
                  </div>
                  
                  <div className="mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-primary/30" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose FindMyID?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We make the process of recovering lost documents simple, secure, and efficient.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="pt-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Find Your Document?
          </h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
            Whether you&apos;ve found a document or lost one, FindMyID is here to help make the connection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="gap-2 text-lg px-8"
              onClick={() => setCurrentPage('upload')}
            >
              <Upload className="h-5 w-5" />
              Report Found Document
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="gap-2 text-lg px-8 bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => setCurrentPage('search')}
            >
              <Search className="h-5 w-5" />
              Search Lost Document
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
