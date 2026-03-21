'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Search as SearchIcon, 
  Loader2,
  FileSearch,
  User,
  Calendar,
  Hash
} from 'lucide-react'

export function SearchPage() {
  const { setCurrentPage, setSearchResults } = useAppStore()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    dateOfBirth: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName && !formData.idNumber && !formData.dateOfBirth) {
      toast({
        title: 'Error',
        description: 'Please enter at least one search criteria.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      let query = supabase
        .from('documents')
        .select('id, full_name, document_type, location_found, image_url, date_of_birth, status')
        .eq('status', 'approved')

      if (formData.fullName) {
        query = query.ilike('full_name', `%${formData.fullName}%`)
      }

      if (formData.idNumber) {
        query = query.ilike('id_number', `%${formData.idNumber}%`)
      }

      if (formData.dateOfBirth) {
        query = query.eq('date_of_birth', formData.dateOfBirth)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        throw new Error('Failed to search documents')
      }

      if (data && data.length > 0) {
        setSearchResults(data)
        setCurrentPage('results')
        toast({
          title: 'Found!',
          description: `Found ${data.length} matching document(s).`,
        })
      } else {
        toast({
          title: 'No Results',
          description: 'No matching documents found. Try different search criteria.',
        })
      }
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Error',
        description: 'Failed to search documents. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Search Lost Document</h1>
          <p className="text-muted-foreground">
            Enter your details to search for your lost identification document.
          </p>
        </div>

        <form onSubmit={handleSearch}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                Search Criteria
              </CardTitle>
              <CardDescription>
                Enter any combination of the fields below to search for your document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter your full name as it appears on the document"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              {/* ID Number */}
              <div className="space-y-2">
                <Label htmlFor="idNumber" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  ID Number
                </Label>
                <Input
                  id="idNumber"
                  name="idNumber"
                  placeholder="Enter your ID number"
                  value={formData.idNumber}
                  onChange={handleInputChange}
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
                />
              </div>

              {/* Search Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search Documents
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Tips Section */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2 text-primary">Search Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Enter your name exactly as it appears on your document</li>
              <li>• Partial matches are supported - you can enter just your first or last name</li>
              <li>• If you remember your ID number, it&apos;s the fastest way to find your document</li>
              <li>• Date of birth helps narrow down the results significantly</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
