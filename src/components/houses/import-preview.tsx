"use client"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react"
import { ImportValidationResult } from "@/hooks/use-import"

interface ImportPreviewProps {
  validationResult: ImportValidationResult
}

export function ImportPreview({ validationResult }: ImportPreviewProps) {
  const { preview, validation } = validationResult

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>{validationResult.totalRows} rows</span>
        </div>
        {validation.errorCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span>{validation.errorCount} errors</span>
          </div>
        )}
        {validation.warningCount > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span>{validation.warningCount} warnings</span>
          </div>
        )}
      </div>

      {/* Errors and Warnings */}
      {(validation.errorCount > 0 || validation.warningCount > 0) && (
        <ScrollArea className="h-32 rounded-md border">
          <div className="p-4 space-y-2">
            {validation.errors.slice(0, 10).map((error, index) => (
              <Alert key={`error-${index}`} variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Row {error.row}: {error.field} - {error.message}
                  {error.value && ` (value: "${error.value}")`}
                </AlertDescription>
              </Alert>
            ))}
            {validation.warnings.slice(0, 10).map((warning, index) => (
              <Alert key={`warning-${index}`} className="py-2 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-xs">
                  Row {warning.row}: {warning.field} - {warning.message}
                  {warning.value && ` (value: "${warning.value}")`}
                </AlertDescription>
              </Alert>
            ))}
            {(validation.errorCount > 10 || validation.warningCount > 10) && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Showing first 10 issues. {validation.errorCount + validation.warningCount - 10} more issues found.
              </p>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Preview Table */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Preview (first {preview.length} rows)</h4>
        <ScrollArea className="h-64 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Row</TableHead>
                <TableHead className="w-20">Status</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.map((row) => (
                <TableRow key={row.row}>
                  <TableCell className="font-mono text-xs">{row.row}</TableCell>
                  <TableCell>
                    {row.valid ? (
                      <Badge variant="outline" className="text-green-600">
                        Valid
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Error</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.data.name || "-"}</TableCell>
                  <TableCell>{row.data.destinationId || "-"}</TableCell>
                  <TableCell>{row.data.rooms || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {row.data.status || "HIDDEN"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  )
}