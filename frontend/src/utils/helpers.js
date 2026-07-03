import { format, formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from 'date-fns'
import clsx from 'clsx'

// ── Class merging ─────────────────────────────────────────────────────────────
export { clsx as cn }

// ── Priority helpers ──────────────────────────────────────────────────────────
export const PRIORITY_MAP = {
  1: { label: 'Critical', color: '#ef4444', bg: 'bg-red-400/10',    text: 'text-red-400',    border: 'border-red-400/20',    dot: 'bg-red-400' },
  2: { label: 'High',     color: '#f97316', bg: 'bg-orange-400/10', text: 'text-orange-400', border: 'border-orange-400/20', dot: 'bg-orange-400' },
  3: { label: 'Medium',   color: '#eab308', bg: 'bg-yellow-400/10', text: 'text-yellow-400', border: 'border-yellow-400/20', dot: 'bg-yellow-400' },
  4: { label: 'Low',      color: '#3b82f6', bg: 'bg-blue-400/10',   text: 'text-blue-400',   border: 'border-blue-400/20',   dot: 'bg-blue-400' },
  5: { label: 'Minimal',  color: '#6b7280', bg: 'bg-gray-400/10',   text: 'text-gray-400',   border: 'border-gray-400/20',   dot: 'bg-gray-400' },
}

export const STATUS_MAP = {
  pending:     { label: 'Pending',     color: 'text-slate-400',  bg: 'bg-slate-400/10',  border: 'border-slate-400/20' },
  in_progress: { label: 'In Progress', color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20'  },
  blocked:     { label: 'Blocked',     color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20'   },
  completed:   { label: 'Completed',   color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20' },
  archived:    { label: 'Archived',    color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/20'  },
}

export function getPriorityInfo(priority) {
  return PRIORITY_MAP[priority] || PRIORITY_MAP[3]
}

export function getStatusInfo(status) {
  return STATUS_MAP[status] || STATUS_MAP['pending']
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function formatDueDate(dateStr) {
  if (!dateStr) return null
  const date = new Date(dateStr)

  if (isPast(date))      return { label: `Overdue · ${format(date, 'MMM d')}`,  urgent: true,  class: 'text-red-400' }
  if (isToday(date))     return { label: 'Due today',                            urgent: true,  class: 'text-orange-400' }
  if (isTomorrow(date))  return { label: 'Due tomorrow',                         urgent: false, class: 'text-yellow-400' }

  const inWeek = addDays(new Date(), 7)
  if (date < inWeek)     return { label: format(date, 'EEE, MMM d'),             urgent: false, class: 'text-blue-400' }

  return { label: format(date, 'MMM d, yyyy'), urgent: false, class: 'text-gray-400' }
}

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'MMM d, yyyy · h:mm a')
}

// ── AI score helpers ──────────────────────────────────────────────────────────
export function getAIScoreColor(score) {
  if (score >= 0.7) return 'text-red-400'
  if (score >= 0.5) return 'text-orange-400'
  if (score >= 0.3) return 'text-yellow-400'
  return 'text-green-400'
}

export function getAIScoreLabel(score) {
  if (score >= 0.7) return 'Urgent'
  if (score >= 0.5) return 'High'
  if (score >= 0.3) return 'Moderate'
  return 'Relaxed'
}

// ── String helpers ────────────────────────────────────────────────────────────
export function truncate(str, len = 80) {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '…' : str
}

export function initials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Grouped tasks (for board view) ────────────────────────────────────────────
export function groupByStatus(tasks = []) {
  const order = ['pending', 'in_progress', 'blocked', 'completed']
  const groups = {}
  order.forEach((s) => (groups[s] = []))
  tasks.forEach((t) => {
    if (groups[t.status]) groups[t.status].push(t)
    else groups['pending'].push(t)
  })
  return groups
}
