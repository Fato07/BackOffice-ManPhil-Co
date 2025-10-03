"use client"

import * as React from "react"
import { 
  DollarSign,
  User,
  MessageCircle,
  Receipt,
  Home,
  Bed,
  Package,
  Briefcase,
  Clock,
  FileText,
  X
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
import type { OperationalCost, OperationalCostType, PriceType } from "@/generated/prisma"
import { cn } from "@/lib/utils"

interface OperationalCostDetailsModalProps {
  cost: OperationalCost | null
  open: boolean
  onClose: () => void
  onEdit?: (id: string) => void
}

const OPERATIONAL_COST_TYPES: { 
  value: OperationalCostType; 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  color: string;
}[] = [
  { 
    value: "HOUSEKEEPING", 
    label: "Housekeeping",
    description: "Regular cleaning and maintenance",
    icon: <Home className="w-4 h-4" />,
    color: "bg-blue-100 text-blue-600 border-blue-200"
  },
  { 
    value: "HOUSEKEEPING_AT_CHECKOUT", 
    label: "Housekeeping at checkout",
    description: "Final cleaning after guest departure",
    icon: <Package className="w-4 h-4" />,
    color: "bg-purple-100 text-purple-600 border-purple-200"
  },
  { 
    value: "LINEN_CHANGE", 
    label: "Linen change",
    description: "Bed linens and towel replacement",
    icon: <Bed className="w-4 h-4" />,
    color: "bg-green-100 text-green-600 border-green-200"
  },
  { 
    value: "OPERATIONAL_PACKAGE", 
    label: "Operational package",
    description: "Complete operational services bundle",
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-orange-100 text-orange-600 border-orange-200"
  },
]

const PRICE_TYPES: { 
  value: PriceType; 
  label: string;
  description: string;
}[] = [
  { value: "PER_STAY", label: "Per stay", description: "Charged once per booking" },
  { value: "PER_WEEK", label: "Per week", description: "Charged weekly" },
  { value: "PER_DAY", label: "Per day", description: "Charged daily" },
  { value: "FIXED", label: "Fixed", description: "Fixed amount" },
]

export function OperationalCostDetailsModal({
  cost,
  open,
  onClose,
  onEdit,
}: OperationalCostDetailsModalProps) {
  if (!cost) return null

  const costType = OPERATIONAL_COST_TYPES.find(t => t.value === cost.costType)
  const priceType = PRICE_TYPES.find(t => t.value === cost.priceType)

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Operational Cost Details</DialogTitle>
          <DialogDescription>
            View detailed information about this operational cost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className={cn("p-3 rounded-lg", costType?.color || "bg-gray-100")}>
                {costType?.icon || <Receipt className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-medium text-lg">{costType?.label || cost.costType}</h3>
                <p className="text-sm text-muted-foreground">{costType?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Billing Type</p>
                  <div>
                    <Badge variant="secondary" className="mb-2">
                      {priceType?.label || cost.priceType}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {priceType?.description}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">Paid By</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        cost.paidBy === "ManPhil & Co" && "bg-blue-100 text-blue-800 border-blue-200",
                        cost.paidBy === "Guest" && "bg-green-100 text-green-800 border-green-200",
                        cost.paidBy === "Owner" && "bg-purple-100 text-purple-800 border-purple-200"
                      )}
                    >
                      {cost.paidBy || "Not specified"}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Pricing Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-gradient-to-br from-white to-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Price</p>
                    <p className="text-2xl font-light">
                      {cost.estimatedPrice ? `€${cost.estimatedPrice.toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-white to-emerald-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Public Price</p>
                    <p className="text-2xl font-light text-emerald-600">
                      {cost.publicPrice ? `€${cost.publicPrice.toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {cost.comment && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Notes
                </h4>
                <Card className="p-4 bg-gray-50">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{cost.comment}</p>
                </Card>
              </div>
            </>
          )}

          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Additional Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(cost.createdAt).toLocaleDateString()} at{" "}
                  {new Date(cost.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(cost.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(cost.updatedAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}