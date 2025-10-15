"use client"

import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { motion } from "framer-motion"
import { CheckCircle2, AlertCircle, Database, Columns } from "lucide-react"
import { ImportValidationResult } from "@/hooks/use-import"
import { ValidationResults } from "@/components/import/validation-results"
import { LuxuryDataPreview } from "@/components/import/luxury-data-preview"
import { cn } from "@/lib/utils"

interface SimpleImportPreviewProps {
  validationResult: ImportValidationResult
}

export function SimpleImportPreview({ validationResult }: SimpleImportPreviewProps) {
  const { totalRows, headers, enhancedValidation, parsedData } = validationResult

  // Show enhanced validation with luxury styling
  if (enhancedValidation && parsedData) {
    const isReady = enhancedValidation.summary.readyToImport
    
    return (
      <div className="space-y-6">
        {/* Status Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard variant="luxury" className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  isReady ? "bg-emerald-100" : "bg-amber-100"
                )}>
                  {isReady ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isReady 
                      ? `${totalRows} Properties Ready to Import`
                      : `Import Validation Complete`
                    }
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {isReady 
                      ? "All validation checks passed successfully"
                      : `${enhancedValidation.fixable.criticalIssues} issues need attention`
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Database className="w-4 h-4" />
                    <span>{totalRows} rows</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Columns className="w-4 h-4" />
                    <span>{headers.length} columns</span>
                  </div>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium",
                  isReady 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                    : "bg-amber-100 text-amber-800 border border-amber-200"
                )}>
                  {isReady ? "READY" : "REVIEW"}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Column Headers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard variant="ultra-light" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Columns className="w-5 h-5 text-gray-600" />
              <h3 className="font-medium text-gray-900">
                Column Structure ({headers.length} columns)
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {headers.slice(0, 12).map((header, index) => (
                <motion.div
                  key={header}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                >
                  <Badge 
                    variant="outline" 
                    className="justify-center text-xs py-1.5 px-3 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 border-gray-200/50"
                  >
                    {header}
                  </Badge>
                </motion.div>
              ))}
              {headers.length > 12 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 12 * 0.02 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="justify-center text-xs py-1.5 px-3 bg-gray-100/70 text-gray-700 hover:bg-gray-200/70 transition-all duration-200"
                  >
                    +{headers.length - 12} more
                  </Badge>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* Data Preview */}
        {parsedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <LuxuryDataPreview data={parsedData} />
          </motion.div>
        )}

        {/* Validation Results */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <ValidationResults 
            validation={enhancedValidation}
          />
        </motion.div>
      </div>
    )
  }

  // All imports now use enhanced validation - no fallback needed
  return null
}