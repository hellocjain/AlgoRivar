import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Moon,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/stores/themeStore'
import { usePageTitle } from '@/hooks/usePageTitle'

const stats = [
  { label: 'Parallel Fan-Out Latency', value: '< 30ms', desc: 'Sub-30ms non-blocking threadpool router' },
  { label: 'Concurrent Child Accounts', value: '50+', desc: 'Parallel multi-account execution' },
  { label: 'Signal Deduplication', value: '3-Sec', desc: 'SHA-256 time-bucketed idempotency guard' },
  { label: 'Dynamic Risk Engine', value: '4 Grades', desc: 'Algomirror Grade A/B/C/D Margin Sizing' },
]

const features = [
  {
    icon: Users,
    title: 'Institutional Multi-Account Copy Trading',
    desc: 'Fan out TradingView, Chartink, and Python signals across 50+ child accounts concurrently with custom multipliers and capital allocations.',
    badge: 'Core Engine',
  },
  {
    icon: Sliders,
    title: 'Algomirror Dynamic Margin Risk Sizing',
    desc: 'Sizes child orders automatically based on live AC Agarwal RMS margin and Trade Quality grades (Grade A: 70%, Grade B: 50%, Grade C: 30%, Grade D: 20% cash).',
    badge: 'Quant Sizing',
  },
  {
    icon: TrendingUp,
    title: 'Supertrend Multi-Leg Trailing Stops',
    desc: 'Calculates Supertrend on combined multi-leg option premium spreads (Straddles/Strangles) with exact Pine Script and TradingView parity.',
    badge: 'Trailing Stop',
  },
  {
    icon: Shield,
    title: 'Exchange Freeze Quantity Slicing',
    desc: 'Automatically slices large orders exceeding MCX commodity caps (10,000 units on Crude/Gold) or NSE/BSE F&O limits into exchange-compliant child orders.',
    badge: 'Compliance',
  },
  {
    icon: Clock,
    title: '08:30 AM Pre-Flight Health Drill',
    desc: '1-Click pre-market readiness testing verifying active XTS tokens and margin balances across all client accounts with Telegram status reporting.',
    badge: 'Operations',
  },
  {
    icon: AlertTriangle,
    title: '1-Click Emergency Desk Square-Off',
    desc: 'Instant kill-switch allowing desk managers to flatten all open positions and cancel all pending orders across every client account simultaneously.',
    badge: 'Risk Control',
  },
]

const sampleStrategies = [
  {
    tag: 'NIFTY_TREND_PRO',
    name: 'Nifty Quantitative Trend Follower',
    segment: 'NSEFO',
    tf: '15m',
    symbol: 'NIFTY',
    pnl: '+18.4%',
    desc: 'Multi-indicator trend capture strategy with dynamic position reconciliation and supertrend trailing stop.',
  },
  {
    tag: 'BANKNIFTY_STRADDLE',
    name: 'BankNifty Intraday Premium Seller',
    segment: 'NSEFO',
    tf: '5m',
    symbol: 'BANKNIFTY',
    pnl: '+24.1%',
    desc: 'Delta-neutral option selling with Grade B 50% margin allocation and automated leg adjustment.',
  },
  {
    tag: 'CRUDE_MOMENTUM',
    name: 'MCX Crude Oil Momentum Breakout',
    segment: 'MCXFO',
    tf: '10s',
    symbol: 'CRUDEOIL',
    pnl: '+31.8%',
    desc: 'High-frequency breakout strategy with automatic continuous contract resolution and 10k freeze slicing.',
  },
]

export default function Home() {
  usePageTitle()
  const { mode, toggleMode } = useThemeStore()

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-blue-500/20">
      {/* SaaS Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 w-full border-b bg-background/90 backdrop-blur border-border/50">
        <nav className="container mx-auto px-4 sm:px-6 flex h-full items-center justify-between max-w-7xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-500 shadow-sm">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-slate-100 bg-clip-text text-transparent">
                AlgoRivar
              </span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider -mt-1 hidden sm:inline">
                Algo Trading Made Easy
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link to="/copytrading" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-400" />
              Master Desk
            </Link>
            <Link to="/portal" className="hover:text-foreground transition-colors flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-400" />
              Client Portal
            </Link>
            <Link to="/strategy" className="hover:text-foreground transition-colors">
              Strategies
            </Link>
            <Link to="/orderbook" className="hover:text-foreground transition-colors">
              Orderbook
            </Link>
            <Link to="/tools" className="hover:text-foreground transition-colors">
              Tools
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {mode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>
            <Link to="/portal">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs h-8">
                Client Login
              </Button>
            </Link>
            <Link to="/copytrading">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-sm">
                Launch Desk
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-border/40 bg-gradient-to-b from-blue-950/10 via-background to-background">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10 text-center space-y-8">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/30 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px] shadow-emerald-400/80" />
              <span>Turnkey Multi-Account Copy-Trading SaaS</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-slate-300">AC Agarwal (Symphony XTS) Edition</span>
            </div>

            {/* Main Headline */}
            <div className="max-w-4xl mx-auto space-y-4">
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                Algo Trading{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Made Easy
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
                Institutional algorithmic execution, multi-client copy trading, Algomirror dynamic margin sizing, and sub-30ms webhook replication for modern trading desks.
              </p>
            </div>

            {/* Dual Action CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link to="/copytrading" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12 shadow-lg shadow-blue-600/20 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Launch Master Desk Hub
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/portal" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8 h-12 border-border/80 flex items-center gap-2 hover:bg-accent">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                  Retail Client Self-Service Portal
                </Button>
              </Link>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Sub-30ms Parallel Fan-Out
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 3-Second SHA-256 Deduplication
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Automated 401 Session Recovery
              </span>
            </div>
          </div>
        </section>

        {/* Metrics Strip */}
        <section className="border-b border-border/40 bg-card/40 py-10">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((s, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur space-y-1">
                  <div className="text-3xl sm:text-4xl font-extrabold font-mono text-blue-400">{s.value}</div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <Badge variant="outline" className="text-blue-400 border-blue-500/40 bg-blue-950/20">
                Institutional Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Engineered for High-Frequency Reliability
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Consolidating the gold standard components from Marketcalls OpenAlgo &amp; Algomirror into a unified SaaS experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, idx) => {
                const Icon = f.icon
                return (
                  <Card key={idx} className="border-border/60 bg-card/60 hover:border-blue-500/40 transition-all shadow-sm flex flex-col justify-between">
                    <CardHeader className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {f.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs sm:text-sm leading-relaxed">
                        {f.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Strategy Marketplace Showcase */}
        <section className="py-20 border-b border-border/40 bg-gradient-to-b from-background via-blue-950/5 to-background">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-950/20 mb-2">
                  Live Strategies
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight">Verified Strategy Marketplace</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Replicate institutional quant signals directly to subscribed client accounts
                </p>
              </div>
              <Link to="/portal">
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  Browse All Strategies <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sampleStrategies.map((strat, idx) => (
                <Card key={idx} className="border-border/60 bg-card/80 shadow flex flex-col justify-between">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-mono text-blue-400 bg-blue-950/30 border-blue-500/40">
                        {strat.segment} • {strat.tf}
                      </Badge>
                      <span className="text-xs font-mono font-bold text-emerald-400">{strat.pnl} Est. ROI</span>
                    </div>
                    <CardTitle className="text-base mt-2">{strat.name}</CardTitle>
                    <CardDescription className="text-xs leading-relaxed">{strat.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 border-t border-border/40 mt-4 flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">{strat.tag}</span>
                    <Link to="/portal">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                        Subscribe
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Free & Open Source Tier Banner */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="rounded-2xl border border-blue-800/40 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-slate-900/40 p-8 sm:p-12 text-center space-y-6 shadow-xl backdrop-blur">
              <div className="inline-flex p-3 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Sparkles className="h-8 w-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                100% Free &amp; Open SaaS Trading Architecture
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Deploy AlgoRivar on your own VPS or local server with zero license fees, zero broker markups, and full ownership of your trading API secrets.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link to="/copytrading">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 h-12">
                    Open Master Desk Hub
                  </Button>
                </Link>
                <Link to="/portal">
                  <Button size="lg" variant="secondary" className="font-semibold px-8 h-12">
                    Open Retail Client Portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rebranded Footer */}
      <Footer />
    </div>
  )
}
