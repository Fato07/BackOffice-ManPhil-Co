"use client"

import { ValidationResult } from "@/lib/csv/enhanced-validator"
import { GlassCard } from "@/components/ui/glass-card"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  XCircle,
  Shield,
  FileCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationResultsProps {
  validation: ValidationResult
  className?: string
}

export function ValidationResults({ validation, className }: ValidationResultsProps) {
  const isReady = validation.summary.readyToImport
  const hasWarnings = validation.data.typeValidation.length > 0
  const hasErrors = validation.summary.errorCount > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard 
          variant={isReady ? "luxury" : "default"} 
          className={cn(
            "p-4 border-2 transition-all duration-300",
            isReady 
              ? "border-emerald-200 bg-emerald-50/30" 
              : "border-red-200 bg-red-50/30"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isReady ? "bg-emerald-100" : "bg-red-100"
            )}>
              {isReady ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={cn(
                "font-semibold text-sm",
                isReady ? "text-emerald-900" : "text-red-900"
              )}>
                {isReady 
                  ? `Ready to Import ${validation.data.validRows} Properties`
                  : `${validation.summary.errorCount} Critical Issues Found`
                }
              </h3>
              <p className={cn(
                "text-xs mt-1",
                isReady ? "text-emerald-700" : "text-red-700"
              )}>
                {isReady 
                  ? "All validation checks passed successfully"
                  : "Please resolve issues before importing"
                }
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              isReady 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-red-100 text-red-800"
            )}>
              {isReady ? "READY" : "BLOCKED"}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Issues Cards */}
      {validation.structure.headerIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard variant="light" className="p-4 border-red-200 bg-red-50/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-900 text-sm">Missing Required Headers</h4>
                <p className="text-red-700 text-xs mt-1">
                  {validation.structure.headerIssues.map(issue => issue.column).join(', ')}
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {validation.structure.misalignedRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <GlassCard variant="light" className="p-4 border-red-200 bg-red-50/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h4 className="font-medium text-red-900 text-sm">Column Misalignment</h4>
                <p className="text-red-700 text-xs mt-1">
                  Detected in {validation.structure.misalignedRows.length} rows
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Warnings Card */}
      {hasWarnings && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <GlassCard variant="light" className="p-4 border-amber-200 bg-amber-50/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900 text-sm">Data Quality Warnings</h4>
                <p className="text-amber-700 text-xs mt-1">
                  Found {validation.data.typeValidation.length} data issues that may indicate misalignment
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">
                {validation.data.typeValidation.length} WARNINGS
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Quality Score */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <GlassCard variant="ultra-light" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">Data Quality Score</h4>
                  <p className="text-gray-600 text-xs mt-1">
                    {Math.round((validation.summary.confidence || 0) * 100)}% confidence
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round((validation.summary.confidence || 0) * 100)}%
                </div>
                <div className="text-xs text-gray-500">
                  {validation.summary.confidence >= 0.9 ? "Excellent" : 
                   validation.summary.confidence >= 0.7 ? "Good" : "Fair"}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}