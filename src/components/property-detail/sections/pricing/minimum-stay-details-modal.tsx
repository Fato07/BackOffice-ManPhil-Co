"use client"

import * as React from "react"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Clock,
  Moon,
  Calendar,
  Info,
  History,
  CheckCircle
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { MinimumStayRule, BookingCondition } from "@/generated/prisma"

interface MinimumStayDetailsModalProps {
  rule: MinimumStayRule | null
  open: boolean
  onClose: () => void
  onEdit?: (id: string) => void
}

const BOOKING_CONDITIONS: { value: BookingCondition; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: "PER_NIGHT", 
    label: "Per night",
    description: "Flexible daily bookings with minimum night requirements",
    icon: <Moon className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SATURDAY_TO_SATURDAY", 
    label: "Weekly - Saturday to Saturday",
    description: "Saturday check-in and check-out only, weekly stays",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SUNDAY_TO_SUNDAY", 
    label: "Weekly - Sunday to Sunday",
    description: "Sunday check-in and check-out only, weekly stays",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_MONDAY_TO_MONDAY", 
    label: "Weekly - Monday to Monday",
    description: "Monday check-in and check-out only, weekly stays",
    icon: <Calendar className="w-4 h-4" />
  },
]

export function MinimumStayDetailsModal({
  rule,
  open,
  onClose,
  onEdit,
}: MinimumStayDetailsModalProps) {
  if (!rule) return null

  const condition = BOOKING_CONDITIONS.find(c => c.value === rule.bookingCondition)
  const isYearRound = !rule.startDate || !rule.endDate
  const isWeekly = rule.bookingCondition.includes("WEEKLY")

  let duration = 0
  if (rule.startDate && rule.endDate) {
    const startDate = new Date(rule.startDate)
    const endDate = new Date(rule.endDate)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Minimum Stay Rule Details
          </DialogTitle>
          <DialogDescription className="mt-1">
            {condition?.label || rule.bookingCondition} • {rule.minimumNights} night{rule.minimumNights > 1 ? 's' : ''} minimum
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge 
                variant="secondary" 
                className={isWeekly ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-green-100 text-green-800 border-green-200"}
              >
                {isWeekly ? "Weekly" : "Flexible"}
              </Badge>
              {isYearRound ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  All year round
                </Badge>
              ) : (
                <Badge variant="outline">
                  Seasonal
                </Badge>
              )}
            </div>
          </div>

          {/* Booking Condition Details */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              {condition?.icon || <Calendar className="w-4 h-4 mr-2" />}
              Booking Condition
            </h3>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-lg">{condition?.label || rule.bookingCondition}</h4>
                <p className="text-sm text-muted-foreground mt-1">{condition?.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">Minimum Stay</span>
                  </div>
                  <p className="text-2xl font-semibold text-indigo-600">
                    {rule.minimumNights} night{rule.minimumNights > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Check-in Days</span>
                  </div>
                  <p className="text-lg font-medium text-gray-700">
                    {isWeekly ? (
                      rule.bookingCondition.includes("SATURDAY") ? "Saturday" :
                      rule.bookingCondition.includes("SUNDAY") ? "Sunday" :
                      rule.bookingCondition.includes("MONDAY") ? "Monday" : "Weekly"
                    ) : "Any day"}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Period Information */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Applicable Period
            </h3>
            
            {isYearRound ? (
              <div className="text-center py-6">
                <div className="p-3 bg-blue-50 rounded-full w-fit mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900">Active All Year Round</h4>
                <p className="text-sm text-blue-700 mt-1">This rule applies to all dates throughout the year</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{format(new Date(rule.startDate!), "EEEE, MMMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{format(new Date(rule.endDate!), "EEEE, MMMM dd, yyyy")}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Info className="w-4 h-4 mr-2 text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Duration</span>
                    </div>
                    <span className="text-lg font-semibold text-amber-600">
                      {duration} days
                      {duration > 30 && (
                        <span className="text-sm font-normal ml-1">
                          (~{Math.round(duration / 30)} months)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Impact Analysis */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Guest Impact
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 mb-2">✓ Allows</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Bookings of {rule.minimumNights}+ nights</li>
                    {isWeekly ? (
                      <li>• Weekly bookings with fixed check-in days</li>
                    ) : (
                      <li>• Flexible booking dates</li>
                    )}
                    <li>• Better revenue optimization</li>
                  </ul>
                </div>
                
                <div className="p-3 border rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 mb-2">✗ Restricts</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Bookings shorter than {rule.minimumNights} night{rule.minimumNights > 1 ? 's' : ''}</li>
                    {isWeekly && (
                      <li>• Mid-week check-ins/check-outs</li>
                    )}
                    <li>• Last-minute short stays</li>
                  </ul>
                </div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Business Benefits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• Reduces cleaning frequency</div>
                  <div>• Improves guest experience</div>
                  <div>• Higher average booking value</div>
                  <div>• Better calendar optimization</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <History className="w-4 h-4 mr-2" />
              Rule Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(rule.createdAt), "MMM dd, yyyy 'at' HH:mm")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(rule.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rule ID</p>
                <p className="font-mono text-xs">{rule.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rule Status</p>
                <p className="font-medium text-green-600">Active</p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}