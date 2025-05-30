"use client"

import { useState } from "react"
import {
  Plus,
  CreditCard,
  Clock,
  DollarSign,
  Filter,
  Download,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Save,
  Calculator,
  User,
  Phone,
  MapPin,
  Trash2,
  FileText,
  CheckCircle,
  Check,
  Minus,
  Activity,
  Stethoscope,
  Users,
  Mail,
  Search,
  XCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"
import { debounce } from 'lodash'
import { useCallback, useEffect } from 'react'



// Mock data for existing invoices
const existingInvoices = [
  {
    id: "TC-2024-001",
    patient: "Rohan Mondal",
    patientId: "PT-0258",
    date: "26 Jan 2024",
    amount: "₹1,500",
    status: "Paid",
    doctor: "Dr. Mainak Sur",
    items: [
      { name: "Manual Therapy", quantity: 2, price: 800, total: 1600 },
      { name: "Consultation", quantity: 1, price: 300, total: 300 }
    ],
  },
  {
    id: "TC-2024-002",
    patient: "Priya Sharma",
    patientId: "PT-0259",
    date: "25 Jan 2024",
    amount: "₹2,400",
    status: "Pending",
    doctor: "Dr. Diksha Palit",
    items: [
      { name: "Exercise Therapy", quantity: 3, price: 600, total: 1800 },
      { name: "Ultrasound Therapy", quantity: 2, price: 450, total: 900 }
    ],
  },
  {
    id: "TC-2024-003",
    patient: "Amit Kumar",
    patientId: "PT-0260",
    date: "24 Jan 2024",
    amount: "₹1,200",
    status: "Paid",
    doctor: "Dr. Diptesh Dey",
    items: [
      { name: "Electrotherapy", quantity: 2, price: 500, total: 1000 },
      { name: "Follow-up", quantity: 1, price: 200, total: 200 }
    ],
  }
]

export function InvoicesSection() {
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [patientFound, setPatientFound] = useState(false)
  const [patientData, setPatientData] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 5
  const totalPages = Math.ceil(existingInvoices.length / pageSize)
  const paginatedInvoices = existingInvoices.slice((page - 1) * pageSize, page * pageSize)


  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [selectedServices, setSelectedServices] = useState([])
  

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    patientId: '',
    phone: '',
    address: '',
    email: ''
  })


  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    doctor: '',
    notes: ''
  })


  const [paymentDetails, setPaymentDetails] = useState({
    amountPaid: 0,
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  const fetchPatientDetails = async (patientId:string) => {
    try {
      setIsSearching(true)
      
      const response = await fetch(`/api/patients/${patientId}`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        setPatientFound(true)
        setPatientData(data.patient)
      } else {
        setPatientFound(false)
        setPatientData(null)
      }
    } catch (error) {
      console.error('Error fetching patient details:', error)
      setPatientFound(false)
      setPatientData(null)
      toast({
        title: "Error",
        description: "Failed to fetch patient details. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }
  

  const debouncedSearch = useCallback(
    debounce((patientId) => {
      if (patientId.length >= 6) { // Minimum length of 6 characters
        fetchPatientDetails(patientId)
      } else {
        setPatientFound(null)
        setPatientData(null)
      }
    }, 500), 
    []
  )

  const handlePatientIdChange = (e:any) => {
    const value = e.target.value
    setPatientInfo({ ...patientInfo, patientId: value })
    
    // Trigger search when input length is sufficient
    debouncedSearch(value)
  }
  

  // Predefined services with updated pricing and types
  const availableServices = [
    // Consultation Services
    { id: 1, name: 'Consultation at Clinic', price: 500, category: 'Consultation', description: 'Initial consultation at clinic premises' },
    { id: 2, name: 'Consultation at Home', price: 800, category: 'Consultation', description: 'Home visit consultation service' },
    { id: 3, name: 'Follow-up Consultation', price: 300, category: 'Consultation', description: 'Follow-up consultation session' },
    
    // Physical Therapy Services
    { id: 4, name: 'Manual Therapy', price: 500, category: 'Physical Therapy', description: 'Hands-on treatment techniques' },
    { id: 5, name: 'Exercise Therapy', price: 350, category: 'Physical Therapy', description: 'Therapeutic exercises and rehabilitation' },
    { id: 6, name: 'Electrotherapy', price: 400, category: 'Physical Therapy', description: 'Electrical stimulation therapy' },
    { id: 7, name: 'Hydrotherapy', price: 600, category: 'Physical Therapy', description: 'Water-based therapy sessions' },
    { id: 8, name: 'Heat Therapy', price: 300, category: 'Physical Therapy', description: 'Thermotherapy treatment' },
    { id: 9, name: 'Cryotherapy', price: 350, category: 'Physical Therapy', description: 'Cold therapy treatment' },
    
    // Combo Treatments
    { id: 10, name: 'Manual + Exercise Combo', price: 750, category: 'COMBO TREATMENT', description: 'Combined manual and exercise therapy' },
    { id: 11, name: 'Electro + Manual Combo', price: 800, category: 'COMBO TREATMENT', description: 'Combined electrotherapy and manual therapy' },
    { id: 12, name: 'Complete Therapy Package', price: 1200, category: 'COMBO TREATMENT', description: 'Comprehensive therapy package' }
  ]


  // Generate invoice ID
  const generateInvoiceId = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `TC-${year}${month}-${random}`
  }


  const addService = (service) => {
    const existingService = selectedServices.find(s => s.id === service.id)
    if (existingService) {
      setSelectedServices(selectedServices.map(s => 
        s.id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ))
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }])
    }
  }

  const updateServiceQuantity = (serviceId, quantity) => {
    if (quantity <= 0) {
      removeService(serviceId)
    } else {
      setSelectedServices(selectedServices.map(s => 
        s.id === serviceId ? { ...s, quantity } : s
      ))
    }
  }

  const removeService = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId))
  }

  // Calculation functions
  const calculateSubtotal = () => selectedServices.reduce((sum, service) => sum + (service.price * service.quantity), 0)
  const calculateOffer = () => -Math.round(calculateSubtotal() * 0.18) //GST
  const calculateTotal = () => calculateSubtotal() - calculateOffer()
  const calculateBalance = () => calculateTotal() - paymentDetails.amountPaid

  // Dialog handlers
  const openInvoiceDialog = () => {
    setInvoiceDetails({
      ...invoiceDetails,
      invoiceId: generateInvoiceId()
    })
    setIsInvoiceDialogOpen(true)
  }

  const closeInvoiceDialog = () => {
    setIsInvoiceDialogOpen(false)
    setSelectedServices([])
    setPatientInfo({
      name: '',
      patientId: '',
      phone: '',
      address: '',
      email: ''
    })
    setInvoiceDetails({
      invoiceId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      doctor: '',
      notes: ''
    })
    setPaymentDetails({
      amountPaid: 0,
      paymentMethod: 'cash',
      paymentDate: new Date().toISOString().split('T')[0]
    })
  }

  const handleSaveInvoice = () => {
    if (!patientInfo.patientId || selectedServices.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please enter patient ID and select at least one service.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Invoice Created",
      description: `Invoice ${invoiceDetails.invoiceId} has been created successfully.`,
    })
    closeInvoiceDialog()
  }

  const handlePrintInvoice = () => {
    if (!patientInfo.patientId || selectedServices.length === 0) {
      toast({
        title: "Cannot Print",
        description: "Please enter patient ID and add services before printing.",
        variant: "destructive"
      })
      return
    }
    window.print()
  }

  return (
    <>
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {/* Company Logo */}
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">TC</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">TheraCure Billing System</h2>
              <p className="text-sm text-gray-600">Professional Healthcare Management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1 border-indigo-600 text-indigo-700 hover:bg-indigo-50">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-1 border-teal-600 text-teal-700 hover:bg-teal-50">
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            {/* Invoice Creation Dialog */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={openInvoiceDialog}
                >
                  <Plus className="h-4 w-4" />
                  New Invoice
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl">Create New Invoice</DialogTitle>
                      <DialogDescription>
                        Create a comprehensive invoice for physiotherapy services
                      </DialogDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Invoice ID</p>
                      <p className="font-bold text-indigo-600">{invoiceDetails.invoiceId}</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Patient and Invoice Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Information - ID Only */}
                    <Card>
                    <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <User className="h-5 w-5 text-indigo-600" />
      Patient Information
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="patientId">Patient ID *</Label>
      <div className="relative mt-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          id="patientId"
          value={patientInfo.patientId}
          onChange={(e) => setPatientInfo({...patientInfo, patientId: e.target.value})}
          placeholder="e.g., PT-0258"
          className="pl-10"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">Patient details will be auto-fetched from database</p>
    </div>
    
    {/* Mock Patient Display - Shows found/not found states */}
    {patientInfo.patientId && (
      <>
        {/* Patient Found State */}
        {patientInfo.patientId.startsWith('PT-') ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-800">Patient Found</span>
            </div>
            
            {/* Name */}
            <div>
              <Label className="text-xs">Name</Label>
              <div className="relative mt-0.5">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="Rohan Mondal"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
            
            {/* Email */}
            <div>
              <Label className="text-xs">Email</Label>
              <div className="relative mt-0.5">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="rohan.mondal@gmail.com"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
            
            {/* Phone */}
            <div>
              <Label className="text-xs">Phone</Label>
              <div className="relative mt-0.5">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="9800095652"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
            
            {/* Gender */}
            <div>
              <Label className="text-xs">Gender</Label>
              <div className="relative mt-0.5">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="Male"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
            
            {/* Address */}
            <div>
              <Label className="text-xs">Address</Label>
              <div className="relative mt-0.5">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="123 Park Street, Kolkata"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
            
            {/* Assigned Therapist */}
            <div>
              <Label className="text-xs">Assigned Therapist</Label>
              <div className="relative mt-0.5">
                <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value="Dr. Mainak Sur (PT)"
                  readOnly
                  className="pl-10 bg-gray-50 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Patient Not Found State */
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">Patient Not Found</p>
                <p className="text-sm text-red-600 mt-1">
                  No patient found with ID: {patientInfo.patientId}
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p>Please check the patient ID or:</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-500">
                <li>Verify the ID format (e.g., PT-0258)</li>
                <li>Create a new patient record</li>
                <li>Search in archived patients</li>
              </ul>
            </div>
          </div>
        )}
      </>
    )}
  </CardContent>
                    </Card>

                    {/* Invoice Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          Invoice Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="invoiceDate">Invoice Date</Label>
                          <Input
                            id="invoiceDate"
                            type="date"
                            value={invoiceDetails.date}
                            onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={paymentDetails.paymentMethod}
                            onValueChange={(value) => setPaymentDetails({...paymentDetails, paymentMethod: value})}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Credit/Debit Card</SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="netbanking">Net Banking</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            value={paymentDetails.amountPaid}
                            onChange={(e) => setPaymentDetails({...paymentDetails, amountPaid: Number(e.target.value)})}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Available Services - Checkbox Style */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" />
                            Available Services
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Select services to add to the invoice</p>
                        </div>
                        <Badge variant="outline" className="text-indigo-600">
                          {selectedServices.length} Selected
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Physical Therapy Services */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                            <Activity className="h-4 w-4" />
                            <h3 className="font-semibold">Physical Therapy</h3>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {availableServices.filter(s => s.category === 'Physical Therapy').length} services
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {availableServices
                              .filter(service => service.category === 'Physical Therapy')
                              .map((service) => {
                                const isSelected = selectedServices.some(s => s.id === service.id)
                                const quantity = selectedServices.find(s => s.id === service.id)?.quantity || 0
                                
                                return (
                                  <div
                                    key={service.id}
                                    className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                      isSelected 
                                        ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => isSelected ? removeService(service.id) : addService(service)}
                                  >
                                    {/* Checkbox */}
                                    <div className="absolute top-2 right-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        isSelected 
                                          ? 'bg-indigo-600 border-indigo-600' 
                                          : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                      </div>
                                    </div>

                                    {/* Service Content */}
                                    <div className="pr-6">
                                      <h4 className={`font-semibold text-sm mb-1 ${
                                        isSelected ? 'text-indigo-900' : 'text-gray-800'
                                      }`}>
                                        {service.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                        {service.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold ${
                                          isSelected ? 'text-indigo-600' : 'text-gray-700'
                                        }`}>
                                          ₹{service.price}
                                        </p>
                                        {isSelected && (
                                          <Badge className="bg-indigo-600 text-white text-xs py-0 px-1">
                                            Added
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    {isSelected && (
                                      <div 
                                        className="mt-2 pt-2 border-t border-indigo-200"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-indigo-700">Qty:</span>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                                            >
                                              <Minus className="h-2.5 w-2.5" />
                                            </Button>
                                            <span className="w-5 text-center font-semibold text-indigo-800 text-xs">
                                              {quantity}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                            >
                                              <Plus className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-xs">
                                          <span className="text-gray-600">Total:</span>
                                          <span className="font-bold text-indigo-700">
                                            ₹{(service.price * quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        {/* Consultation Services */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 border-green-200 text-green-700">
                            <Stethoscope className="h-4 w-4" />
                            <h3 className="font-semibold">Consultation</h3>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {availableServices.filter(s => s.category === 'Consultation').length} services
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {availableServices
                              .filter(service => service.category === 'Consultation')
                              .map((service) => {
                                const isSelected = selectedServices.some(s => s.id === service.id)
                                const quantity = selectedServices.find(s => s.id === service.id)?.quantity || 0
                                
                                return (
                                  <div
                                    key={service.id}
                                    className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                      isSelected 
                                        ? 'border-green-500 bg-green-50 shadow-md' 
                                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => isSelected ? removeService(service.id) : addService(service)}
                                  >
                                    <div className="absolute top-2 right-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        isSelected 
                                          ? 'bg-green-600 border-green-600' 
                                          : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                      </div>
                                    </div>

                                    <div className="pr-6">
                                      <h4 className={`font-semibold text-sm mb-1 ${
                                        isSelected ? 'text-green-900' : 'text-gray-800'
                                      }`}>
                                        {service.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                        {service.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold ${
                                          isSelected ? 'text-green-600' : 'text-gray-700'
                                        }`}>
                                          ₹{service.price}
                                        </p>
                                        {isSelected && (
                                          <Badge className="bg-green-600 text-white text-xs py-0 px-1">
                                            Added
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div 
                                        className="mt-2 pt-2 border-t border-green-200"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-green-700">Qty:</span>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-green-300 text-green-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                                            >
                                              <Minus className="h-2.5 w-2.5" />
                                            </Button>
                                            <span className="w-5 text-center font-semibold text-green-800 text-xs">
                                              {quantity}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-green-300 text-green-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                            >
                                              <Plus className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-xs">
                                          <span className="text-gray-600">Total:</span>
                                          <span className="font-bold text-green-700">
                                            ₹{(service.price * quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        {/* COMBO TREATMENT Services */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700">
                            <Calculator className="h-4 w-4" />
                            <h3 className="font-semibold">COMBO TREATMENT</h3>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {availableServices.filter(s => s.category === 'COMBO TREATMENT').length} services
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {availableServices
                              .filter(service => service.category === 'COMBO TREATMENT')
                              .map((service) => {
                                const isSelected = selectedServices.some(s => s.id === service.id)
                                const quantity = selectedServices.find(s => s.id === service.id)?.quantity || 0
                                
                                return (
                                  <div
                                    key={service.id}
                                    className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                      isSelected 
                                        ? 'border-purple-500 bg-purple-50 shadow-md' 
                                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => isSelected ? removeService(service.id) : addService(service)}
                                  >
                                    <div className="absolute top-2 right-2">
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        isSelected 
                                          ? 'bg-purple-600 border-purple-600' 
                                          : 'border-gray-300'
                                      }`}>
                                        {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                      </div>
                                    </div>

                                    <div className="pr-6">
                                      <h4 className={`font-semibold text-sm mb-1 ${
                                        isSelected ? 'text-purple-900' : 'text-gray-800'
                                      }`}>
                                        {service.name}
                                      </h4>
                                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                        {service.description}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold ${
                                          isSelected ? 'text-purple-600' : 'text-gray-700'
                                        }`}>
                                          ₹{service.price}
                                        </p>
                                        {isSelected && (
                                          <Badge className="bg-purple-600 text-white text-xs py-0 px-1">
                                            Added
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {isSelected && (
                                      <div 
                                        className="mt-2 pt-2 border-t border-purple-200"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium text-purple-700">Qty:</span>
                                          <div className="flex items-center gap-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-purple-300 text-purple-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity - 1)}
                                            >
                                              <Minus className="h-2.5 w-2.5" />
                                            </Button>
                                            <span className="w-5 text-center font-semibold text-purple-800 text-xs">
                                              {quantity}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-5 w-5 p-0 border-purple-300 text-purple-600"
                                              onClick={() => updateServiceQuantity(service.id, quantity + 1)}
                                            >
                                              <Plus className="h-2.5 w-2.5" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-xs">
                                          <span className="text-gray-600">Total:</span>
                                          <span className="font-bold text-purple-700">
                                            ₹{(service.price * quantity)}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>

                        {/* Summary Section */}
                        {selectedServices.length > 0 && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-indigo-600" />
                                <span className="font-semibold text-indigo-800">
                                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-indigo-600">Total Quantity</p>
                                <p className="font-bold text-indigo-800">
                                  {selectedServices.reduce((sum, s) => sum + s.quantity, 0)} sessions
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Selected Services</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedServices.map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-semibold">{service.name}</h4>
                                <p className="text-sm text-gray-600">₹{service.price} per session</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{service.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                                    className="h-8 w-8 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <p className="font-bold">₹{service.price * service.quantity}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeService(service.id)}
                                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-4" />

                        {/* Totals */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{calculateSubtotal()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>GST (18%):</span>
                              <span>₹{calculateOffer()}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span>₹{calculateTotal()}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Amount Paid:</span>
                              <span>₹{paymentDetails.amountPaid}</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-semibold">
                              <span>Balance Due:</span>
                              <span>₹{calculateBalance()}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

               
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeInvoiceDialog}>
                    Cancel
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handlePrintInvoice}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button 
                    onClick={handleSaveInvoice}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-teal-50 p-3 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-teal-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <h3 className="text-2xl font-bold">₹2,85,000</h3>
                <p className="text-xs text-green-600">+12% from last month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-green-50 p-3 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid Invoices</p>
                <h3 className="text-2xl font-bold">₹2,28,000</h3>
                <p className="text-xs text-green-600">80% of total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center">
              <div className="bg-amber-50 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <h3 className="text-2xl font-bold">₹57,000</h3>
                <p className="text-xs text-amber-600">20% of total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="font-semibold text-white">Invoice ID</TableHead>
                <TableHead className="font-semibold text-white">Patient</TableHead>
                <TableHead className="font-semibold text-white">Date</TableHead>
                <TableHead className="font-semibold text-white">Amount</TableHead>
                <TableHead className="font-semibold text-white">Status</TableHead>
                <TableHead className="font-semibold text-white text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{invoice.patient}</p>
                      <p className="text-sm text-gray-500">{invoice.patientId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell className="font-semibold">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                      {invoice.status === "Paid" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Clock className="h-3 w-3 mr-1" />
                      )}
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice details",
                              description: `Viewing details for invoice ${invoice.id}`,
                            })
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice printed",
                              description: `Invoice ${invoice.id} sent to printer`,
                            })
                          }}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Invoice downloaded",
                              description: `Invoice ${invoice.id} downloaded as PDF`,
                            })
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            toast({
                              title: "Payment reminder sent",
                              description: `Reminder sent to ${invoice.patient}`,
                            })
                          }}
                        >
                          Send Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />Previous
              </Button>
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button
                  key={pg}
                  size="sm"
                  variant={pg === page ? "default" : "outline"}
                  className={
                    pg === page
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                      : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  }
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next<ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>

      {/* Hidden Print Content */}
      {selectedServices.length > 0 && (
        <div className="print-area hidden print:block">
          <div className="max-w-4xl mx-auto bg-white p-8">
            {/* Print Header with Company Logo */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-indigo-600 pb-6">
              <div className="flex items-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-4 text-white font-bold text-2xl">
                  TC
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-indigo-600">THERA-CURE</h1>
                  <p className="text-gray-600 font-medium">Advanced Physiotherapy Clinic</p>
                  <div className="text-sm text-gray-500 mt-2">
                    <p>361/A, Basudevpur Road, Ground Floor</p>
                    <p>Nilanjana Apartment, Shyamnagar, West Bengal, 743127, India</p>
                    <p>📧 contacts@mstheracure.com | 📞 (033) 3564 7255</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
                <p className="text-xl text-indigo-600 font-semibold">#{invoiceDetails.invoiceId}</p>
                <div className="text-sm text-gray-600 mt-2">
                  <p><strong>Date:</strong> {new Date(invoiceDetails.date).toLocaleDateString('en-IN')}</p>
                  {invoiceDetails.dueDate && <p><strong>Due:</strong> {new Date(invoiceDetails.dueDate).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
            </div>

            {/* Patient and Treatment Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-300 pb-2">Bill To:</h3>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">Rohan Mondal</p>
                  <p className="text-gray-600"><strong>Patient ID:</strong> {patientInfo.patientId}</p>
                  <p className="text-gray-600"><strong>Phone:</strong> 9800095652</p>
                  <p className="text-gray-600"><strong>Address:</strong> 123 Park Street, Kolkata</p>
                </div>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-4 text-lg border-b border-gray-300 pb-2">Treatment Details:</h3>
                <div className="space-y-2">
                  <p className="text-gray-600"><strong>Payment Method:</strong> {paymentDetails.paymentMethod.toUpperCase()}</p>
                  <p className="text-gray-600"><strong>Payment Date:</strong> {new Date(paymentDetails.paymentDate).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="text-left p-4 border border-gray-300">Service</th>
                    <th className="text-center p-4 border border-gray-300">Qty</th>
                    <th className="text-right p-4 border border-gray-300">Rate (₹)</th>
                    <th className="text-right p-4 border border-gray-300">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedServices.map((service, index) => (
                    <tr key={service.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-4 border border-gray-300">
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.category}</p>
                          <p className="text-xs text-gray-500">{service.description}</p>
                        </div>
                      </td>
                      <td className="text-center p-4 border border-gray-300 font-semibold">{service.quantity}</td>
                      <td className="text-right p-4 border border-gray-300">₹{service.price.toLocaleString('en-IN')}</td>
                      <td className="text-right p-4 border border-gray-300 font-semibold">₹{(service.price * service.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals and Payment Summary */}
            <div className="flex justify-end mb-8">
              <div className="w-96">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>₹{calculateSubtotal().toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Offer applyed ({}%):</span>
                      <span>₹{calculateOffer().toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t-2 border-gray-300 pt-3">
                      <div className="flex justify-between text-xl font-bold text-gray-900">
                        <span>Total Amount:</span>
                        <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>Amount Paid:</span>
                      <span>₹{paymentDetails.amountPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-bold text-lg border-t border-gray-300 pt-3">
                      <span>Balance Due:</span>
                      <span>₹{calculateBalance().toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoiceDetails.notes && (
              <div className="mb-8 bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                <h4 className="font-semibold text-gray-800 mb-2">Notes:</h4>
                <p className="text-gray-700">{invoiceDetails.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-300 pt-6 text-center">
              <div className="mb-4">
                <p className="text-lg font-semibold text-indigo-600">Thank you for choosing Thera-Cure!</p>
                <p className="text-gray-600">Your health and recovery are our priority.</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>For any queries regarding this invoice, please contact us at the above details.</p>
                <p className="mt-2">This is a computer-generated invoice and does not require a signature.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}