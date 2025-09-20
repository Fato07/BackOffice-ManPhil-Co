import { DashboardLayout } from "@/components/layout/dashboard-layout"

interface PropertyLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function PropertyLayout({
  children,
  params,
}: PropertyLayoutProps) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}