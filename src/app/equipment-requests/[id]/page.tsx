import { notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { getEquipmentRequestById } from "@/actions/equipment-requests"
import { hasPermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EquipmentRequestDetail } from "@/components/equipment-requests/equipment-request-detail"

export default async function EquipmentRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) {
    notFound()
  }

  if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_VIEW))) {
    notFound()
  }

  try {
    const request = await getEquipmentRequestById(id)
    
    return (
      <DashboardLayout>
        <EquipmentRequestDetail request={request} />
      </DashboardLayout>
    )
  } catch (error) {
    notFound()
  }
}