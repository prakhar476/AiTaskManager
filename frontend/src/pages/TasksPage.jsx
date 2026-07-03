import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, LayoutGrid, List, SlidersHorizontal,
  Brain, RefreshCw, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import TaskCard from '@/components/TaskCard/TaskCard'
import TaskForm from '@/components/TaskForm/TaskForm'
import { useTasks, useCategories, useBulkUpdate } from '@/hooks/useTasks'
import useTaskStore from '@/store/taskStore'
import { cn, groupByStatus } from '@/utils/helpers'

const STATUS_COLUMNS = [
  { key: 'pending',     label: 'Pending',     color: '#64748b' },
  { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'blocked',     label: 'Blocked',     color: '#ef4444' },
  { key: 'completed',   label: 'Completed',   color: '#22c55e' },
]

export default function TasksPage() {
  const [createOpen, setCreateOpen]   = useState(false)
  const [editTask,   setEditTask]     = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const { filters, setFilter, clearFilters, view, setView } = useTaskStore()
  const { data, isLoading, refetch } = useTasks()
  const { data: categories = [] } = useCategories()

  const tasks   = data?.results ?? data ?? []
  const grouped = groupByStatus(tasks)

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="px-6 py-4 border-b border-surface-border bg-surface-card/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white mr-2">Tasks</h1>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search tasks…"
              className="w-full bg-surface-hover border border-surface-border rounded-xl pl-8 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 transition-all"
            />
          </div>

          {/* Filters toggle */}
          <Button
            variant={filtersOpen || hasActiveFilters ? 'outline' : 'ghost'}
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(hasActiveFilters && 'border-primary-500/50 text-primary-400')}
          >
            Filters {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
          </Button>

          <div className="flex items-center gap-1 bg-surface-hover border border-surface-border rounded-xl p-1">
            <button
              onClick={() => setView('board')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'board' ? 'bg-surface-border text-gray-200' : 'text-gray-500 hover:text-gray-300')}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-surface-border text-gray-200' : 'text-gray-500 hover:text-gray-300')}
            >
              <List size={14} />
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-gray-500">
            <RefreshCw size={13} />
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreateOpen(true)}>
            New Task
          </Button>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 pt-3 flex-wrap">
                <FilterSelect
                  value={filters.status}
                  onChange={(v) => setFilter('status', v)}
                  placeholder="All statuses"
                  options={[
                    { value: 'pending',     label: 'Pending' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'blocked',     label: 'Blocked' },
                    { value: 'completed',   label: 'Completed' },
                  ]}
                />
                <FilterSelect
                  value={filters.priority}
                  onChange={(v) => setFilter('priority', v)}
                  placeholder="All priorities"
                  options={[
                    { value: '1', label: 'Critical' },
                    { value: '2', label: 'High' },
                    { value: '3', label: 'Medium' },
                    { value: '4', label: 'Low' },
                    { value: '5', label: 'Minimal' },
                  ]}
                />
                <FilterSelect
                  value={filters.category}
                  onChange={(v) => setFilter('category', v)}
                  placeholder="All categories"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
                <FilterSelect
                  value={filters.is_overdue}
                  onChange={(v) => setFilter('is_overdue', v)}
                  placeholder="Overdue?"
                  options={[{ value: 'true', label: 'Overdue only' }]}
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 text-xs">
                    Clear all
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task content */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton h-5 w-24 rounded-lg" />
                {[...Array(3)].map((__, j) => <div key={j} className="skeleton h-28 rounded-xl" />)}
              </div>
            ))}
          </div>
        ) : view === 'board' ? (
          <BoardView grouped={grouped} onEditTask={setEditTask} />
        ) : (
          <ListView tasks={tasks} onEditTask={setEditTask} />
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="New Task" size="md">
        <TaskForm onClose={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="md">
        {editTask && <TaskForm task={editTask} onClose={() => setEditTask(null)} />}
      </Modal>
    </div>
  )
}

function BoardView({ grouped, onEditTask }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
      {STATUS_COLUMNS.map((col) => (
        <div key={col.key} className="flex flex-col min-h-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{col.label}</span>
            <span className="ml-auto text-xs text-gray-600 bg-surface-hover px-2 py-0.5 rounded-full">
              {grouped[col.key]?.length || 0}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <AnimatePresence>
              {(grouped[col.key] || []).map((task) => (
                <TaskCard key={task.id} task={task} onClick={onEditTask} />
              ))}
            </AnimatePresence>
            {grouped[col.key]?.length === 0 && (
              <div className="border border-dashed border-surface-border rounded-xl p-6 text-center">
                <p className="text-xs text-gray-600">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ListView({ tasks, onEditTask }) {
  return (
    <div className="space-y-2 max-w-4xl mx-auto">
      {tasks.length === 0 && (
        <div className="text-center py-16">
          <Brain size={32} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No tasks found. Create one!</p>
        </div>
      )}
      <AnimatePresence>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={onEditTask} compact />
        ))}
      </AnimatePresence>
    </div>
  )
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-surface-hover border border-surface-border rounded-xl pl-3 pr-7 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-primary-500/60 transition-all cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  )
}
