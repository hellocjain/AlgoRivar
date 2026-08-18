import {
  Activity,
  AlertTriangle,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Key,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePageTitle } from '@/hooks/usePageTitle'

interface Strategy {
  id: number
  strategy_tag: string
  strategy_name: string
  segment: string
  timeframe: string
  default_symbol: string
  description: string
  is_active: boolean
}

interface PersonalAccount {
  id?: number
  account_name: string
  client_code: string
  is_active: boolean
  connection_status: string
  multiplier: number
  max_daily_loss: number
  last_funds: number
  last_pnl: number
}

interface ActiveSubscription {
  mapping_id: number
  strategy_id: number
  strategy_tag: string
  strategy_name: string
  segment: string
  timeframe: string
  multiplier: number
  fixed_qty: number
  max_daily_loss: number
  is_active: boolean
  subscribed_at?: string
}

export default function RetailPortal() {
  usePageTitle()

  const [account, setAccount] = useState<PersonalAccount | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [subscriptions, setSubscriptions] = useState<ActiveSubscription[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [funds, setFunds] = useState<any>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [squareoffLoading, setSquareoffLoading] = useState<boolean>(false)

  // 3-Field API Key Modal State
  const [apiModalOpen, setApiModalOpen] = useState<boolean>(false)
  const [accountName, setAccountName] = useState<string>('')
  const [clientCode, setClientCode] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiSecret, setApiSecret] = useState<string>('')
  const [multiplier, setMultiplier] = useState<number>(1.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(2000)
  const [savingApi, setSavingApi] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string>('')

  // Subscription Modal State
  const [subscribingStrategy, setSubscribingStrategy] = useState<Strategy | null>(null)
  const [subMultiplier, setSubMultiplier] = useState<number>(1.0)
  const [subMaxLoss, setSubMaxLoss] = useState<number>(2000)
  const [savingSub, setSavingSub] = useState<boolean>(false)

  // 1-Click TradingView Modal
  const [webhookModalOpen, setWebhookModalOpen] = useState<boolean>(false)
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false)
  const [selectedStrategyForWebhook, setSelectedStrategyForWebhook] = useState<string>('CRUDE_MOMENTUM')

  // Load Initial Data
  const loadData = async () => {
    try {
      setRefreshing(true)
      // 1. Fetch available strategies
      const stratResp = await fetch('/api/retail/strategies')
      const stratData = await stratResp.json()
      if (stratData.status === 'success') {
        setStrategies(stratData.strategies || [])
      }

      // 2. Fetch local stored account if available
      const savedAcc = localStorage.getItem('algorivar_retail_account')
      if (savedAcc) {
        const parsedAcc: PersonalAccount = JSON.parse(savedAcc)
        setAccount(parsedAcc)

        if (parsedAcc.id) {
          // Fetch live positions, funds, and active subscriptions in parallel
          try {
            const [posRes, fundsRes, subRes] = await Promise.all([
              fetch(`/api/retail/positions/${parsedAcc.id}`),
              fetch(`/api/retail/funds/${parsedAcc.id}`),
              fetch(`/api/retail/subscriptions/${parsedAcc.id}`),
            ])
            const posJson = await posRes.json()
            if (posJson.status === 'success') setPositions(posJson.positions || [])
            const fundsJson = await fundsRes.json()
            if (fundsJson.status === 'success') setFunds(fundsJson.funds || null)
            const subJson = await subRes.json()
            if (subJson.status === 'success') setSubscriptions(subJson.subscriptions || [])
          } catch (e) {
            console.error('Error fetching personal telemetry:', e)
          }
        }
      }
    } catch (err) {
      console.error('Error loading retail portal data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveApi = async () => {
    if (!clientCode || !apiKey || !apiSecret) {
      setApiError('Client Code, API Key, and API Secret are required.')
      return
    }
    setSavingApi(true)
    setApiError('')
    try {
      const resp = await fetch('/api/retail/connect-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName || `Account ${clientCode.toUpperCase()}`,
          client_code: clientCode.trim().toUpperCase(),
          api_key: apiKey.trim(),
          api_secret: apiSecret.trim(),
          multiplier: multiplier,
          max_daily_loss: maxDailyLoss,
        }),
      })
      const result = await resp.json()
      if (result.status === 'success' || result.status === 'warning') {
        const accObj: PersonalAccount = {
          id: result.data?.id,
          account_name: accountName || `Account ${clientCode.toUpperCase()}`,
          client_code: clientCode.trim().toUpperCase(),
          is_active: true,
          connection_status: 'connected',
          multiplier: multiplier,
          max_daily_loss: maxDailyLoss,
          last_funds: 0,
          last_pnl: 0,
        }
        localStorage.setItem('algorivar_retail_account', JSON.stringify(accObj))
        setAccount(accObj)
        setApiKey('')
        setApiSecret('')
        setApiModalOpen(false)
        loadData()
      } else {
        setApiError(result.message || 'Failed to connect broker API')
      }
    } catch (e: any) {
      setApiError(e.message || 'Network error occurred')
    } finally {
      setSavingApi(false)
    }
  }

  const handleOpenSubscribeModal = (strat: Strategy) => {
    if (!account || !account.id) {
      setApiModalOpen(true)
      return
    }
    setSubscribingStrategy(strat)
    setSubMultiplier(account.multiplier || 1.0)
    setSubMaxLoss(account.max_daily_loss || 2000)
  }

  const handleConfirmSubscribe = async () => {
    if (!account || !account.id || !subscribingStrategy) return
    setSavingSub(true)
    try {
      const resp = await fetch('/api/retail/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          strategy_id: subscribingStrategy.id,
          multiplier: subMultiplier,
          max_daily_loss: subMaxLoss,
        }),
      })
      const data = await resp.json()
      if (data.status === 'success') {
        setSubscribingStrategy(null)
        loadData()
      } else {
        alert(data.message || 'Failed to subscribe')
      }
    } catch (e: any) {
      alert(e.message || 'Subscription error')
    } finally {
      setSavingSub(false)
    }
  }

  const handleUnsubscribe = async (mappingId: number) => {
    if (!confirm('Are you sure you want to stop auto-copying this strategy?')) return
    try {
      const resp = await fetch('/api/retail/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapping_id: mappingId }),
      })
      const data = await resp.json()
      if (data.status === 'success') {
        loadData()
      }
    } catch (e) {
      console.error('Failed to unsubscribe:', e)
    }
  }

  const handleEmergencySquareOff = async () => {
    if (!account || !account.id) return
    if (!confirm('🚨 EMERGENCY: Square off all your open positions and cancel pending orders?')) return
    setSquareoffLoading(true)
    try {
      const resp = await fetch(`/api/retail/squareoff/${account.id}`, { method: 'POST' })
      const data = await resp.json()
      alert(data.message || 'Square-off completed!')
      loadData()
    } catch (e) {
      alert('Square-off failed to complete')
    } finally {
      setSquareoffLoading(false)
    }
  }

  const webhookJsonPayload = JSON.stringify(
    {
      strategy: selectedStrategyForWebhook,
      symbol: '{{ticker}}',
      action: '{{strategy.order.action}}',
      quantity: 1,
      pricetype: 'MARKET',
      product: 'MIS',
      apikey: account ? account.client_code : 'YOUR_API_KEY',
    },
    null,
    2
  )

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-950/40 via-background to-indigo-950/40 border border-blue-800/40 rounded-xl p-5 shadow-lg backdrop-blur">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AlgoRivar Retail Client Hub</h1>
              <p className="text-sm text-muted-foreground">
                Automated AC Agarwal Algorithmic Trading Made Easy
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWebhookModalOpen(true)}
            className="flex items-center gap-1.5 text-xs h-8"
          >
            <Code2 className="h-4 w-4 text-blue-400" />
            TV Webhook Setup
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!account ? (
            <Button
              size="sm"
              onClick={() => setApiModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 text-xs h-8"
            >
              <Key className="h-3.5 w-3.5" />
              Connect Broker API
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setClientCode(account.client_code)
                setAccountName(account.account_name)
                setMultiplier(account.multiplier)
                setMaxDailyLoss(account.max_daily_loss)
                setApiModalOpen(true)
              }}
              className="flex items-center gap-1.5 text-xs h-8"
            >
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              {account.client_code} Settings
            </Button>
          )}
        </div>
      </div>

      {/* Account Overview Bar */}
      {account && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/70 border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Client Code</CardDescription>
              <CardTitle className="text-xl flex items-center justify-between">
                <span>{account.client_code}</span>
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 bg-emerald-950/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Live XTS API
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              {account.account_name}
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Available Margin</CardDescription>
              <CardTitle className="text-xl text-blue-400 font-mono">
                ₹{funds?.availablecash || (account.last_funds ? Number(account.last_funds).toFixed(2) : '0.00')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Collateral: ₹{funds?.collateral || '0.00'}
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Day's Net P&L</CardDescription>
              <CardTitle
                className={`text-xl font-mono flex items-center gap-1 ${
                  Number(funds?.m2mrealized || account.last_pnl || 0) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {Number(funds?.m2mrealized || account.last_pnl || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                ₹{Number(funds?.m2mrealized || account.last_pnl || 0).toFixed(2)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Unrealized: ₹{funds?.m2munrealized || '0.00'}
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Risk Sizing Controls</CardDescription>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>{account.multiplier}x Multiplier</span>
                <Badge variant="secondary" className="text-xs">
                  Max ₹{account.max_daily_loss} Loss
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
              Auto Square-off Active
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Subscriptions Section */}
      {subscriptions.length > 0 && (
        <Card className="bg-card/80 border-blue-500/30">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              Active Strategy Subscriptions ({subscriptions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Signals from these verified strategies are automatically executed on your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {subscriptions.map((sub) => (
                <div key={sub.mapping_id} className="p-3.5 rounded-lg border border-border/60 bg-card/60 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{sub.strategy_name || sub.strategy_tag}</span>
                      <Badge className="text-[10px] bg-emerald-600/20 text-emerald-400 border-emerald-500/40">
                        {sub.multiplier}x Sizing
                      </Badge>
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      Tag: <code>{sub.strategy_tag}</code> • {sub.segment}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Max Loss: ₹{sub.max_daily_loss}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnsubscribe(sub.mapping_id)}
                      className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 h-7"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Unsubscribe
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Marketplace */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Verified Master Strategies</h2>
            <p className="text-xs text-muted-foreground">
              Select verified strategies to replicate trades automatically onto your AC Agarwal account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((strat) => {
            const isSubbed = subscriptions.some((s) => s.strategy_id === strat.id)
            return (
              <Card key={strat.id} className="bg-card/80 border-border/70 shadow hover:border-blue-500/50 transition-all flex flex-col justify-between">
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-xs font-mono bg-blue-950/30 border-blue-500/40 text-blue-400">
                      {strat.segment} • {strat.timeframe}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {strat.default_symbol}
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{strat.strategy_name}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {strat.description || 'Institutional quantitative algorithmic trading strategy.'}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="p-5 pt-0 flex items-center justify-between border-t border-border/40 mt-4">
                  <span className="text-xs font-mono text-muted-foreground">
                    Tag: {strat.strategy_tag}
                  </span>
                  {isSubbed ? (
                    <Badge className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 text-xs py-1">
                      <Check className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenSubscribeModal(strat)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Subscribe
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Personal Net Positions Table */}
      {account && (
        <Card className="bg-card/80 border-border/70">
          <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Live Net Positions
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time positions on AC Agarwal Symphony XTS
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEmergencySquareOff}
              disabled={squareoffLoading}
              className="text-xs gap-1.5 h-8 font-semibold"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {squareoffLoading ? 'Closing...' : 'Square-Off My Positions'}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-right">Net Qty</TableHead>
                    <TableHead className="text-right">Buy Avg</TableHead>
                    <TableHead className="text-right">Sell Avg</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                    <TableHead className="text-right">MTM P&L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                        No open positions currently active on your AC Agarwal account.
                      </TableCell>
                    </TableRow>
                  ) : (
                    positions.map((pos, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-semibold text-xs font-mono">
                          {pos.TradingSymbol || pos.Symbol || pos.symbol}
                        </TableCell>
                        <TableCell className="text-xs">{pos.ExchangeSegment || 'NSEFO'}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${Number(pos.Quantity || pos.netQuantity || 0) !== 0 ? 'font-bold' : ''}`}>
                          {pos.Quantity || pos.netQuantity || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ₹{Number(pos.BuyAveragePrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          ₹{Number(pos.SellAveragePrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-blue-400">
                          ₹{Number(pos.LastTradedPrice || 0).toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-xs font-bold ${
                            Number(pos.MTM || pos.UnrealizedMTM || 0) >= 0
                              ? 'text-emerald-400'
                              : 'text-red-400'
                          }`}
                        >
                          ₹{Number(pos.MTM || pos.UnrealizedMTM || 0).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Field Instant Connect API Dialog */}
      <Dialog open={apiModalOpen} onOpenChange={setApiModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" />
              Connect AC Agarwal XTS API
            </DialogTitle>
            <DialogDescription className="text-xs">
              3-field instant setup. Enter your Symphony XTS Interactive credentials.
            </DialogDescription>
          </DialogHeader>

          {apiError && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg">
              {apiError}
            </div>
          )}

          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">1. Client Code (User ID)</Label>
              <Input
                placeholder="e.g. DM933"
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                className="text-xs uppercase font-mono h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">2. Interactive API Key</Label>
              <Input
                placeholder="Paste your Symphony XTS API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs font-mono h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">3. Interactive API Secret</Label>
              <Input
                type="password"
                placeholder="Paste your Symphony XTS API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="text-xs font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                  className="text-xs font-mono h-8"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Daily Loss (₹)</Label>
                <Input
                  type="number"
                  step="500"
                  value={maxDailyLoss}
                  onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value) || 2000)}
                  className="text-xs font-mono h-8"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApiModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveApi} disabled={savingApi} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {savingApi ? 'Connecting...' : 'Test & Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1-Click Strategy Subscription Modal */}
      <Dialog open={!!subscribingStrategy} onOpenChange={(open) => !open && setSubscribingStrategy(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              Subscribe to {subscribingStrategy?.strategy_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure sizing multiplier and safety kill-switch for this strategy.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Lot Multiplier</Label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1.0, 2.0, 5.0].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={subMultiplier === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSubMultiplier(m)}
                    className="font-mono text-xs h-8"
                  >
                    {m}x
                  </Button>
                ))}
              </div>
              <div className="pt-1">
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={subMultiplier}
                  onChange={(e) => setSubMultiplier(parseFloat(e.target.value) || 1.0)}
                  className="font-mono text-xs h-8"
                  placeholder="Custom Multiplier"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Max Daily Loss Budget (₹)</Label>
              <Input
                type="number"
                step="500"
                value={subMaxLoss}
                onChange={(e) => setSubMaxLoss(parseFloat(e.target.value) || 2000)}
                className="font-mono text-xs h-8"
              />
              <p className="text-[11px] text-muted-foreground">
                Trades are automatically halted if daily loss exceeds this threshold.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSubscribingStrategy(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmSubscribe} disabled={savingSub} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
              {savingSub ? 'Subscribing...' : 'Confirm Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1-Click TradingView Webhook Generator Modal */}
      <Dialog open={webhookModalOpen} onOpenChange={setWebhookModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-400" />
              1-Click TradingView Webhook Preset
            </DialogTitle>
            <DialogDescription className="text-xs">
              Copy this alert payload directly into your TradingView Alert box.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Webhook URL</Label>
              <Input
                readOnly
                value={`${window.location.origin}/api/copy-trading/webhook`}
                className="font-mono text-xs bg-muted/40 h-8"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Select Strategy Tag</Label>
                <select
                  value={selectedStrategyForWebhook}
                  onChange={(e) => setSelectedStrategyForWebhook(e.target.value)}
                  className="text-xs bg-muted border border-border/60 rounded px-2 py-1 font-mono"
                >
                  <option value="CRUDE_MOMENTUM">CRUDE_MOMENTUM</option>
                  <option value="NIFTY_TREND_PRO">NIFTY_TREND_PRO</option>
                  <option value="BANKNIFTY_STRADDLE">BANKNIFTY_STRADDLE</option>
                  <option value="SILVER100">SILVER100</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Alert Message (JSON)</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookJsonPayload)
                    setCopiedWebhook(true)
                    setTimeout(() => setCopiedWebhook(false), 3000)
                  }}
                  className="h-7 text-xs text-blue-400 hover:text-blue-300"
                >
                  {copiedWebhook ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copiedWebhook ? 'Copied!' : 'Copy Payload'}
                </Button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 text-xs font-mono overflow-x-auto border border-border/40">
                {webhookJsonPayload}
              </pre>
            </div>
          </div>

          <DialogFooter>
            <Button size="sm" onClick={() => setWebhookModalOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
