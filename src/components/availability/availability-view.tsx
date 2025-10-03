"use client"

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarIcon, ListIcon, ChartBarIcon } from "lucide-react"
import { AvailabilityCalendar } from "./availability-calendar"
import { BookingList } from "./booking-list"
import { AvailabilityRequestsTable } from "./availability-requests-table"
import { CalendarLegend } from "./calendar-legend"

interface AvailabilityViewProps {
  propertyId: string
  propertyName: string
}

export function AvailabilityView({ propertyId, propertyName }: AvailabilityViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month')

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Availability Calendar</h1>
            <p className="text-sm text-gray-500 mt-1">{propertyName}</p>
          </div>
          <CalendarLegend />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="calendar" className="h-full">
          <div className="bg-white border-b px-8">
            <TabsList className="h-12">
              <TabsTrigger value="calendar" className="data-[state=active]:bg-gray-100">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="requests" className="data-[state=active]:bg-gray-100">
                <ListIcon className="h-4 w-4 mr-2" />
                Availability Requests
              </TabsTrigger>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-gray-100">
                <ListIcon className="h-4 w-4 mr-2" />
                Booking History
              </TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-gray-100">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="calendar" className="h-full p-0 m-0">
            <AvailabilityCalendar 
              propertyId={propertyId} 
              onDateSelect={setSelectedDate}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              view={calendarView}
            />
          </TabsContent>

          <TabsContent value="requests" className="h-full overflow-auto">
            <div className="p-8">
              <AvailabilityRequestsTable propertyId={propertyId} />
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="h-full overflow-auto">
            <div className="p-8">
              <BookingList propertyId={propertyId} />
            </div>
          </TabsContent>

          <TabsContent value="stats" className="h-full overflow-auto">
            <div className="p-8">
              <div className="text-center text-gray-500 py-12">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Statistics coming soon</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}