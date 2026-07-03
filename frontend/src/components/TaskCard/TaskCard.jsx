import { motion } from 'framer-motion'
import { Calendar, Tag, Brain, MoreVertical, CheckCircle2, Circle, Clock } from 'lucide-react'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { formatDueDate, truncate, cn } from '@/utils/helpers'
import { useUpdateTask, useDeleteTask } from '@/hooks/useTasks'
import { useState } from 'react'

export default function TaskCard({ task, onClick, compact = false }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { mutate: updateTask } = useUpdateTask()
  const { mutate: deleteTask } = useDeleteTask()

  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null
  const isCompleted = task.status === 'completed'

  const toggleComplete = (e) => {
    e.stopPropagation()
    updateTask({ id: task.id, data: { status: isCompleted ? 'pending' : 'completed' } })
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    setMenuOpen(false)
    deleteTask(task.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ y: -1 }}
      onClick={() => onClick?.(task)}
      className={cn(
        'card p-4 cursor-pointer transition-all duration-200 hover:border-surface-border/80',
        'hover:shadow-lg hover:shadow-black/20 group relative',
        isCompleted && 'opacity-60',
        compact && 'p-3'
      )}
    >
      {/* Priority bar */}
      <div
        className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full"
        style={{ backgroundColor: getPriorityColor(task.priority) }}
      />

      <div className="pl-3">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          <button
            onClick={toggleComplete}
            className="mt-0.5 flex-shrink-0 text-gray-600 hover:text-primary-400 transition-colors"
          >
            {isCompleted
              ? <CheckCircle2 size={16} className="text-green-400" />
              : <Circle size={16} />
            }
          </button>

          <div className="flex-1 min-w-0">
            <h3 className={cn(
              'text-sm font-medium text-gray-200 leading-snug',
              isCompleted && 'line-through text-gray-500'
            )}>
              {task.title}
            </h3>
            {task.description && !compact && (
              <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">
                {truncate(task.description, 90)}
              </p>
            )}
          </div>

          {/* Kebab menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-surface-hover transition-all"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-6 z-20 w-36 bg-surface-card border border-surface-border rounded-xl shadow-xl py-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onClick?.(task); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover transition-colors"
                >Edit task</button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateTask({ id: task.id, data: { status: 'in_progress' } }); setMenuOpen(false) }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-surface-hover transition-colors"
                >Mark In Progress</button>
                <div className="border-t border-surface-border my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-400/5 transition-colors"
                >Delete</button>
              </div>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mt-2">
          <PriorityBadge priority={task.priority} />

          {task.category_name && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
              style={{
                color: task.category_color,
                backgroundColor: task.category_color + '15',
                borderColor: task.category_color + '30',
              }}
            >
              {task.category_name}
            </span>
          )}

          {dueInfo && (
            <span className={cn('inline-flex items-center gap-1 text-xs', dueInfo.class)}>
              <Calendar size={10} />
              {dueInfo.label}
            </span>
          )}

          {task.nlp_processed && (
            <span className="inline-flex items-center gap-1 text-xs text-primary-400/70">
              <Brain size={10} />
              AI
            </span>
          )}

          {task.estimated_minutes && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-600">
              <Clock size={10} />
              {task.estimated_minutes}m
            </span>
          )}
        </div>

        {/* Tags */}
        {task.tags?.length > 0 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-[10px] text-gray-500 bg-surface-hover px-1.5 py-0.5 rounded-md">
                #{tag.name}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-[10px] text-gray-600">+{task.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Click-outside closer for menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
      )}
    </motion.div>
  )
}

function getPriorityColor(p) {
  return { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#3b82f6', 5: '#6b7280' }[p] || '#6b7280'
}
