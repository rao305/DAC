'use client'

import * as React from 'react'
import { AlertCircle, WifiOff, X, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ErrorType = 'network' | 'api' | 'auth' | 'ratelimit' | 'generic'

interface ErrorBannerProps {
  type?: ErrorType
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  persistent?: boolean
  className?: string
}

const ERROR_CONFIG: Record<
  ErrorType,
  {
    icon: React.ReactNode
    defaultTitle: string
    variant: 'default' | 'destructive'
  }
> = {
  network: {
    icon: <WifiOff className="h-4 w-4" />,
    defaultTitle: 'Connection Error',
    variant: 'destructive',
  },
  api: {
    icon: <AlertCircle className="h-4 w-4" />,
    defaultTitle: 'API Error',
    variant: 'destructive',
  },
  auth: {
    icon: <AlertCircle className="h-4 w-4" />,
    defaultTitle: 'Authentication Error',
    variant: 'destructive',
  },
  ratelimit: {
    icon: <AlertCircle className="h-4 w-4" />,
    defaultTitle: 'Rate Limit Exceeded',
    variant: 'default',
  },
  generic: {
    icon: <AlertCircle className="h-4 w-4" />,
    defaultTitle: 'Error',
    variant: 'destructive',
  },
}

/**
 * ErrorBanner - Dismissible error notification banner
 *
 * Features:
 * - Different error types (network, API, auth, rate limit)
 * - Retry action
 * - Dismissible
 * - Persistent or auto-hide options
 * - Appropriate icons and styling
 * - Accessible
 */
export function ErrorBanner({
  type = 'generic',
  title,
  message,
  onRetry,
  onDismiss,
  persistent = false,
  className,
}: ErrorBannerProps) {
  const [visible, setVisible] = React.useState(true)

  const config = ERROR_CONFIG[type]
  const displayTitle = title || config.defaultTitle

  // Auto-hide after 8 seconds if not persistent
  React.useEffect(() => {
    if (!persistent && !onDismiss) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [persistent, onDismiss])

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  if (!visible) return null

  return (
    <Alert
      variant={config.variant}
      className={cn(
        'relative animate-in fade-in slide-in-from-top-2 duration-300',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1 space-y-1">
          <AlertTitle className="text-sm font-semibold">
            {displayTitle}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {message}
          </AlertDescription>

          {/* Action buttons */}
          {(onRetry || onDismiss) && (
            <div className="flex items-center gap-2 mt-3">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  variant="outline"
                  className="h-8 gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              )}
              {onDismiss && !persistent && (
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="ghost"
                  className="h-8"
                >
                  Dismiss
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Close button */}
        {onDismiss && (
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 absolute top-3 right-3"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  )
}
