"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Printer, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  PlayCircle,
  PauseCircle,
  Trash2,
  Plus,
  Settings,
  FileText,
  Download
} from "lucide-react"
import type { SavedInvoice } from "./invoice-manager"

export interface PrintJob {
  id: string
  invoiceId: string
  invoiceNumber: string
  clientName: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'queued' | 'printing' | 'completed' | 'failed' | 'paused'
  addedAt: Date
  printedAt?: Date
  copies: number
  settings: PrintSettings
}

interface PrintSettings {
  paperSize: 'A4' | 'A5' | 'Letter'
  orientation: 'portrait' | 'landscape'
  quality: 'draft' | 'normal' | 'high'
  duplex: boolean
  colorMode: 'color' | 'grayscale' | 'blackwhite'
}

interface PrintQueueManagerProps {
  invoices: SavedInvoice[]
  onPrintStart: (job: PrintJob) => void
  onPrintComplete: (job: PrintJob) => void
}

export default function PrintQueueManager({ invoices, onPrintStart, onPrintComplete }: PrintQueueManagerProps) {
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [defaultSettings, setDefaultSettings] = useState<PrintSettings>({
    paperSize: 'A4',
    orientation: 'portrait',
    quality: 'normal',
    duplex: false,
    colorMode: 'blackwhite'
  })
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const processingInterval = useRef<NodeJS.Timeout | null>(null)

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('print-queue')
    if (savedQueue) {
      const parsedQueue = JSON.parse(savedQueue).map((job: any) => ({
        ...job,
        addedAt: new Date(job.addedAt),
        printedAt: job.printedAt ? new Date(job.printedAt) : undefined
      }))
      setPrintQueue(parsedQueue)
    }

    const savedSettings = localStorage.getItem('print-settings')
    if (savedSettings) {
      setDefaultSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('print-queue', JSON.stringify(printQueue))
  }, [printQueue])

  // Process print queue
  useEffect(() => {
    if (isProcessing && printQueue.length > 0) {
      processingInterval.current = setInterval(() => {
        processNextJob()
      }, 3000) // Process next job every 3 seconds
    } else {
      if (processingInterval.current) {
        clearInterval(processingInterval.current)
        processingInterval.current = null
      }
    }

    return () => {
      if (processingInterval.current) {
        clearInterval(processingInterval.current)
      }
    }
  }, [isProcessing, printQueue])

  const addToQueue = (invoiceIds: string[], copies: number = 1, priority: PrintJob['priority'] = 'normal') => {
    const newJobs: PrintJob[] = invoiceIds.map(invoiceId => {
      const invoice = invoices.find(inv => inv.id === invoiceId)
      if (!invoice) return null

      return {
        id: `print-job-${Date.now()}-${invoiceId}`,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        priority,
        status: 'queued' as const,
        addedAt: new Date(),
        copies,
        settings: { ...defaultSettings }
      }
    }).filter(Boolean) as PrintJob[]

    const updatedQueue = [...printQueue, ...newJobs].sort((a, b) => {
      // Sort by priority, then by date added
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return a.addedAt.getTime() - b.addedAt.getTime()
    })

    setPrintQueue(updatedQueue)
    setSelectedInvoices([])
  }

  const processNextJob = async () => {
    const nextJob = printQueue.find(job => job.status === 'queued')
    if (!nextJob) {
      setIsProcessing(false)
      return
    }

    // Mark job as printing
    setPrintQueue(queue => 
      queue.map(job => 
        job.id === nextJob.id ? { ...job, status: 'printing' as const } : job
      )
    )
    setCurrentJobId(nextJob.id)

    try {
      // Simulate printing process
      onPrintStart(nextJob)
      
      // Find the invoice and trigger print
      const invoice = invoices.find(inv => inv.id === nextJob.invoiceId)
      if (invoice) {
        // Here you would integrate with actual printing API
        // For now, we'll simulate the printing process
        await simulatePrinting(nextJob)
        
        // Mark as completed
        const completedJob = {
          ...nextJob,
          status: 'completed' as const,
          printedAt: new Date()
        }
        
        setPrintQueue(queue => 
          queue.map(job => 
            job.id === nextJob.id ? completedJob : job
          )
        )
        
        onPrintComplete(completedJob)
      } else {
        // Mark as failed if invoice not found
        setPrintQueue(queue => 
          queue.map(job => 
            job.id === nextJob.id ? { ...job, status: 'failed' as const } : job
          )
        )
      }
    } catch (error) {
      // Mark as failed on error
      setPrintQueue(queue => 
        queue.map(job => 
          job.id === nextJob.id ? { ...job, status: 'failed' as const } : job
        )
      )
    } finally {
      setCurrentJobId(null)
    }
  }

  const simulatePrinting = (job: PrintJob): Promise<void> => {
    return new Promise((resolve) => {
      // Simulate printing time based on copies and quality
      const baseTime = 2000 // 2 seconds base time
      const copyTime = job.copies * 500 // 500ms per copy
      const qualityTime = job.settings.quality === 'high' ? 1000 : 
                          job.settings.quality === 'normal' ? 500 : 0
      
      const totalTime = baseTime + copyTime + qualityTime
      setTimeout(resolve, totalTime)
    })
  }

  const removeFromQueue = (jobId: string) => {
    setPrintQueue(queue => queue.filter(job => job.id !== jobId))
  }

  const pauseJob = (jobId: string) => {
    setPrintQueue(queue => 
      queue.map(job => 
        job.id === jobId ? { ...job, status: 'paused' as const } : job
      )
    )
  }

  const resumeJob = (jobId: string) => {
    setPrintQueue(queue => 
      queue.map(job => 
        job.id === jobId ? { ...job, status: 'queued' as const } : job
      )
    )
  }

  const retryFailedJob = (jobId: string) => {
    setPrintQueue(queue => 
      queue.map(job => 
        job.id === jobId ? { ...job, status: 'queued' as const } : job
      )
    )
  }

  const clearCompleted = () => {
    setPrintQueue(queue => queue.filter(job => job.status !== 'completed'))
  }

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all print jobs?')) {
      setPrintQueue([])
      setIsProcessing(false)
    }
  }

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    )
  }

  const getPriorityColor = (priority: PrintJob['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: PrintJob['status']) => {
    switch (status) {
      case 'queued': return 'bg-yellow-100 text-yellow-800'
      case 'printing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'paused': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: PrintJob['status']) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4" />
      case 'printing': return <Printer className="w-4 h-4 animate-pulse" />
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'failed': return <AlertTriangle className="w-4 h-4" />
      case 'paused': return <PauseCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const queueStats = {
    total: printQueue.length,
    queued: printQueue.filter(j => j.status === 'queued').length,
    printing: printQueue.filter(j => j.status === 'printing').length,
    completed: printQueue.filter(j => j.status === 'completed').length,
    failed: printQueue.filter(j => j.status === 'failed').length,
    paused: printQueue.filter(j => j.status === 'paused').length
  }

  return (
    <div className="space-y-6">
      {/* Print Queue Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{queueStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{queueStats.queued}</p>
                <p className="text-xs text-muted-foreground">Queued</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{queueStats.printing}</p>
                <p className="text-xs text-muted-foreground">Printing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{queueStats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <PauseCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-2xl font-bold text-gray-600">{queueStats.paused}</p>
                <p className="text-xs text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Print Queue Manager
              </CardTitle>
              <CardDescription>
                Manage batch printing of invoices with priority control
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isProcessing ? "destructive" : "default"}
                onClick={() => setIsProcessing(!isProcessing)}
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <PauseCircle className="w-4 h-4 mr-2" />
                    Pause Queue
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Queue
                  </>
                )}
              </Button>
              {queueStats.completed > 0 && (
                <Button variant="outline" onClick={clearCompleted} size="sm">
                  Clear Completed
                </Button>
              )}
              {queueStats.total > 0 && (
                <Button variant="outline" onClick={clearAll} size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add to Queue Section */}
          <div className="p-4 bg-muted rounded-lg space-y-4">
            <h4 className="font-medium">Add Invoices to Print Queue</h4>
            
            {/* Invoice Selection */}
            <div className="max-h-40 overflow-y-auto space-y-2">
              {invoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={`invoice-${invoice.id}`}
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={() => toggleInvoiceSelection(invoice.id)}
                  />
                  <label
                    htmlFor={`invoice-${invoice.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {invoice.invoiceNumber} - {invoice.clientName} (Rs {invoice.total.toFixed(2)})
                  </label>
                </div>
              ))}
            </div>

            {/* Quick Add Options */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const unpaidInvoices = invoices
                    .filter(inv => inv.status !== 'paid')
                    .map(inv => inv.id)
                  setSelectedInvoices(unpaidInvoices)
                }}
              >
                Select Unpaid
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoices(invoices.map(inv => inv.id))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoices([])}
              >
                Clear Selection
              </Button>
            </div>

            {/* Add to Queue Controls */}
            {selectedInvoices.length > 0 && (
              <div className="flex gap-4 items-center">
                <div className="flex gap-2">
                  <Select defaultValue="normal" onValueChange={(value) => 
                    addToQueue(selectedInvoices, 1, value as PrintJob['priority'])
                  }>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Priority</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => addToQueue(selectedInvoices)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Queue ({selectedInvoices.length})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Current Queue */}
          {printQueue.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Print Queue</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {printQueue.map((job) => (
                  <div key={job.id} className={`p-3 border rounded-lg ${currentJobId === job.id ? 'ring-2 ring-blue-500' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getPriorityColor(job.priority)}>
                            {job.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(job.status)}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1">{job.status}</span>
                          </Badge>
                          {job.copies > 1 && (
                            <span className="text-xs text-muted-foreground">
                              {job.copies} copies
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">{job.invoiceNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{job.clientName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Added: {job.addedAt.toLocaleString()}
                            {job.printedAt && (
                              <div>Printed: {job.printedAt.toLocaleString()}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground mt-1">
                          {job.settings.paperSize} • {job.settings.orientation} • {job.settings.quality} quality
                          {job.settings.duplex && ' • Duplex'} • {job.settings.colorMode}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {job.status === 'queued' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => pauseJob(job.id)}
                          >
                            <PauseCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === 'paused' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resumeJob(job.id)}
                          >
                            <PlayCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {job.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryFailedJob(job.id)}
                          >
                            <PlayCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromQueue(job.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {printQueue.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Printer className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No print jobs in queue</p>
              <p className="text-sm">Select invoices above to add them to the print queue</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
