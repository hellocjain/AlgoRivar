import { Monitor, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/sessionStore'

interface FooterProps {
  className?: string
}

export function Footer({ className }: FooterProps) {
  const [version, setVersion] = useState<string>('2.0.0')
  const activeSessionCount = useSessionStore((s) => s.activeSessionCount)

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/auth/app-info')
        const data = await response.json()
        if (data.status === 'success' && data.version) {
          setVersion(data.version)
        }
      } catch (_error) {}
    }

    fetchVersion()
  }, [])

  return (
    <footer className={cn('mt-auto border-t bg-card/40 backdrop-blur border-border/40', className)}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-600/20 text-blue-400">
              <Zap className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground">AlgoRivar</span>
            <span>—</span>
            <span className="italic">Algo Trading Made Easy</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>Institutional Multi-Account Copy-Trading SaaS</span>
            <span className="hidden md:inline">•</span>
            <span>AC Agarwal (Symphony XTS) Edition</span>
            {version && (
              <Badge variant="secondary" className="gap-1 font-mono text-[10px]">
                <span className="opacity-75">v</span>
                <span>{version}</span>
              </Badge>
            )}
            {activeSessionCount > 0 && (
              <Badge variant="outline" className="gap-1 font-mono text-[10px]">
                <Monitor className="h-3 w-3" />
                <span>
                  {activeSessionCount} {activeSessionCount === 1 ? 'session' : 'sessions'}
                </span>
              </Badge>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} AlgoRivar. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
