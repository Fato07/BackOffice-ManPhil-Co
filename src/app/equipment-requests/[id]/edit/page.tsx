import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getEquipmentRequestById } from "@/actions/equipment-requests"
import { hasPermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EquipmentRequestForm } from "@/components/equipment-requests/equipment-request-form"

export default async function EditEquipmentRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  const user = await auth()
  if (!hasPermission(user, Permission.EQUIPMENT_REQUEST_EDIT)) {
    notFound()
  }

  try {
    const request = await getEquipmentRequestById(id)
    
    // Only allow editing pending requests
    if (request.status !== "PENDING") {
      notFound()
    }
    
    return (
      <DashboardLayout>
        <EquipmentRequestForm request={request} />
      </DashboardLayout>
    )
  } catch (error) {
    notFound()
  }
}