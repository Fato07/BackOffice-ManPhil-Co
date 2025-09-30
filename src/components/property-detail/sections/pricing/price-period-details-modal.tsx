"use client"

import * as React from "react"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Check, 
  DollarSign,
  Percent,
  Clock,
  FileText,
  X,
  Edit2
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
import type { PriceRange } from "@/generated/prisma"
import { calculatePublicPrice, calculateCommissionAmount } from "@/lib/validations/pricing"

interface PricePeriodDetailsModalProps {
  priceRange: PriceRange | null
  open: boolean
  onClose: () => void
  onEdit?: (id: string) => void
}

export function PricePeriodDetailsModal({
  priceRange,
  open,
  onClose,
  onEdit,
}: PricePeriodDetailsModalProps) {
  if (!priceRange) return null

  const ownerNightly = priceRange.ownerNightlyRate || priceRange.nightlyRate || 0
  const ownerWeekly = priceRange.ownerWeeklyRate || priceRange.weeklyRate || 0
  const publicNightly = priceRange.publicNightlyRate || calculatePublicPrice(ownerNightly, priceRange.commissionRate)
  const publicWeekly = priceRange.publicWeeklyRate || (ownerWeekly ? calculatePublicPrice(ownerWeekly, priceRange.commissionRate) : 0)
  
  const commissionNightly = calculateCommissionAmount(ownerNightly, priceRange.commissionRate)
  const commissionWeekly = ownerWeekly ? calculateCommissionAmount(ownerWeekly, priceRange.commissionRate) : 0

  const startDate = new Date(priceRange.startDate)
  const endDate = new Date(priceRange.endDate)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Determine season
  const month = startDate.getMonth()
  let season: string
  let seasonColor: string
  
  if (month >= 2 && month <= 4) {
    season = "Spring"
    seasonColor = "bg-green-100 text-green-800 border-green-200"
  } else if (month >= 5 && month <= 7) {
    season = "Summer"
    seasonColor = "bg-yellow-100 text-yellow-800 border-yellow-200"
  } else if (month >= 8 && month <= 10) {
    season = "Autumn"
    seasonColor = "bg-orange-100 text-orange-800 border-orange-200"
  } else {
    season = "Winter"
    seasonColor = "bg-blue-100 text-blue-800 border-blue-200"
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {priceRange.name}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Detailed view of pricing period configuration
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onEdit(priceRange.id)
                    onClose()
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className={seasonColor}>
                {season}
              </Badge>
              {priceRange.isValidated ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Validated
                </Badge>
              ) : (
                <Badge variant="outline">
                  Pending Validation
                </Badge>
              )}
            </div>
          </div>

          {/* Period Information */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Period Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">{format(startDate, "EEEE, MMMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">{format(endDate, "EEEE, MMMM dd, yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {diffDays} days
                  {diffDays > 30 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      (~{Math.round(diffDays / 30)} months)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Season</p>
                <p className="font-medium">{season}</p>
              </div>
            </div>
          </Card>

          {/* Pricing Breakdown */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing Breakdown
            </h3>
            
            <div className="space-y-4">
              {/* Nightly Rates */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Nightly Rates</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Owner Rate</p>
                    <p className="text-lg font-semibold">€{ownerNightly.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="text-lg font-semibold text-blue-600">€{commissionNightly.toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Public Rate</p>
                    <p className="text-lg font-semibold text-emerald-600">€{publicNightly.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Weekly Rates */}
              {ownerWeekly > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Weekly Rates</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Owner Rate</p>
                      <p className="text-lg font-semibold">€{ownerWeekly.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <p className="text-lg font-semibold text-blue-600">€{commissionWeekly.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Public Rate</p>
                      <p className="text-lg font-semibold text-emerald-600">€{publicWeekly.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission Details */}
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Percent className="w-4 h-4 mr-2 text-amber-600" />
                    <span className="text-sm font-medium">Commission Rate</span>
                  </div>
                  <span className="text-lg font-semibold text-amber-600">{priceRange.commissionRate}%</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Revenue Projections */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Revenue Projections
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Monthly (30 nights)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Owner Revenue:</span>
                    <span className="font-medium">€{(ownerNightly * 30).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Commission:</span>
                    <span className="font-medium text-blue-600">€{(commissionNightly * 30).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Revenue:</span>
                    <span className="font-semibold text-emerald-600">€{(publicNightly * 30).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Full Period ({diffDays} days)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Owner Revenue:</span>
                    <span className="font-medium">€{(ownerNightly * diffDays).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Commission:</span>
                    <span className="font-medium text-blue-600">€{(commissionNightly * diffDays).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Revenue:</span>
                    <span className="font-semibold text-emerald-600">€{(publicNightly * diffDays).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="p-4">
            <h3 className="font-medium mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Metadata
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(priceRange.createdAt), "MMM dd, yyyy 'at' HH:mm")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{format(new Date(priceRange.updatedAt), "MMM dd, yyyy 'at' HH:mm")}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Period ID</p>
                <p className="font-mono text-xs">{priceRange.id}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Validation Status</p>
                <p className="font-medium">
                  {priceRange.isValidated ? (
                    <span className="text-green-600">Validated by owner</span>
                  ) : (
                    <span className="text-yellow-600">Pending validation</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}