import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { FinanceContent } from "@/components/finance/finance-content"
import { FinanceLoading } from "./loading"

export default function FinancePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<FinanceLoading />}>
        <FinanceContent />
      </Suspense>
    </DashboardLayout>
  )
}