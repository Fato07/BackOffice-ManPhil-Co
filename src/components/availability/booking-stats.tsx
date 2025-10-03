"use client"

import React, { useState } from 'react'
import { useBookingStats } from '@/hooks/use-bookings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, TrendingUp, Users, DollarSign } from 'lucide-react'
import { format, subMonths, addMonths, startOfMonth, endOfMonth } from 'date-fns'

interface BookingStatsProps {
  propertyId: string
}

export function BookingStats({ propertyId }: BookingStatsProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const startDate = startOfMonth(currentDate)
  const endDate = endOfMonth(currentDate)
  
  const { data: stats, isLoading, error } = useBookingStats(propertyId, startDate, endDate)

  const handlePreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1))
  }

  const handleCurrentMonth = () => {
    setCurrentDate(new Date())
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">
          <p>Error loading booking statistics</p>
          <p className="text-sm text-gray-500 mt-1">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Booking Statistics</h3>
          <p className="text-sm text-gray-600">
            Analytics for {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCurrentMonth}
          >
            Current
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bookings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalBookings || 0}
            </div>
            <p className="text-xs text-gray-500">
              bookings this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Occupancy Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.occupancyRate || 0}%
            </div>
            <p className="text-xs text-gray-500">
              of available nights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Nights
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalNights || 0}
            </div>
            <p className="text-xs text-gray-500">
              booked nights
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              €{stats?.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-gray-500">
              gross revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.bookingsByType && Object.keys(stats.bookingsByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Bookings by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.bookingsByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {type.replace('_', ' ').toLowerCase()}
                  </span>
                  <span className="text-sm text-gray-900 font-semibold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Average Stay Length</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.averageStayLength || 0}
              </div>
              <p className="text-sm text-gray-500">nights per booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Period Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium">
                  {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Days:</span>
                <span className="font-medium">
                  {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booked Days:</span>
                <span className="font-medium">{stats.totalNights}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}