'use client'

interface LegendButtonProps {
  onClick: () => void
  variant?: 'full' | 'icon'
  className?: string
}

export function LegendButton({ onClick, variant = 'full', className = '' }: LegendButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`border border-border rounded bg-background hover:bg-accent transition-colors flex items-center justify-center ${
        variant === 'icon' 
          ? 'w-7 h-7 rounded-full text-xs font-semibold' 
          : 'px-2 py-1 text-xs whitespace-nowrap'
      } ${className}`}
      aria-label="Mostra legenda"
      title="Mostra legenda"
    >
      {variant === 'icon' ? '?' : 'Legenda'}
    </button>
  )
}
