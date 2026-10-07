"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Settings,
  Send,
  History
} from "lucide-react"
import type { SavedInvoice } from "./invoice-manager"

interface PaymentReminder {
  id: string
  invoiceId: string
  type: 'email' | 'whatsapp' | 'both'
  reminderDate: Date
  message: string
  status: 'scheduled' | 'sent' | 'failed'
  attempts: number
  lastAttempt?: Date
}

interface ReminderTemplate {
  id: string
  name: string
  subject?: string
  message: string
  type: 'email' | 'whatsapp'
  triggerDays: number // Days after due date
}

interface PaymentReminderSystemProps {
  invoices: SavedInvoice[]
  onReminderSent: (reminder: PaymentReminder) => void
}

export default function PaymentReminderSystem({ invoices, onReminderSent }: PaymentReminderSystemProps) {
  const [reminders, setReminders] = useState<PaymentReminder[]>([])
  const [templates, setTemplates] = useState<ReminderTemplate[]>([])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<ReminderTemplate>>({
    name: '',
    message: '',
    type: 'whatsapp',
    triggerDays: 7
  })

  // Default templates
  useEffect(() => {
    const defaultTemplates: ReminderTemplate[] = [
      {
        id: 'whatsapp-gentle',
        name: 'WhatsApp Gentle Reminder',
        type: 'whatsapp',
        triggerDays: 3,
        message: `🔔 *Payment Reminder*

Hi {{clientName}},

Hope you're doing well! This is a gentle reminder that payment for Invoice {{invoiceNumber}} (Rs {{amount}}) was due on {{dueDate}}.

We understand that sometimes things can slip through the cracks. If you've already made the payment, please ignore this message.

If you have any questions or need to discuss payment terms, please let us know.

Thank you!
*Biocure Health Care*
📞 0345-5167742`
      },
      {
        id: 'email-formal',
        name: 'Email Formal Reminder',
        type: 'email',
        subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
        triggerDays: 7,
        message: `Dear {{clientName}},

I hope this email finds you well.

This is a friendly reminder that payment for Invoice {{invoiceNumber}} in the amount of Rs {{amount}} was due on {{dueDate}}.

Invoice Details:
- Invoice Number: {{invoiceNumber}}
- Due Date: {{dueDate}}
- Amount Due: Rs {{amount}}

If payment has already been sent, please disregard this notice. If you have any questions about this invoice or need to discuss payment arrangements, please contact us.

Thank you for your prompt attention to this matter.

Best regards,
Biocure Health Care
Phone: 0345-5167742
Email: biocurehealthcare1979@gmail.com`
      },
      {
        id: 'whatsapp-urgent',
        name: 'WhatsApp Urgent Reminder',
        type: 'whatsapp',
        triggerDays: 14,
        message: `⚠️ *URGENT: Payment Overdue*

Hello {{clientName}},

This is an urgent reminder that payment for Invoice {{invoiceNumber}} (Rs {{amount}}) is now {{daysPastDue}} days overdue.

Original Due Date: {{dueDate}}
Current Balance: Rs {{amount}}

Please arrange payment immediately to avoid any inconvenience. If there are any issues preventing payment, please contact us immediately.

*Biocure Health Care*
📞 0345-5167742 (Call/WhatsApp)
📧 biocurehealthcare1979@gmail.com`
      }
    ]
    setTemplates(defaultTemplates)
    
    // Load saved reminders
    const savedReminders = localStorage.getItem('payment-reminders')
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }
  }, [])

  // Check for overdue invoices and schedule reminders
  useEffect(() => {
    const checkOverdueInvoices = () => {
      const today = new Date()
      const overdueInvoices = invoices.filter(invoice => {
        if (!invoice.dueDate || invoice.status === 'paid') return false
        const dueDate = new Date(invoice.dueDate)
        return dueDate < today
      })

      overdueInvoices.forEach(invoice => {
        const daysPastDue = Math.floor((today.getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        
        // Check if we should send reminders based on templates
        templates.forEach(template => {
          if (daysPastDue >= template.triggerDays) {
            const existingReminder = reminders.find(r => 
              r.invoiceId === invoice.id && 
              r.status === 'scheduled' &&
              r.reminderDate.toDateString() === today.toDateString()
            )
            
            if (!existingReminder) {
              scheduleReminder(invoice, template, daysPastDue)
            }
          }
        })
      })
    }

    const interval = setInterval(checkOverdueInvoices, 60000) // Check every minute
    checkOverdueInvoices() // Initial check

    return () => clearInterval(interval)
  }, [invoices, templates, reminders])

  const scheduleReminder = (invoice: SavedInvoice, template: ReminderTemplate, daysPastDue: number) => {
    const reminderMessage = populateTemplate(template.message, invoice, daysPastDue)
    
    const newReminder: PaymentReminder = {
      id: `reminder-${Date.now()}-${invoice.id}`,
      invoiceId: invoice.id,
      type: template.type,
      reminderDate: new Date(),
      message: reminderMessage,
      status: 'scheduled',
      attempts: 0
    }

    const updatedReminders = [...reminders, newReminder]
    setReminders(updatedReminders)
    localStorage.setItem('payment-reminders', JSON.stringify(updatedReminders))
  }

  const populateTemplate = (template: string, invoice: SavedInvoice, daysPastDue?: number): string => {
    return template
      .replace(/{{clientName}}/g, invoice.clientInfo?.name || invoice.clientName)
      .replace(/{{invoiceNumber}}/g, invoice.invoiceNumber)
      .replace(/{{amount}}/g, invoice.total.toFixed(2))
      .replace(/{{dueDate}}/g, new Date(invoice.dueDate).toLocaleDateString())
      .replace(/{{daysPastDue}}/g, daysPastDue?.toString() || '0')
  }

  const sendWhatsAppReminder = (reminder: PaymentReminder, invoice: SavedInvoice) => {
    const clientPhone = invoice.clientInfo?.phone || ''
    const cleanPhone = clientPhone.replace(/\D/g, '')
    
    if (cleanPhone) {
      const message = encodeURIComponent(reminder.message)
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
      markReminderAsSent(reminder.id)
    } else {
      markReminderAsFailed(reminder.id, 'No phone number available')
    }
  }

  const sendEmailReminder = (reminder: PaymentReminder, invoice: SavedInvoice) => {
    const clientEmail = invoice.clientInfo?.email || ''
    
    if (clientEmail) {
      const template = templates.find(t => t.type === 'email')
      const subject = template?.subject ? populateTemplate(template.subject, invoice) : `Payment Reminder - Invoice ${invoice.invoiceNumber}`
      
      const emailBody = encodeURIComponent(reminder.message)
      window.open(`mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${emailBody}`, '_blank')
      markReminderAsSent(reminder.id)
    } else {
      markReminderAsFailed(reminder.id, 'No email address available')
    }
  }

  const markReminderAsSent = (reminderId: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, status: 'sent' as const, lastAttempt: new Date(), attempts: reminder.attempts + 1 }
        : reminder
    )
    setReminders(updatedReminders)
    localStorage.setItem('payment-reminders', JSON.stringify(updatedReminders))
  }

  const markReminderAsFailed = (reminderId: string, error: string) => {
    const updatedReminders = reminders.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, status: 'failed' as const, lastAttempt: new Date(), attempts: reminder.attempts + 1 }
        : reminder
    )
    setReminders(updatedReminders)
    localStorage.setItem('payment-reminders', JSON.stringify(updatedReminders))
    alert(`Failed to send reminder: ${error}`)
  }

  const createCustomReminder = (invoice: SavedInvoice) => {
    const message = prompt('Enter reminder message:', 
      `Hi ${invoice.clientInfo?.name || invoice.clientName}, this is a reminder that payment for Invoice ${invoice.invoiceNumber} (Rs ${invoice.total.toFixed(2)}) is due.`)
    
    if (message) {
      const reminder: PaymentReminder = {
        id: `custom-${Date.now()}-${invoice.id}`,
        invoiceId: invoice.id,
        type: 'whatsapp',
        reminderDate: new Date(),
        message,
        status: 'scheduled',
        attempts: 0
      }
      
      sendWhatsAppReminder(reminder, invoice)
    }
  }

  const addTemplate = () => {
    if (newTemplate.name && newTemplate.message) {
      const template: ReminderTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplate.name!,
        message: newTemplate.message!,
        type: newTemplate.type!,
        triggerDays: newTemplate.triggerDays!,
        subject: newTemplate.subject
      }
      
      const updatedTemplates = [...templates, template]
      setTemplates(updatedTemplates)
      localStorage.setItem('reminder-templates', JSON.stringify(updatedTemplates))
      
      setNewTemplate({
        name: '',
        message: '',
        type: 'whatsapp',
        triggerDays: 7
      })
    }
  }

  const overdueInvoices = invoices.filter(invoice => {
    if (!invoice.dueDate || invoice.status === 'paid') return false
    return new Date(invoice.dueDate) < new Date()
  })

  const pendingReminders = reminders.filter(r => r.status === 'scheduled')
  const sentReminders = reminders.filter(r => r.status === 'sent')

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Invoices</p>
                <p className="text-2xl font-bold text-red-600">{overdueInvoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Reminders</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reminders Sent</p>
                <p className="text-2xl font-bold text-green-600">{sentReminders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices List */}
      {overdueInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Overdue Invoices Requiring Action
            </CardTitle>
            <CardDescription>
              These invoices are past their due date and need payment reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((invoice) => {
                const daysPastDue = Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24))
                const invoiceReminders = reminders.filter(r => r.invoiceId === invoice.id)
                
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{invoice.invoiceNumber}</h4>
                        <Badge variant="destructive">{daysPastDue} days overdue</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{invoice.clientName} • Rs {invoice.total.toFixed(2)}</p>
                      {invoiceReminders.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {invoiceReminders.length} reminder(s) sent
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendWhatsAppReminder(
                          {
                            id: `instant-${Date.now()}`,
                            invoiceId: invoice.id,
                            type: 'whatsapp',
                            reminderDate: new Date(),
                            message: templates[0]?.message || 'Payment reminder',
                            status: 'scheduled',
                            attempts: 0
                          },
                          invoice
                        )}
                        className="text-green-600 hover:text-green-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendEmailReminder(
                          {
                            id: `instant-${Date.now()}`,
                            invoiceId: invoice.id,
                            type: 'email',
                            reminderDate: new Date(),
                            message: templates.find(t => t.type === 'email')?.message || 'Payment reminder',
                            status: 'scheduled',
                            attempts: 0
                          },
                          invoice
                        )}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings and Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Reminder Settings & Templates
              </CardTitle>
              <CardDescription>
                Manage automatic reminder templates and settings
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              {isSettingsOpen ? 'Hide' : 'Show'} Settings
            </Button>
          </div>
        </CardHeader>
        
        {isSettingsOpen && (
          <CardContent className="space-y-6">
            {/* Add New Template */}
            <div className="space-y-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium">Create New Template</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                    placeholder="e.g., Gentle Reminder"
                  />
                </div>
                
                <div>
                  <Label htmlFor="template-type">Type</Label>
                  <Select value={newTemplate.type} onValueChange={(value: 'email' | 'whatsapp') => setNewTemplate({...newTemplate, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="trigger-days">Trigger Days (after due date)</Label>
                  <Input
                    id="trigger-days"
                    type="number"
                    value={newTemplate.triggerDays}
                    onChange={(e) => setNewTemplate({...newTemplate, triggerDays: parseInt(e.target.value)})}
                    placeholder="7"
                  />
                </div>
                
                {newTemplate.type === 'email' && (
                  <div>
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input
                      id="email-subject"
                      value={newTemplate.subject || ''}
                      onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})}
                      placeholder="Payment Reminder - Invoice {{invoiceNumber}}"
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="template-message">Message Template</Label>
                <Textarea
                  id="template-message"
                  value={newTemplate.message}
                  onChange={(e) => setNewTemplate({...newTemplate, message: e.target.value})}
                  placeholder="Use {{clientName}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, {{daysPastDue}} as variables"
                  className="h-32"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Available variables: {'{clientName}'}, {'{invoiceNumber}'}, {'{amount}'}, {'{dueDate}'}, {'{daysPastDue}'}
                </p>
              </div>
              
              <Button onClick={addTemplate} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>

            {/* Existing Templates */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Templates</h4>
              {templates.map((template) => (
                <div key={template.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {template.type === 'email' ? <Mail className="w-3 h-3 mr-1" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                        {template.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Triggers {template.triggerDays} days after due date
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.message.substring(0, 100)}...
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Reminder History */}
      {reminders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Reminder History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reminders.slice(0, 10).map((reminder) => {
                const invoice = invoices.find(inv => inv.id === reminder.invoiceId)
                return (
                  <div key={reminder.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{invoice?.invoiceNumber} - {invoice?.clientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {reminder.type.toUpperCase()} • {reminder.reminderDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={reminder.status === 'sent' ? 'default' : reminder.status === 'failed' ? 'destructive' : 'secondary'}>
                      {reminder.status}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
