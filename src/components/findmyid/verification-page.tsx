'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Calendar,
  MessageCircle
} from 'lucide-react'

export function VerificationPage() {
  const { selectedDocument, setCurrentPage, setVerificationSuccess, verifiedDocument, verificationSuccess } = useAppStore()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    lastDigits: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDocument) {
      toast({
        title: 'Error',
        description: 'No document selected for verification.',
        variant: 'destructive',
      })
      return
    }

    if (!formData.fullName || !formData.dateOfBirth || !formData.lastDigits) {
      toast({
        title: 'Error',
        description: 'Please fill in all verification fields.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Fetch full document details
      const { data: docData, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', selectedDocument.id)
        .single()

      if (error || !docData) {
        throw new Error('Document not found')
      }

      // Verify ownership
      const nameMatch = docData.full_name.toLowerCase() === formData.fullName.toLowerCase()
      const dobMatch = docData.date_of_birth === formData.dateOfBirth
      
      // Check last 4 digits of ID number
      let lastDigitsMatch = false
      if (docData.id_number) {
        const last4 = docData.id_number.slice(-4)
        lastDigitsMatch = last4 === formData.lastDigits
      }

      if (nameMatch && dobMatch && lastDigitsMatch) {
        setVerificationSuccess(true, docData)
        toast({
          title: 'Verification Successful!',
          description: 'You have successfully verified ownership of this document.',
        })
      } else {
        toast({
          title: 'Verification Failed',
          description: 'The information provided does not match our records. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({
        title: 'Error',
        description: 'Failed to verify document. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedDocument) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <h2 className="text-2xl font-bold mb-2">No Document Selected</h2>
            <p className="text-muted-foreground mb-6">
              Please search and select a document first.
            </p>
            <Button onClick={() => setCurrentPage('search')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (verificationSuccess && verifiedDocument) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => {
              setVerificationSuccess(false, null)
              setCurrentPage('search')
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>

          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-green-800">Verification Successful!</CardTitle>
              <CardDescription>
                You have successfully verified ownership of this document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Info */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">
                  Document Details
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Document Type:</span>
                    <span className="font-medium">{verifiedDocument.document_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{verifiedDocument.full_name}</span>
                  </div>
                </div>
              </div>

              {/* Finder Contact */}
              <div className="bg-white rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm uppercase text-muted-foreground tracking-wide">
                  Finder Contact Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-semibold text-lg">{verifiedDocument.finder_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location Found</p>
                      <p className="font-medium">{verifiedDocument.location_found}</p>
                    </div>
                  </div>
                  {verifiedDocument.reward_amount && (
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Reward: ${verifiedDocument.reward_amount}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button className="w-full" size="lg">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Request Meetup
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Contact the finder to arrange a safe meeting location for document pickup
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setCurrentPage('results')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Verify Ownership</h1>
          <p className="text-muted-foreground">
            Please provide the following information to verify you are the owner of this document.
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Verification
              </CardTitle>
              <CardDescription>
                Enter the exact information as it appears on your document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Document Preview */}
              <div className="bg-muted rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedDocument.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedDocument.document_type}</p>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name on Document</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name as it appears on the document"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Last Digits */}
              <div className="space-y-2">
                <Label htmlFor="lastDigits">Last 4 Digits of ID Number</Label>
                <Input
                  id="lastDigits"
                  name="lastDigits"
                  placeholder="Enter the last 4 digits of your ID number"
                  value={formData.lastDigits}
                  onChange={handleInputChange}
                  maxLength={4}
                  required
                />
              </div>

              {/* Verify Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Ownership
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Security Notice */}
        <Card className="mt-6 bg-amber-50 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <XCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Important</h3>
                <p className="text-sm text-amber-700">
                  Only attempt to verify documents that belong to you. Fraudulent verification attempts 
                  are logged and may be reported to authorities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
