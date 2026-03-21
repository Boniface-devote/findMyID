'use client'

import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  MapPin,
  FileText,
  CheckCircle2,
  Shield,
  Search
} from 'lucide-react'

export function ResultsPage() {
  const { searchResults, setCurrentPage, setSelectedDocument } = useAppStore()

  const handleVerifyClick = (doc: typeof searchResults[0]) => {
    setSelectedDocument(doc)
    setCurrentPage('verification')
  }

  if (searchResults.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
            <p className="text-muted-foreground mb-6">
              No documents matched your search criteria. Try adjusting your search terms.
            </p>
            <Button onClick={() => setCurrentPage('search')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => setCurrentPage('search')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
          <h1 className="text-3xl font-bold mb-2">Search Results</h1>
          <p className="text-muted-foreground">
            Found {searchResults.length} document(s) matching your criteria. Click &quot;Verify Ownership&quot; to proceed.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {searchResults.map((doc) => (
            <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Blurred Image */}
              <div className="relative h-48 bg-muted">
                <img
                  src={doc.image_url}
                  alt="Document"
                  className="w-full h-full object-cover blur-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <Badge className="absolute top-3 left-3" variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  Protected
                </Badge>
              </div>

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{doc.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <FileText className="h-3 w-3" />
                      {doc.document_type}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Found
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{doc.location_found}</span>
                  </div>

                  <Button 
                    className="w-full mt-4"
                    onClick={() => handleVerifyClick(doc)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Ownership
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Privacy Notice */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Shield className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Privacy Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Document images are blurred to protect sensitive information. You&apos;ll need to verify your identity 
                  before accessing the finder&apos;s contact details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
