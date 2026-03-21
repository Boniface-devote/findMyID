'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import { supabase, type DocumentType } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Upload as UploadIcon, 
  FileImage, 
  MapPin, 
  Phone, 
  DollarSign,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Scan,
  Sparkles,
  CheckCircle,
  GraduationCap,
  CreditCard
} from 'lucide-react'

const documentTypes: DocumentType[] = ['National ID', 'Passport', "Driver's License", 'Student ID', 'Other']

// National ID fields
interface NationalIDFields {
  surname?: string | null
  given_name?: string | null
  date_of_birth?: string | null
  nin?: string | null
  card_no?: string | null
  sex?: string | null
  nationality?: string | null
  date_of_expiry?: string | null
}

// Student ID fields
interface StudentIDFields {
  surname?: string | null
  given_name?: string | null
  student_id?: string | null
  reg_no?: string | null
  faculty?: string | null
  program?: string | null
  hall?: string | null
  date_of_expiry?: string | null
}

// Combined fields type
type OCRFields = NationalIDFields & StudentIDFields

interface OCRResponse {
  success: boolean
  message: string
  card_type?: string | null  // 'student_id', 'national_id', or 'unknown'
  fields: OCRFields | null
  raw_text?: string
}

export function UploadPage() {
  const { setCurrentPage } = useAppStore()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // OCR states
  const [isScanning, setIsScanning] = useState(false)
  const [ocrComplete, setOcrComplete] = useState(false)
  const [ocrFields, setOcrFields] = useState<string[]>([])
  const [cardType, setCardType] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    idNumber: '',
    documentType: '' as DocumentType | '',
    locationFound: '',
    finderPhone: '',
    rewardAmount: '',
    // Student ID specific fields
    registrationNumber: '',
    faculty: '',
    program: '',
    hall: '',
  })

  const runOCR = async (file: File) => {
    setIsScanning(true)
    setOcrComplete(false)
    setOcrFields([])
    setCardType(null)
    
    try {
      const ocrFormData = new FormData()
      ocrFormData.append('image', file)
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: ocrFormData,
      })
      
      const result: OCRResponse = await response.json()
      
      if (result.success && result.fields) {
        const detectedFields: string[] = []
        
        // Set card type
        if (result.card_type) {
          setCardType(result.card_type)
        }
        
        // Combine given_name + surname for fullName (common to both)
        if (result.fields.given_name || result.fields.surname) {
          const fullName = [result.fields.given_name, result.fields.surname]
            .filter(Boolean)
            .join(' ')
          if (fullName) {
            setFormData(prev => ({ ...prev, fullName }))
            detectedFields.push('fullName')
          }
        }
        
        // Handle National ID specific fields
        if (result.card_type === 'national_id') {
          // Convert DD.MM.YYYY to YYYY-MM-DD for date input
          if (result.fields.date_of_birth) {
            const parts = result.fields.date_of_birth.split('.')
            if (parts.length === 3) {
              const [day, month, year] = parts
              const isoDate = `${year}-${month}-${day}`
              setFormData(prev => ({ ...prev, dateOfBirth: isoDate }))
              detectedFields.push('dateOfBirth')
            }
          }
          
          // Use nin or card_no for idNumber
          if (result.fields.nin) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.nin! }))
            detectedFields.push('idNumber')
          } else if (result.fields.card_no) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.card_no! }))
            detectedFields.push('idNumber')
          }
          
          // Auto-set document type
          setFormData(prev => ({ ...prev, documentType: 'National ID' }))
          detectedFields.push('documentType')
        }
        
        // Handle Student ID specific fields
        if (result.card_type === 'student_id') {
          // Use student_id for idNumber
          if (result.fields.student_id) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.student_id! }))
            detectedFields.push('idNumber')
          }
          
          // Registration number
          if (result.fields.reg_no) {
            setFormData(prev => ({ ...prev, registrationNumber: result.fields!.reg_no! }))
            detectedFields.push('registrationNumber')
          }
          
          // Faculty
          if (result.fields.faculty) {
            setFormData(prev => ({ ...prev, faculty: result.fields!.faculty! }))
            detectedFields.push('faculty')
          }
          
          // Program
          if (result.fields.program) {
            setFormData(prev => ({ ...prev, program: result.fields!.program! }))
            detectedFields.push('program')
          }
          
          // Hall
          if (result.fields.hall) {
            setFormData(prev => ({ ...prev, hall: result.fields!.hall! }))
            detectedFields.push('hall')
          }
          
          // Auto-set document type
          setFormData(prev => ({ ...prev, documentType: 'Student ID' }))
          detectedFields.push('documentType')
        }
        
        // Handle unknown card type - try to extract common fields
        if (result.card_type === 'unknown' || !result.card_type) {
          // Try date of birth
          if (result.fields.date_of_birth) {
            const parts = result.fields.date_of_birth.split('.')
            if (parts.length === 3) {
              const [day, month, year] = parts
              const isoDate = `${year}-${month}-${day}`
              setFormData(prev => ({ ...prev, dateOfBirth: isoDate }))
              detectedFields.push('dateOfBirth')
            }
          }
          
          // Try any ID number
          if (result.fields.nin) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.nin! }))
            detectedFields.push('idNumber')
          } else if (result.fields.card_no) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.card_no! }))
            detectedFields.push('idNumber')
          } else if (result.fields.student_id) {
            setFormData(prev => ({ ...prev, idNumber: result.fields!.student_id! }))
            detectedFields.push('idNumber')
          }
        }
        
        setOcrFields(detectedFields)
        setOcrComplete(true)
        
        const cardTypeName = result.card_type === 'student_id' ? 'Student ID' : 
                            result.card_type === 'national_id' ? 'National ID' : 'Unknown'
        
        toast({
          title: 'OCR Scan Complete',
          description: `Detected: ${cardTypeName}. Auto-filled ${detectedFields.length} field(s).`,
        })
      } else {
        toast({
          title: 'OCR Scan',
          description: result.message || 'Could not extract fields from the image.',
          variant: 'default',
        })
      }
    } catch (error) {
      console.error('OCR error:', error)
      toast({
        title: 'OCR Error',
        description: 'Failed to scan document. You can still fill fields manually.',
        variant: 'destructive',
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setOcrComplete(false)
      setOcrFields([])
      setCardType(null)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Automatically run OCR
      runOCR(file)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please upload a document image.',
        variant: 'destructive',
      })
      return
    }

    // Date of birth is required for National ID but not for Student ID
    const requiresDateOfBirth = cardType !== 'student_id'
    if (!formData.fullName || (requiresDateOfBirth && !formData.dateOfBirth) || !formData.documentType || !formData.locationFound || !formData.finderPhone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Upload image to Supabase storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `documents/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('document_images')
        .upload(filePath, selectedFile)

      if (uploadError) {
        throw new Error('Failed to upload image')
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('document_images')
        .getPublicUrl(filePath)

      // Insert document record
      const { data: documentData, error: insertError } = await supabase
        .from('documents')
        .insert({
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth || null,  // Pass null for Student IDs (no DOB)
          id_number: formData.idNumber || null,
          document_type: formData.documentType,
          image_url: urlData.publicUrl,
          location_found: formData.locationFound,
          finder_phone: formData.finderPhone,
          reward_amount: formData.rewardAmount ? parseFloat(formData.rewardAmount) : null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        throw new Error(`Failed to save document information: ${insertError.message}`)
      }

      // If Student ID, insert additional details into student_documents table
      if (cardType === 'student_id' && documentData?.id) {
        const { error: studentInsertError } = await supabase
          .from('student_documents')
          .insert({
            document_id: documentData.id,
            registration_number: formData.registrationNumber || null,
            student_id_number: formData.idNumber || null,
            faculty: formData.faculty || null,
            program: formData.program || null,
            hall: formData.hall || null,
          })

        if (studentInsertError) {
          console.error('Student documents insert error:', studentInsertError)
          throw new Error(`Failed to save student details: ${studentInsertError.message}`)
        }
      }

      setSuccess(true)
      toast({
        title: 'Success!',
        description: 'Document has been successfully uploaded and submitted for review.',
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Document Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your honesty. The document has been submitted and will be reviewed by our team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => {
                setSuccess(false)
                setFormData({
                  fullName: '',
                  dateOfBirth: '',
                  idNumber: '',
                  documentType: '',
                  locationFound: '',
                  finderPhone: '',
                  rewardAmount: '',
                  registrationNumber: '',
                  faculty: '',
                  program: '',
                  hall: '',
                })
                setImagePreview(null)
                setSelectedFile(null)
                setCardType(null)
                setOcrFields([])
                setOcrComplete(false)
              }}>
                Upload Another Document
              </Button>
              <Button variant="outline" onClick={() => setCurrentPage('home')}>
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Report Found Document</h1>
          <p className="text-muted-foreground">
            Upload information about a document you&apos;ve found to help reunite it with its owner.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5 text-primary" />
                Document Information
              </CardTitle>
              <CardDescription>
                Please provide accurate information about the found document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="documentImage">Document Image *</Label>
                  {selectedFile && !isScanning && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runOCR(selectedFile)}
                      className="h-7"
                    >
                      <Scan className="h-3 w-3 mr-1" />
                      Re-scan
                    </Button>
                  )}
                </div>
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Document preview" 
                        className="max-h-48 mx-auto rounded-lg blur-sm"
                      />
                      {isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                          <div className="bg-white/95 px-4 py-2 rounded-lg flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium">Scanning document...</span>
                          </div>
                        </div>
                      )}
                      {!isScanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Badge variant="secondary" className="bg-white/90">
                            <FileImage className="h-4 w-4 mr-2" />
                            Image uploaded (click to change)
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload document image
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="documentImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                {/* Card Type Detection Badge */}
                {cardType && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700">
                      {cardType === 'student_id' ? (
                        <GraduationCap className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                      <span className="font-medium">
                        Detected Document: {cardType === 'student_id' ? 'Student ID' : cardType === 'national_id' ? 'National ID' : 'Unknown'}
                      </span>
                      <CheckCircle className="h-4 w-4 ml-auto" />
                    </div>
                  </div>
                )}
                
                {/* OCR Success Box */}
                {ocrComplete && ocrFields.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Auto-filled from document scan:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ocrFields.map((field) => (
                        <Badge key={field} variant="secondary" className="bg-green-100 text-green-700">
                          {field === 'fullName' && 'Full Name'}
                          {field === 'dateOfBirth' && 'Date of Birth'}
                          {field === 'idNumber' && 'ID Number'}
                          {field === 'documentType' && 'Document Type'}
                          {field === 'registrationNumber' && 'Reg. Number'}
                          {field === 'faculty' && 'Faculty'}
                          {field === 'program' && 'Program'}
                          {field === 'hall' && 'Hall'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name on Document *</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Enter the name as it appears on the document"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Date of Birth - Only show for National ID (not on Student IDs) */}
              {cardType !== 'student_id' && (
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}

              {/* ID Number */}
              <div className="space-y-2">
                <Label htmlFor="idNumber">Identification Number (Optional)</Label>
                <Input
                  id="idNumber"
                  name="idNumber"
                  placeholder="Enter ID number if visible"
                  value={formData.idNumber}
                  onChange={handleInputChange}
                />
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label htmlFor="documentType">Document Type *</Label>
                <Select 
                  value={formData.documentType} 
                  onValueChange={(value) => handleSelectChange('documentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student ID Specific Fields */}
              {cardType === 'student_id' && (
                <div className="space-y-4 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <h3 className="font-medium text-blue-800 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Student ID Details
                  </h3>
                  
                  {/* Registration Number */}
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      placeholder="e.g., 15/U/12345/PS"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {/* Faculty */}
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty / School</Label>
                    <Input
                      id="faculty"
                      name="faculty"
                      placeholder="e.g., Faculty of Computing"
                      value={formData.faculty}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {/* Program */}
                  <div className="space-y-2">
                    <Label htmlFor="program">Program / Course</Label>
                    <Input
                      id="program"
                      name="program"
                      placeholder="e.g., Computer Science"
                      value={formData.program}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  {/* Hall */}
                  <div className="space-y-2">
                    <Label htmlFor="hall">Hall of Residence</Label>
                    <Input
                      id="hall"
                      name="hall"
                      placeholder="e.g., Mary Stuart Hall"
                      value={formData.hall}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              {/* Location Found */}
              <div className="space-y-2">
                <Label htmlFor="locationFound">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Location Where Document Was Found *
                </Label>
                <Textarea
                  id="locationFound"
                  name="locationFound"
                  placeholder="Enter the address or description of where you found the document"
                  value={formData.locationFound}
                  onChange={handleInputChange}
                  required
                  rows={2}
                />
              </div>

              {/* Finder Phone */}
              <div className="space-y-2">
                <Label htmlFor="finderPhone">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Your Phone Number *
                </Label>
                <Input
                  id="finderPhone"
                  name="finderPhone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.finderPhone}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This will only be shown to verified owners
                </p>
              </div>

              {/* Reward Amount */}
              <div className="space-y-2">
                <Label htmlFor="rewardAmount">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Optional Reward Amount
                </Label>
                <Input
                  id="rewardAmount"
                  name="rewardAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter reward amount if offered"
                  value={formData.rewardAmount}
                  onChange={handleInputChange}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Submit Document
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
