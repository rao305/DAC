'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  /**
   * Size variant: 'sm' (32px), 'md' (40px), 'lg' (48px), or custom size
   */
  size?: 'sm' | 'md' | 'lg' | number
  /**
   * Whether to show as a link (default: true)
   */
  href?: string | false
  /**
   * Additional className
   */
  className?: string
  /**
   * Whether to show text label (default: true)
   */
  showText?: boolean
  /**
   * Variant: 'default' (emerald green) or 'muted' (dark grey)
   */
  variant?: 'default' | 'muted'
}

/**
 * Logo - Syntra brand logo component
 * 
 * Features:
 * - Rounded square with "D" in vibrant emerald green
 * - "Syntra" text next to the icon
 * - Responsive sizing
 * - Optional link wrapper
 * - Muted variant for dark backgrounds
 */
export function Logo({
  size = 'md',
  href = '/',
  className,
  showText = true,
  variant = 'default',
}: LogoProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
  }

  const iconSize = typeof size === 'number' ? size : sizeMap[size]
  const textSize = typeof size === 'number' 
    ? Math.round(size * 0.75) 
    : size === 'sm' ? 20 : size === 'md' ? 24 : 28

  const labelClasses = cn(
    'font-bold text-foreground uppercase tracking-tight'
  )

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="flex-shrink-0"
        style={{
          width: `${iconSize}px`,
          height: `${iconSize}px`,
        }}
      >
        <Image
          src="/syntra.png"
          alt="Syntra Logo"
          width={iconSize}
          height={iconSize}
          className="object-contain"
        />
      </div>
      {showText && (
        <span
          className={labelClasses}
          style={{
            fontSize: `${textSize}px`,
          }}
        >
          Syntra
        </span>
      )}
    </div>
  )

  if (href === false) {
    return content
  }

  return (
    <Link href={href} className="flex items-center">
      {content}
    </Link>
  )
}

