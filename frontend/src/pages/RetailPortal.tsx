import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  CheckCircle2,
  Key,
  RefreshCw,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'

interface Strategy {
  id: number
  strategy_tag: string
  strategy_name: string
  segment: string
  timeframe: string
  default_symbol: string
  description?: string
  is_active: boolean
  subscribers_count?: number
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

export default function RetailPortal() {
  usePageTitle()

  const [account, setAccount] = useState<PersonalAccount | null>(null)
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [funds, setFunds] = useState<any>(null)
  const [refreshing, setRefreshing] = useState<boolean>(false)

  // API Key Modal State
  const [apiModalOpen, setApiModalOpen] = useState<boolean>(false)
  const [accountName, setAccountName] = useState<string>('')
  const [clientCode, setClientCode] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [apiSecret, setApiSecret] = useState<string>('')
  const [multiplier, setMultiplier] = useState<number>(1.0)
  const [maxDailyLoss, setMaxDailyLoss] = useState<number>(2000)
  const [savingApi, setSavingApi] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string>('')

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
          // Fetch live positions & funds
          try {
            const [posRes, fundsRes] = await Promise.all([
              fetch(`/api/retail/positions/${parsedAcc.id}`),
              fetch(`/api/retail/funds/${parsedAcc.id}`),
            ])
            const posJson = await posRes.json()
            if (posJson.status === 'success') setPositions(posJson.positions || [])
            const fundsJson = await fundsRes.json()
            if (fundsJson.status === 'success') setFunds(fundsJson.funds || null)
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
    if (!accountName || !clientCode || !apiKey || !apiSecret) {
      setApiError('All credential fields are required.')
      return
    }
    setSavingApi(true)
    setApiError('')
    try {
      const resp = await fetch('/api/retail/connect-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName,
          client_code: clientCode,
          api_key: apiKey,
          api_secret: apiSecret,
          multiplier: multiplier,
          max_daily_loss: maxDailyLoss,
        }),
      })
      const result = await resp.json()
      if (result.status === 'success' || result.status === 'warning') {
        const accObj: PersonalAccount = {
          id: result.data?.id,
          account_name: accountName,
          client_code: clientCode,
          is_active: true,
          connection_status: 'connected',
          multiplier: multiplier,
          max_daily_loss: maxDailyLoss,
          last_funds: 0,
          last_pnl: 0,
        }
        localStorage.setItem('algorivar_retail_account', JSON.stringify(accObj))
        setAccount(accObj)
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

  const handleSubscribe = async (strategyId: number) => {
    if (!account || !account.id) {
      setApiModalOpen(true)
      return
    }
    try {
      const resp = await fetch('/api/retail/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          strategy_id: strategyId,
          multiplier: account.multiplier || 1.0,
          max_daily_loss: account.max_daily_loss || 2000,
        }),
      })
      const data = await resp.json()
      if (data.status === 'success') {
        alert('Subscribed to strategy successfully!')
        loadData()
      } else {
        alert(data.message || 'Failed to subscribe')
      }
    } catch (e: any) {
      alert(e.message || 'Subscription error')
    }
  }

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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!account ? (
            <Button
              size="sm"
              onClick={() => setApiModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
            >
              <Key className="h-4 w-4" />
              Connect AC Agarwal API
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setApiModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Shield className="h-4 w-4 text-emerald-400" />
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
              <CardDescription className="text-xs">Risk Controls</CardDescription>
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
          {strategies.map((strat) => (
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
                <Button
                  size="sm"
                  onClick={() => handleSubscribe(strat.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Subscribe
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Personal Net Positions Table */}
      {account && (
        <Card className="bg-card/80 border-border/70">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-400" />
              Live Net Positions
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time positions on AC Agarwal Symphony XTS
            </CardDescription>
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

      {/* Connect API Dialog */}
      <Dialog open={apiModalOpen} onOpenChange={setApiModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-400" />
              Connect AC Agarwal (Symphony XTS) API
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your Symphony XTS Interactive API credentials from AC Agarwal.
            </DialogDescription>
          </DialogHeader>

          {apiError && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-400 text-xs rounded-lg">
              {apiError}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Name</Label>
                <Input
                  placeholder="e.g. My Trading Account"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client Code (User ID)</Label>
                <Input
                  placeholder="e.g. DM933"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  className="text-xs uppercase font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Interactive API Key</Label>
              <Input
                placeholder="Paste Interactive API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Interactive API Secret</Label>
              <Input
                type="password"
                placeholder="Paste Interactive API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="space-y-1.5">
                <Label className="text-xs">Lot Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Max Daily Loss (₹)</Label>
                <Input
                  type="number"
                  step="500"
                  value={maxDailyLoss}
                  onChange={(e) => setMaxDailyLoss(parseFloat(e.target.value) || 2000)}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApiModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveApi} disabled={savingApi} className="bg-blue-600 hover:bg-blue-700 text-white">
              {savingApi ? 'Connecting...' : 'Save & Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
