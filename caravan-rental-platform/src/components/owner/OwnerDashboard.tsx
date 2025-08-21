import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

// Import owner dashboard components
import { DashboardOverview } from './DashboardOverview'
import { PropertiesPage } from './PropertiesPage'
import { OwnerBookingsPage } from './OwnerBookingsPage'
import { MessagesPage } from './MessagesPage'
import { AnalyticsPage } from './AnalyticsPage'

export type OwnerDashboardSection = 'overview' | 'properties' | 'bookings' | 'messages' | 'analytics'

interface OwnerDashboardProps {
  activeSection: OwnerDashboardSection
}

export function OwnerDashboard({ activeSection }: OwnerDashboardProps) {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-gray">Please sign in to access your owner dashboard.</p>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <DashboardOverview />
      case 'properties':
        return <PropertiesPage />
      case 'bookings':
        return <OwnerBookingsPage />
      case 'messages':
        return <MessagesPage />
      case 'analytics':
        return <AnalyticsPage />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="py-8">
      {renderContent()}
    </div>
  )
}