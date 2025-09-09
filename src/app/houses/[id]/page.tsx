import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { PropertyDetailsWrapper } from "./property-detail-view"

interface PropertyDetailsPageProps {
  params: Promise<{ id: string }>
}

async function checkPropertyExists(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    select: { id: true }, // Only select ID to check existence
  })

  return property
}

export default async function PropertyDetailsPage({ params }: PropertyDetailsPageProps) {
  const { id } = await params
  const property = await checkPropertyExists(id)

  if (!property) {
    notFound()
  }

  // Pass only the property ID to the client component
  // The client component will fetch the full data using React Query
  // This ensures the UI updates when data changes
  return <PropertyDetailsWrapper propertyId={id} />
}