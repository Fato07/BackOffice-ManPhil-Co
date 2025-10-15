"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download, FileSpreadsheet, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { exportPriceRangesSchema, type ExportPriceRangesData } from "@/lib/validations/pricing"
import { useExportPriceRanges } from "@/hooks/use-pricing-import"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface ExportPricingDialogProps {
  children?: React.ReactNode
  selectedPropertyIds?: string[]
}

export function ExportPricingDialog({ children, selectedPropertyIds = [] }: ExportPricingDialogProps) {
  const [open, setOpen] = useState(false)
  const exportPriceRangesMutation = useExportPriceRanges()

  const form = useForm({
    resolver: zodResolver(exportPriceRangesSchema),
    defaultValues: {
      propertyIds: selectedPropertyIds,
      startDate: undefined,
      endDate: undefined,
      format: 'csv' as const,
    },
  })

  const onSubmit = async (data: ExportPriceRangesData) => {
    try {
      await exportPriceRangesMutation.mutateAsync(data)
      setOpen(false)
      form.reset()
    } catch (error) {
      // Error handling is done by the hook
      console.error("Export failed:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Pricing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Price Ranges</DialogTitle>
          <DialogDescription>
            Export price ranges to CSV format. You can filter by date range.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {selectedPropertyIds.length > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Exporting pricing data for <span className="font-medium">{selectedPropertyIds.length}</span> selected properties
                  </p>
                </div>
              )}

              <FormField
                control={form.control}
                name="propertyIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property IDs (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter property IDs separated by commas" 
                        value={field.value?.join(', ') || ''}
                        onChange={(e) => {
                          const ids = e.target.value
                            .split(',')
                            .map(id => id.trim())
                            .filter(id => id.length > 0)
                          field.onChange(ids.length > 0 ? ids : undefined)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to export all properties
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value as Date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value as Date | undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Filter by date range start
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value as Date, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value as Date | undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Filter by date range end
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                disabled={exportPriceRangesMutation.isPending}
              >
                {exportPriceRangesMutation.isPending ? (
                  <>
                    <span className="mr-2">Exporting...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export CSV
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}