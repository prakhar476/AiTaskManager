import { motion } from 'framer-motion'
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  ArrowRight, Brain, Zap, Target
} from 'lucide-react'
import { useTaskStats } from '@/hooks/useTasks'
import { useInsights } from '@/hooks/useAI'
import { Link } from 'react-router-dom'
import useAuthStore from '@/store/authStore'
import { cn } from '@/utils/helpers'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const STAT_CARDS = (stats) => [
  {
    label: 'Total Tasks',
    value: stats?.total ?? 0,
    icon: Target,
    color: 'text-primary-400',
    bg:   'bg-primary-500/10',
  },
  {
    label: 'Completed',
    value: stats?.by_status?.completed ?? 0,
    icon: CheckCircle2,
    color: 'text-green-400',
    bg:   'bg-green-500/10',
  },
  {
    label: 'In Progress',
    value: stats?.by_status?.in_progress ?? 0,
    icon: Clock,
    color: 'text-blue-400',
    bg:   'bg-blue-500/10',
  },
  {
    label: 'Overdue',
    value: stats?.overdue ?? 0,
    icon: AlertCircle,
    color: 'text-red-400',
    bg:   'bg-red-500/10',
  },
]

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useTaskStats()
  const { data: insights } = useInsights()
  const user = useAuthStore((s) => s.user)

  const categoryData = (stats?.by_category || [])
    .filter((c) => c.category__name)
    .map((c) => ({ name: c.category__name, value: c.count }))

  const completionRate = stats?.total
    ? Math.round(((stats.by_status?.completed || 0) / stats.total) * 100)
    : 0

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">
            Good day, {user?.first_name || user?.username} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here's your task overview</p>
        </div>
        <Link
          to="/tasks"
          className="flex items-center gap-1.5 text-sm text-primary-400 hover:text-primary-300 transition-colors"
        >
          View all tasks <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500 font-medium">{card.label}</span>
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', card.bg)}>
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {statsLoading ? '—' : card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Completion progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200">Completion Rate</h3>
            <TrendingUp size={14} className="text-green-400" />
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-white">{completionRate}%</span>
            <span className="text-sm text-gray-500 mb-1">of all tasks done</span>
          </div>
          <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-green-400 rounded-full"
            />
          </div>
          {stats?.completed_this_week !== undefined && (
            <p className="text-xs text-gray-500 mt-3">
              {stats.completed_this_week} completed this week
            </p>
          )}
        </div>

        {/* Category pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">By Category</h3>
          {categoryData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={categoryData} cx={45} cy={45} innerRadius={28} outerRadius={45} paddingAngle={2} dataKey="value">
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#16162a', border: '1px solid #2a2a45', borderRadius: 8, fontSize: 11 }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5 min-w-0">
                {categoryData.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-gray-400 truncate flex-1">{c.name}</span>
                    <span className="text-xs text-gray-500 flex-shrink-0">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 mt-4">No categorized tasks yet.</p>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      {insights?.recommendations?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Brain size={12} className="text-primary-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">AI Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn(
                  'p-3 rounded-xl border',
                  rec.type === 'success'
                    ? 'bg-green-500/5 border-green-500/15'
                    : 'bg-primary-500/5 border-primary-500/15'
                )}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap size={12} className={rec.type === 'success' ? 'text-green-400' : 'text-primary-400'} />
                  <p className="text-xs font-semibold text-gray-300">{rec.title}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{rec.message}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
