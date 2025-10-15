"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Building, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface LuxuryDataPreviewProps {
  data: Record<string, string>[]
  className?: string
}

export function LuxuryDataPreview({ data, className }: LuxuryDataPreviewProps) {
  if (data.length === 0) return null

  const previewData = data.slice(0, 3)

  const getPropertyIcon = (row: Record<string, string>) => {
    if (row.requestStartDate) return <Calendar className="w-4 h-4 text-amber-600" />
    if (row.bookingStartDate) return <Users className="w-4 h-4 text-blue-600" />
    if (row.priceStartDate) return <Star className="w-4 h-4 text-emerald-600" />
    return <Building className="w-4 h-4 text-gray-600" />
  }

  const getDataTypeLabel = (row: Record<string, string>) => {
    if (row.requestStartDate) return { label: "Availability Request", color: "bg-amber-100 text-amber-800 border-amber-200" }
    if (row.bookingStartDate) return { label: "Booking", color: "bg-blue-100 text-blue-800 border-blue-200" }
    if (row.priceStartDate) return { label: "Pricing Period", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
    return { label: "Property Data", color: "bg-gray-100 text-gray-800 border-gray-200" }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <GlassCard variant="luxury" className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Data Preview ({previewData.length} of {data.length} rows)
          </h3>
        </div>

        <div className="space-y-3">
          {previewData.map((row, index) => {
            const dataType = getDataTypeLabel(row)
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard variant="ultra-light" className="p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getPropertyIcon(row)}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {row.propertyName || `Row ${index + 1}`}
                          </h4>
                          <Badge variant="outline" className={cn("text-xs px-2 py-0.5", dataType.color)}>
                            {dataType.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          {row.destinationName && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{row.destinationName}</span>
                            </div>
                          )}
                          
                          {(row.priceStartDate || row.bookingStartDate || row.requestStartDate) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {formatDate(row.priceStartDate || row.bookingStartDate || row.requestStartDate)}
                              </span>
                            </div>
                          )}
                          
                          {row.numberOfRooms && (
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              <span>{row.numberOfRooms} rooms</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {data.length > 3 && (
          <div className="pt-2 text-center">
            <p className="text-xs text-gray-500">
              + {data.length - 3} more rows will be imported
            </p>
          </div>
        )}
      </div>
    </GlassCard>
  )
}