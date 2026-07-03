import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

export function Button({
  children, onClick, type = 'button',
  variant = 'primary', size = 'md',
  loading = false, disabled = false,
  className, icon: Icon, ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:   'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-500/40',
    secondary: 'bg-surface-hover hover:bg-surface-border text-gray-300 hover:text-white focus:ring-gray-500/30',
    ghost:     'bg-transparent hover:bg-surface-hover text-gray-400 hover:text-gray-200 focus:ring-gray-500/20',
    danger:    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 focus:ring-red-500/30',
    success:   'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 focus:ring-green-500/30',
    outline:   'bg-transparent border border-surface-border hover:border-primary-500/50 text-gray-300 hover:text-white focus:ring-primary-500/30',
  }

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : Icon ? (
        <Icon size={14} />
      ) : null}
      {children}
    </button>
  )
}
