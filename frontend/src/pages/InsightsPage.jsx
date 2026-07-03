import { motion } from 'framer-motion'
import {
  Brain, TrendingUp, Target, Zap, AlertCircle,
  CheckCircle2, Clock, BarChart2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts'
import { useInsights } from '@/hooks/useAI'
import { useTaskStats } from '@/hooks/useTasks'
import { cn } from '@/utils/helpers'

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const PRIORITY_LABELS = { 1: 'Critical', 2: 'High', 3: 'Medium', 4: 'Low', 5: 'Minimal' }

const TOOLTIP_STYLE = {
  contentStyle: {
    background: '#16162a',
    border: '1px solid #2a2a45',
    borderRadius: 10,
    fontSize: 12,
  },
  itemStyle: { color: '#e2e8f0' },
  labelStyle: { color: '#94a3b8' },
}

export default function InsightsPage() {
  const { data: insights, isLoading: insightsLoading } = useInsights()
  const { data: stats } = useTaskStats()

  const categoryData = (insights?.category_distribution || [])
    .filter((c) => c.category__name)
    .map((c) => ({ name: c.category__name, count: c.count }))

  const priorityData = (insights?.priority_distribution || []).map((p) => ({
    name: PRIORITY_LABELS[p.priority] || `P${p.priority}`,
    count: p.count,
  }))

  const overview = insights?.overview || {}

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
          <Brain size={16} className="text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">AI Insights</h1>
          <p className="text-sm text-gray-500">Powered by NLP analysis of your tasks</p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Completion Rate',
            value: `${overview.completion_rate ?? 0}%`,
            icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
            sub: `${overview.completed ?? 0} of ${overview.total_tasks ?? 0}`,
          },
          {
            label: 'Last 30 Days',
            value: overview.completed_last_30_days ?? 0,
            icon: CheckCircle2,
            color: 'text-primary-400',
            bg: 'bg-primary-500/10',
            sub: 'tasks completed',
          },
          {
            label: 'Overdue',
            value: overview.overdue ?? 0,
            icon: AlertCircle,
            color: overview.overdue > 0 ? 'text-red-400' : 'text-gray-400',
            bg: overview.overdue > 0 ? 'bg-red-500/10' : 'bg-gray-500/10',
            sub: 'need attention',
          },
          {
            label: 'Total Tasks',
            value: overview.total_tasks ?? 0,
            icon: Target,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            sub: 'all time',
          },
        ].map((card, i) => (
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
            <p className="text-2xl font-bold text-white">{insightsLoading ? '—' : card.value}</p>
            <p className="text-xs text-gray-600 mt-1">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by category */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={14} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-200">Tasks by Category</h3>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryData} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a45" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No categorized tasks yet" />
          )}
        </motion.div>

        {/* Tasks by priority pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Target size={14} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-200">Tasks by Priority</h3>
          </div>
          {priorityData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx={65} cy={65}
                    innerRadius={36}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {priorityData.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-400 flex-1">{p.name}</span>
                    <span className="text-xs font-medium text-gray-300">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart label="No priority data yet" />
          )}
        </motion.div>
      </div>

      {/* AI Recommendations */}
      {insights?.recommendations?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <Zap size={12} className="text-primary-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">AI Recommendations</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.07 }}
                className={cn(
                  'p-4 rounded-xl border',
                  rec.type === 'success'
                    ? 'bg-green-500/5 border-green-500/15'
                    : rec.type === 'overdue'
                      ? 'bg-red-500/5 border-red-500/15'
                      : 'bg-primary-500/5 border-primary-500/15'
                )}
              >
                <p className={cn(
                  'text-xs font-semibold mb-1.5',
                  rec.type === 'success' ? 'text-green-400'
                    : rec.type === 'overdue' ? 'text-red-400'
                      : 'text-primary-400'
                )}>
                  {rec.title}
                </p>
                <p className="text-xs text-gray-400 leading-relaxed">{rec.message}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Status breakdown */}
      {stats?.by_status && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="card p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Clock size={14} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-200">Status Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'pending',     label: 'Pending',     color: '#64748b' },
              { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
              { key: 'blocked',     label: 'Blocked',     color: '#ef4444' },
              { key: 'completed',   label: 'Completed',   color: '#22c55e' },
            ].map((s) => {
              const count = stats.by_status[s.key] || 0
              const pct   = stats.total ? Math.round((count / stats.total) * 100) : 0
              return (
                <div key={s.key} className="p-3 rounded-xl bg-surface-hover">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-xl font-bold text-white mb-2">{count}</p>
                  <div className="w-full h-1 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">{pct}%</p>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center h-40 text-gray-600 text-sm">{label}</div>
  )
}
