'use client'

import { useState, useEffect } from 'react'
import { supabase, type Document } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { 
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react'

type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'returned'

const statusConfig: Record<DocumentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: 'Approved', 
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
  rejected: { 
    label: 'Rejected', 
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />
  },
  returned: { 
    label: 'Returned', 
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <RotateCcw className="h-3 w-3" />
  },
}

export function AdminDashboard() {
  const { toast } = useToast()
  
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    returned: 0,
  })

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error('Failed to fetch documents')
      }

      setDocuments(data || [])
      
      // Calculate stats
      const total = data?.length || 0
      const pending = data?.filter(d => d.status === 'pending').length || 0
      const approved = data?.filter(d => d.status === 'approved').length || 0
      const returned = data?.filter(d => d.status === 'returned').length || 0
      
      setStats({ total, pending, approved, returned })
    } catch (error) {
      console.error('Fetch error:', error)
      toast({
        title: 'Error',
        description: 'Failed to load documents.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const updateStatus = async (id: string, status: DocumentStatus) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', id)

      if (error) {
        throw new Error('Failed to update status')
      }

      toast({
        title: 'Success',
        description: `Document status updated to ${status}.`,
      })
      fetchDocuments()
    } catch (error) {
      console.error('Update error:', error)
      toast({
        title: 'Error',
        description: 'Failed to update document status.',
        variant: 'destructive',
      })
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error('Failed to delete document')
      }

      toast({
        title: 'Success',
        description: 'Document has been deleted.',
      })
      fetchDocuments()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage and review submitted documents.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <RotateCcw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Submissions</CardTitle>
              <CardDescription>
                Review and manage all submitted documents.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDocuments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No documents found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Location Found</TableHead>
                    <TableHead>Date Uploaded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div 
                          className="h-12 w-12 rounded-lg bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedImage(doc.image_url)}
                        >
                          <img 
                            src={doc.image_url} 
                            alt="Document" 
                            className="w-full h-full object-cover blur-sm"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{doc.full_name}</TableCell>
                      <TableCell>{doc.document_type}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{doc.location_found}</TableCell>
                      <TableCell>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={statusConfig[doc.status as DocumentStatus].className}
                        >
                          <span className="mr-1">{statusConfig[doc.status as DocumentStatus].icon}</span>
                          {statusConfig[doc.status as DocumentStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {doc.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => updateStatus(doc.id, 'approved')}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => updateStatus(doc.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {doc.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => updateStatus(doc.id, 'returned')}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this document? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => deleteDocument(doc.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl max-h-[80vh] bg-white rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
            <img 
              src={selectedImage} 
              alt="Document preview" 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}
