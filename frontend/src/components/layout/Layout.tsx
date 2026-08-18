import { Navigate, Outlet, useLocation } from 'react-router'
import { SocketProvider } from '@/components/socket/SocketProvider'
import { useAuthStore } from '@/stores/authStore'
import { Footer } from './Footer'
import { MobileBottomNav } from './MobileBottomNav'
import { Navbar } from './Navbar'

export function Layout() {
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  // AuthSync has already synced Flask session with Zustand store
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Configuration and SaaS management pages that are allowed without active broker connection
  const allowedWithoutBroker = [
    '/profile',
    '/copytrading',
    '/portal',
    '/retail',
    '/broker',
    '/apikey',
    '/setup',
  ]
  const isAllowedPath = allowedWithoutBroker.some((path) =>
    location.pathname.startsWith(path)
  )

  // If logged in but no broker selected, redirect to broker selection unless on allowed config page
  if (!user?.broker && !isAllowedPath) {
    return <Navigate to="/broker" replace />
  }

  return (
    <SocketProvider>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="container mx-auto px-4 py-6 pb-24 md:pb-6 flex-1">
          <Outlet />
        </main>
        <Footer className="hidden md:block" />
        <MobileBottomNav />
      </div>
    </SocketProvider>
  )
}

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  )
}
