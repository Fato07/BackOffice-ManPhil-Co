import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PropertyDetailHeader } from "@/components/property-detail/property-header"
import { prisma } from "@/lib/db"

interface PropertyLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

async function getProperty(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      destination: true,
    },
  })

  if (!property) {
    notFound()
  }

  return property
}

export default async function PropertyLayout({
  children,
  params,
}: PropertyLayoutProps) {
  const { id } = await params
  const property = await getProperty(id)

  return (
    <DashboardLayout>
      <PropertyDetailHeader property={property} />
      {children}
    </DashboardLayout>
  )
}