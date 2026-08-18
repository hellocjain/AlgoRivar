import {
  BookOpen,
  ClipboardList,
  Key,
  LayoutDashboard,
  type LucideIcon,
  MessageSquare,
  Settings,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Served by Flask (not a React route): render as a full-page link. */
  external?: boolean
}

// Main navigation items shown in desktop navbar (Ultra-clean, essential only)
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/copytrading', label: 'Master Desk', icon: Users },
  { href: '/portal', label: 'Client Portal', icon: User },
  { href: '/positions', label: 'Positions & PnL', icon: TrendingUp },
  { href: '/orderbook', label: 'Orders', icon: ClipboardList },
  { href: '/profile', label: 'Settings', icon: Settings },
]

// Items shown in mobile bottom navigation
export const bottomNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/copytrading', label: 'Master Desk', icon: Users },
  { href: '/portal', label: 'Client Portal', icon: User },
  { href: '/positions', label: 'Positions', icon: TrendingUp },
  { href: '/orderbook', label: 'Orders', icon: ClipboardList },
]

// Paths in bottom nav (for filtering mobile sheet items)
const bottomNavPaths = bottomNavItems.map((item) => item.href)

// Secondary items for mobile sheet
export const mobileSheetItems = navItems.filter((item) => !bottomNavPaths.includes(item.href))

// Profile dropdown menu items (clean & essential)
export const profileMenuItems: NavItem[] = [
  { href: '/profile', label: 'Broker & Profile Settings', icon: User },
  { href: '/copytrading', label: 'Master Desk Hub', icon: Users },
  { href: '/portal', label: 'Retail Client Portal', icon: User },
  { href: '/apikey', label: 'API Keys & Webhooks', icon: Key },
  { href: '/telegram', label: 'Telegram Alerts', icon: MessageSquare },
  { href: '/positions', label: 'Live Positions', icon: TrendingUp },
  { href: '/orderbook', label: 'Order History', icon: ClipboardList },
]

// External links
export const externalLinks = {
  docs: { href: 'https://docs.openalgo.in', label: 'Docs', icon: BookOpen },
}

// Shared utility to check if a route is active
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/strategy') {
    return pathname === '/strategy' || pathname.startsWith('/strategy/')
  }
  return pathname === href
}
