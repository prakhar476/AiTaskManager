import { cn } from '@/utils/helpers'
import { forwardRef } from 'react'

export const Input = forwardRef(function Input({
  label, error, hint, icon: Icon, className, ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <Icon size={15} />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface-hover border rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500',
            'focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30',
            'transition-all duration-200',
            Icon && 'pl-9',
            error ? 'border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20' : 'border-surface-border',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({
  label, error, hint, className, rows = 3, ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full bg-surface-hover border rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-500 resize-none',
          'focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30',
          'transition-all duration-200',
          error ? 'border-red-500/50' : 'border-surface-border',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
})

export const Select = forwardRef(function Select({
  label, error, className, children, ...props
}, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-300">{label}</label>
      )}
      <select
        ref={ref}
        className={cn(
          'w-full bg-surface-hover border border-surface-border rounded-xl px-4 py-2.5',
          'text-sm text-gray-200 focus:outline-none focus:border-primary-500/60',
          'focus:ring-1 focus:ring-primary-500/30 transition-all duration-200',
          error && 'border-red-500/50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})
