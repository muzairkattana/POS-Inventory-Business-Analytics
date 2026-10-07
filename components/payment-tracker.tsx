"use client"

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Mail
} from 'lucide-react'

interface PaymentStatus {
  id: string
  invoiceId: string
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  totalAmount: number
  paidAmount: number
  dueDate: Date
  lastReminder?: Date
}

interface PaymentTrackerProps {
  invoiceId: string
  totalAmount: number
  onPaymentUpdate: (status: PaymentStatus) => void
}

export default function PaymentTracker({ invoiceId, totalAmount, onPaymentUpdate }: PaymentTrackerProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    id: `payment-${invoiceId}`,
    invoiceId,
    status: 'pending',
    totalAmount,
    paidAmount: 0,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  })

  const getStatusColor = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusIcon = (status: PaymentStatus['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4" />
      case 'partial': return <Clock className="w-4 h-4" />
      case 'overdue': return <AlertTriangle className="w-4 h-4" />
      default: return <CreditCard className="w-4 h-4" />
    }
  }

  const markAsPaid = () => {
    const updatedStatus: PaymentStatus = {
      ...paymentStatus,
      status: 'paid',
      paidAmount: totalAmount
    }
    setPaymentStatus(updatedStatus)
    onPaymentUpdate(updatedStatus)
  }

  const recordPartialPayment = (amount: number) => {
    const updatedStatus: PaymentStatus = {
      ...paymentStatus,
      status: amount >= totalAmount ? 'paid' : 'partial',
      paidAmount: amount
    }
    setPaymentStatus(updatedStatus)
    onPaymentUpdate(updatedStatus)
  }

  const sendReminder = () => {
    const updatedStatus: PaymentStatus = {
      ...paymentStatus,
      lastReminder: new Date()
    }
    setPaymentStatus(updatedStatus)
    // Here you would integrate with email service
    alert('Payment reminder sent!')
  }

  const remainingAmount = totalAmount - paymentStatus.paidAmount
  const progressPercentage = (paymentStatus.paidAmount / totalAmount) * 100

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="w-5 h-5" />
          Payment Status
        </CardTitle>
        <CardDescription>
          Track payment progress and send reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${getStatusColor(paymentStatus.status)} flex items-center gap-2`}>
            {getStatusIcon(paymentStatus.status)}
            {paymentStatus.status.charAt(0).toUpperCase() + paymentStatus.status.slice(1)}
          </Badge>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Due Date</p>
            <p className="font-medium">{paymentStatus.dueDate.toLocaleDateString()}</p>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Payment Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                paymentStatus.status === 'paid' ? 'bg-green-500' : 
                paymentStatus.status === 'partial' ? 'bg-yellow-500' : 
                'bg-blue-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Paid: Rs {paymentStatus.paidAmount.toFixed(2)}</span>
            <span>Remaining: Rs {remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {paymentStatus.status !== 'paid' && (
            <>
              <Button 
                onClick={markAsPaid} 
                className="flex items-center gap-2"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Paid
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  const amount = prompt('Enter partial payment amount:')
                  if (amount && !isNaN(Number(amount))) {
                    recordPartialPayment(Number(amount))
                  }
                }}
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Partial Payment
              </Button>
              <Button 
                variant="outline" 
                onClick={sendReminder}
                size="sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Reminder
              </Button>
            </>
          )}
        </div>

        {/* Last Reminder */}
        {paymentStatus.lastReminder && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            Last reminder sent: {paymentStatus.lastReminder.toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
