import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DestinationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}