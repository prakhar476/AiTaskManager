import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Tag, Zap, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn, getAIScoreLabel, getAIScoreColor } from '@/utils/helpers'
import { useState } from 'react'

export function AIInsightPanel({ analysis, isLoading, title }) {
  const [expanded, setExpanded] = useState(true)

  if (!title || title.length < 4) return null

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-primary-500/20 bg-primary-500/5 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <div className="w-5 h-5 rounded-md bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          {isLoading
            ? <Loader2 size={11} className="text-primary-400 animate-spin" />
            : <Brain size={11} className="text-primary-400" />
          }
        </div>
        <span className="text-xs font-semibold text-primary-300 flex-1">
          {isLoading ? 'AI is analyzing…' : 'AI Insights'}
        </span>
        {expanded ? <ChevronUp size={13} className="text-gray-500" /> : <ChevronDown size={13} className="text-gray-500" />}
      </button>

      <AnimatePresence>
        {expanded && analysis && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4 space-y-3"
          >
            {/* Category suggestion */}
            {analysis.category && (
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">Category</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: analysis.category.color,
                      backgroundColor: analysis.category.color + '20',
                    }}
                  >
                    {analysis.category.suggested}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {Math.round((analysis.category.confidence || 0) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {/* Priority score */}
            {analysis.priority && (
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-gray-500 flex-shrink-0" />
                <span className="text-xs text-gray-500">Priority score</span>
                <div className="flex items-center gap-2 ml-auto">
                  <div className="w-20 h-1.5 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(analysis.priority.score || 0) * 100}%`,
                        backgroundColor: getScoreBarColor(analysis.priority.score),
                      }}
                    />
                  </div>
                  <span className={cn('text-xs font-medium', getAIScoreColor(analysis.priority.score))}>
                    {getAIScoreLabel(analysis.priority.score)}
                  </span>
                </div>
              </div>
            )}

            {/* Keywords */}
            {analysis.keywords?.length > 0 && (
              <div className="flex items-start gap-2">
                <TrendingUp size={12} className="text-gray-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-500 flex-shrink-0">Keywords</span>
                <div className="flex flex-wrap gap-1 ml-auto">
                  {analysis.keywords.slice(0, 5).map((kw) => (
                    <span key={kw} className="text-[10px] bg-surface-border text-gray-400 px-1.5 py-0.5 rounded-md">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions?.length > 0 && (
              <div className="pt-2 border-t border-primary-500/10 space-y-1.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  <Lightbulb size={10} /> Smart Suggestions
                </p>
                {analysis.suggestions.map((s, i) => (
                  <SuggestionItem key={i} suggestion={s} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SuggestionItem({ suggestion }) {
  const { type, content, value } = suggestion

  if (type === 'time_estimate') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="w-1 h-1 bg-primary-500 rounded-full flex-shrink-0" />
        <span>{content}</span>
      </div>
    )
  }

  if (type === 'subtasks' && Array.isArray(value)) {
    return (
      <div className="space-y-1">
        <p className="text-xs text-gray-500">{content}:</p>
        {value.slice(0, 3).map((st, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400 pl-2">
            <span className="text-gray-600">→</span> {st}
          </div>
        ))}
      </div>
    )
  }

  if (type === 'tags' && Array.isArray(value)) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-gray-500">Suggested tags:</span>
        {value.map((tag) => (
          <span key={tag} className="text-[10px] text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded-md">
            #{tag}
          </span>
        ))}
      </div>
    )
  }

  return null
}

function getScoreBarColor(score) {
  if (score >= 0.7) return '#ef4444'
  if (score >= 0.5) return '#f97316'
  if (score >= 0.3) return '#eab308'
  return '#22c55e'
}
