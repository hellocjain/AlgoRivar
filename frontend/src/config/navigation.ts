import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  Code2,
  Database,
  FileStack,
  FileText,
  FlaskConical,
  Gauge,
  Key,
  LayoutDashboard,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Search,
  Settings,
  TrendingUp,
  User,
  Users,
  Workflow,
  Wrench,
  Zap,
} from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  /** Served by Flask (not a React route): render as a full-page link. */
  external?: boolean
}

// Main navigation items shown in desktop navbar (Streamlined for zero-clutter)
export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/copytrading', label: 'Master Desk', icon: Users },
  { href: '/portal', label: 'Client Portal', icon: User },
  { href: '/orderbook', label: 'Orderbook', icon: ClipboardList },
  { href: '/positions', label: 'Positions', icon: TrendingUp },
  { href: '/tradebook', label: 'Tradebook', icon: FileText },
  { href: '/strategy', label: 'Strategies', icon: Code2 },
  { href: '/tools', label: 'Tools', icon: Wrench },
]

// Items shown in mobile bottom navigation
export const bottomNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/copytrading', label: 'Desk', icon: Users },
  { href: '/portal', label: 'Portal', icon: User },
  { href: '/positions', label: 'Positions', icon: TrendingUp },
  { href: '/orderbook', label: 'Orders', icon: ClipboardList },
]

// Paths in bottom nav (for filtering mobile sheet items)
const bottomNavPaths = bottomNavItems.map((item) => item.href)

// Secondary items for mobile sheet (items not in bottom nav)
export const mobileSheetItems = navItems.filter((item) => !bottomNavPaths.includes(item.href))

// Profile dropdown menu items
export const profileMenuItems: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/apikey', label: 'API Key', icon: Key },
  { href: '/action-center', label: 'Action Center', icon: Bell },
  { href: '/master-contract', label: 'Master Contract', icon: FileStack },
  { href: '/telegram', label: 'Telegram Bot', icon: MessageSquare },
  { href: '/whatsapp', label: 'WhatsApp Bot', icon: MessageCircle },
  { href: '/holdings', label: 'Holdings', icon: ClipboardList },
  { href: '/flow', label: 'Flow Editor', icon: Workflow },
  { href: '/scalping', label: 'Scalping', icon: Zap },
  { href: '/python', label: 'Python Strategies', icon: Code2 },
  { href: '/pnl-tracker', label: 'PnL Tracker', icon: BarChart3 },
  { href: '/historify', label: 'Historify', icon: Database },
  { href: '/search/token', label: 'Search', icon: Search },
  { href: '/sandbox', label: 'Sandbox', icon: FlaskConical },
  { href: '/leverage', label: 'Leverage', icon: Gauge },
  { href: '/admin', label: 'Admin', icon: Settings },
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
