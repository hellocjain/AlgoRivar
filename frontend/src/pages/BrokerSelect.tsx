import { BookOpen, ExternalLink, Key, Loader2, Settings, ShieldCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { webClient } from '@/api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/authStore'

// All supported brokers with their display names and auth types
const allBrokers = [
  { id: 'acagarwal', name: 'AC Agarwal', authType: 'totp' },
  { id: 'fivepaisa', name: '5 Paisa', authType: 'totp' },
  { id: 'fivepaisaxts', name: '5 Paisa (XTS)', authType: 'totp' },
  { id: 'aliceblue', name: 'Alice Blue', authType: 'totp' },
  { id: 'angel', name: 'Angel One', authType: 'totp' },
  { id: 'arrow', name: 'Arrow', authType: 'oauth' },
  { id: 'compositedge', name: 'CompositEdge', authType: 'oauth' },
  { id: 'dhan', name: 'Dhan', authType: 'oauth' },
  { id: 'deltaexchange', name: 'Delta Exchange', authType: 'totp' },
  { id: 'indmoney', name: 'IndMoney', authType: 'totp' },
  { id: 'dhan_sandbox', name: 'Dhan (Sandbox)', authType: 'totp' },
  { id: 'definedge', name: 'Definedge', authType: 'totp' },
  { id: 'firstock', name: 'Firstock', authType: 'totp' },
  { id: 'flattrade', name: 'Flattrade', authType: 'oauth' },
  { id: 'motilal', name: 'Motilal Oswal', authType: 'totp' },
  { id: 'fyers', name: 'Fyers', authType: 'oauth' },
  { id: 'groww', name: 'Groww', authType: 'totp' },
  { id: 'hdfcsecurities', name: 'HDFC Securities', authType: 'oauth' },
  { id: 'hdfcsky', name: 'HDFC Sky', authType: 'oauth' },
  { id: 'ibulls', name: 'Ibulls', authType: 'totp' },
  { id: 'iifl', name: 'IIFL', authType: 'totp' },
  { id: 'iiflcapital', name: 'IIFL Capital', authType: 'oauth' },
  { id: 'jainamxts', name: 'JainamXts', authType: 'totp' },
  { id: 'kotak', name: 'Kotak Securities', authType: 'totp' },
  { id: 'mstock', name: 'mStock by Mirae Asset', authType: 'totp' },
  { id: 'nubra', name: 'Nubra', authType: 'totp' },
  { id: 'paytm', name: 'Paytm Money', authType: 'oauth' },
  { id: 'pocketful', name: 'Pocketful', authType: 'oauth' },
  { id: 'rmoney', name: 'RMoney', authType: 'oauth' },
  { id: 'samco', name: 'Samco', authType: 'totp' },
  { id: 'shoonya', name: 'Shoonya', authType: 'totp' },
  { id: 'tradejini', name: 'Tradejini', authType: 'totp' },
  { id: 'tradesmart', name: 'TradeSmart', authType: 'oauth' },
  { id: 'upstox', name: 'Upstox', authType: 'oauth' },
  { id: 'wisdom', name: 'Wisdom Capital', authType: 'totp' },
  { id: 'zebu', name: 'Zebu', authType: 'totp' },
  { id: 'zerodha', name: 'Zerodha', authType: 'oauth' },
] as const

export default function BrokerSelect() {
  const { user } = useAuthStore()
  const [selectedBroker, setSelectedBroker] = useState<string>('acagarwal')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Direct Frontend API Key & Client ID entry state
  const [clientId, setClientId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [apiKeyMarket, setApiKeyMarket] = useState('')
  const [apiSecretMarket, setApiSecretMarket] = useState('')
  const [showConfig, setShowConfig] = useState(true)

  useEffect(() => {
    // Fetch broker configuration & current credentials
    const fetchBrokerConfig = async () => {
      try {
        const response = await webClient.get('/auth/broker-config')
        const data = response.data

        if (data.status === 'success') {
          setSelectedBroker(data.broker_name || 'acagarwal')
        }

        // Set showConfig to true by default so user can directly input credentials
        setShowConfig(true)
      } catch {
        // Fallback to default
        setSelectedBroker('acagarwal')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBrokerConfig()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const targetBroker = selectedBroker || 'acagarwal'

      if (targetBroker === 'acagarwal') {
        if (!apiKey || !apiSecret) {
          setError('Please enter your AC Agarwal Interactive App Key and Secret Key.')
          setIsSubmitting(false)
          return
        }

        const payload = {
          broker_name: 'acagarwal',
          client_id: clientId.trim(),
          broker_api_key: apiKey.trim(),
          broker_api_secret: apiSecret.trim(),
          broker_api_key_market: apiKeyMarket.trim(),
          broker_api_secret_market: apiSecretMarket.trim(),
        }

        const res = await webClient.post('/api/broker/direct-connect', payload)
        if (res.data.status === 'success') {
          useAuthStore.setState((state) => ({
            user: state.user ? { ...state.user, broker: 'acagarwal' } : null,
          }))
          window.location.href = res.data.redirect || '/copytrading'
          return
        } else {
          throw new Error(res.data.message || 'Authentication failed')
        }
      }

      // Other brokers using standard callback flow
      if (apiKey || apiSecret) {
        await webClient.post('/api/broker/credentials', {
          client_id: clientId.trim(),
          broker_api_key: apiKey.trim(),
          broker_api_secret: apiSecret.trim(),
          broker_api_key_market: apiKeyMarket.trim(),
          broker_api_secret_market: apiSecretMarket.trim(),
          redirect_url: `http://${window.location.host}/${targetBroker}/callback`,
        })
      }
      window.location.href = `/${targetBroker}/callback`
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to authenticate broker')
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 bg-muted/20">
      <div className="container max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
          {/* Right side broker form - Shown first on mobile */}
          <Card className="w-full max-w-lg shadow-2xl border-primary/20 order-1 lg:order-2">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <img src="/logo.png" alt="AlgoRivar" className="h-16 w-16" />
              </div>
              <CardTitle className="text-2xl font-bold">Connect Trading Account</CardTitle>
              <CardDescription>
                Welcome, <span className="font-semibold text-foreground">{user?.username}</span>! Connect your broker to start live copy trading.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="broker-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Selected Broker
                  </Label>
                  <Select
                    value={selectedBroker}
                    onValueChange={setSelectedBroker}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="broker-select" className="w-full">
                      <SelectValue placeholder="Select a Broker" />
                    </SelectTrigger>
                    <SelectContent>
                      {allBrokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* API Credentials Configuration Panel */}
                <div className="rounded-lg border border-border bg-card/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Key className="h-4 w-4 text-primary" />
                      <span>{selectedBroker === 'acagarwal' ? 'AC Agarwal Symphony XTS Keys' : 'Broker API Credentials'}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-7 px-2"
                      onClick={() => setShowConfig(!showConfig)}
                    >
                      {showConfig ? 'Hide Inputs' : 'Edit Credentials'}
                    </Button>
                  </div>

                  {showConfig ? (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-foreground">Broker Client ID / UCC Code</Label>
                        <Input
                          placeholder="e.g. DM933 or your Account ID"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          className="font-mono text-xs font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Interactive App Key (Trading)</Label>
                        <Input
                          placeholder="Enter XTS Interactive App Key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Interactive Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter XTS Interactive Secret"
                          value={apiSecret}
                          onChange={(e) => setApiSecret(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Market Data App Key (Quotes & Depth)</Label>
                        <Input
                          placeholder="Enter XTS Market Data App Key"
                          value={apiKeyMarket}
                          onChange={(e) => setApiKeyMarket(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Market Data Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="Enter XTS Market Data Secret"
                          value={apiSecretMarket}
                          onChange={(e) => setApiSecretMarket(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Credentials are encrypted and saved. Click "Edit Credentials" above if you need to update them.
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving & Connecting Broker...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Save & Connect Account
                    </>
                  )}
                </Button>
              </form>

              {/* Direct Multi-Account Navigation Links */}
              <div className="mt-6 pt-4 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
                <Link
                  to="/copytrading"
                  className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium">Master Desk</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-medium">Profile</span>
                </Link>
                <Link
                  to="/portal"
                  className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="font-medium">Retail Portal</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Left side content - Shown second on mobile */}
          <div className="flex-1 max-w-xl text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <ShieldCheck className="h-3.5 w-3.5" />
              Institutional Turnkey Multi-Broker SaaS
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Connect Your <span className="text-primary">Master Desk</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              Link your AC Agarwal Symphony XTS account to execute algorithmic orders, manage child trading sub-accounts, and broadcast signals in sub-millisecond execution.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-lg border border-border/80 bg-card/40 text-left">
                <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" /> Multi-Account Mirroring
                </div>
                <div className="text-xs text-muted-foreground">
                  Trade on 1 master account and fan out to 50+ child accounts in parallel.
                </div>
              </div>
              <div className="p-3.5 rounded-lg border border-border/80 bg-card/40 text-left">
                <div className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-primary" /> 256-bit Fernet Encryption
                </div>
                <div className="text-xs text-muted-foreground">
                  Credentials are encrypted at rest with auto 08:30 AM pre-market token refresh.
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-start gap-3">
              <Button variant="outline" size="sm" asChild>
                <a href="https://docs.openalgo.in" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Documentation
                </a>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link to="/copytrading">
                  <Users className="mr-2 h-4 w-4" />
                  Open Master Desk
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
