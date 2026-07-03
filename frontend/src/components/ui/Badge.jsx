import { cn } from '@/utils/helpers'

export function Badge({ children, className, variant = 'default', size = 'sm' }) {
  const variants = {
    default:  'bg-gray-500/10  text-gray-400  border-gray-500/20',
    primary:  'bg-primary-500/10 text-primary-400 border-primary-500/20',
    success:  'bg-green-500/10 text-green-400 border-green-500/20',
    warning:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    danger:   'bg-red-500/10   text-red-400   border-red-500/20',
    info:     'bg-blue-500/10  text-blue-400  border-blue-500/20',
  }
  const sizes = {
    xs: 'px-1.5 py-0 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const map = {
    1: { label: 'Critical', cls: 'bg-red-400/10    text-red-400    border-red-400/20' },
    2: { label: 'High',     cls: 'bg-orange-400/10 text-orange-400 border-orange-400/20' },
    3: { label: 'Medium',   cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
    4: { label: 'Low',      cls: 'bg-blue-400/10   text-blue-400   border-blue-400/20' },
    5: { label: 'Minimal',  cls: 'bg-gray-400/10   text-gray-400   border-gray-400/20' },
  }
  const info = map[priority] || map[3]
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', info.cls)}>
      {info.label}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    pending:     { label: 'Pending',     cls: 'bg-slate-400/10 text-slate-400 border-slate-400/20' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-400/10  text-blue-400  border-blue-400/20' },
    blocked:     { label: 'Blocked',     cls: 'bg-red-400/10   text-red-400   border-red-400/20' },
    completed:   { label: 'Completed',   cls: 'bg-green-400/10 text-green-400 border-green-400/20' },
    archived:    { label: 'Archived',    cls: 'bg-gray-500/10  text-gray-500  border-gray-500/20' },
  }
  const info = map[status] || map['pending']
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', info.cls)}>
      {info.label}
    </span>
  )
}
