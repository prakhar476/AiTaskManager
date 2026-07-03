import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { X, Brain, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { AIInsightPanel } from '@/components/AIPanel/AIInsightPanel'
import { useCreateTask, useUpdateTask, useCategories, useTags } from '@/hooks/useTasks'
import { useAIAnalysis } from '@/hooks/useAI'

const PRIORITIES = [
  { value: 1, label: '🔴 Critical' },
  { value: 2, label: '🟠 High' },
  { value: 3, label: '🟡 Medium' },
  { value: 4, label: '🔵 Low' },
  { value: 5, label: '⚪ Minimal' },
]

const STATUSES = [
  { value: 'pending',     label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked',     label: 'Blocked' },
  { value: 'completed',   label: 'Completed' },
]

export default function TaskForm({ task = null, onClose, onSuccess }) {
  const isEditing = !!task
  const { mutate: createTask, isPending: creating } = useCreateTask()
  const { mutate: updateTask, isPending: updating } = useUpdateTask()
  const { data: categories = [] } = useCategories()
  const { data: tags = [] } = useTags()

  const {
    register, handleSubmit, watch,
    formState: { errors }, setValue, reset
  } = useForm({
    defaultValues: {
      title:              task?.title || '',
      description:        task?.description || '',
      priority:           task?.priority || 3,
      status:             task?.status || 'pending',
      category:           task?.category || '',
      due_date:           task?.due_date ? task.due_date.slice(0, 16) : '',
      estimated_minutes:  task?.estimated_minutes || '',
    }
  })

  const watchTitle = watch('title')
  const watchDesc  = watch('description')

  // Live AI analysis
  const { data: aiAnalysis, isFetching: aiLoading } = useAIAnalysis(watchTitle, watchDesc)

  // Auto-apply AI suggestion for category
  useEffect(() => {
    if (aiAnalysis?.category?.suggested && !isEditing) {
      const match = categories.find((c) => c.name === aiAnalysis.category.suggested)
      if (match) setValue('category', match.id)
    }
  }, [aiAnalysis, categories, isEditing, setValue])

  const onSubmit = (data) => {
    const payload = {
      ...data,
      priority:          Number(data.priority),
      category:          data.category || null,
      due_date:          data.due_date || null,
      estimated_minutes: data.estimated_minutes ? Number(data.estimated_minutes) : null,
    }

    if (isEditing) {
      updateTask(
        { id: task.id, data: payload },
        { onSuccess: () => { onSuccess?.(); onClose?.() } }
      )
    } else {
      createTask(payload, { onSuccess: () => { reset(); onSuccess?.(); onClose?.() } })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <Input
        label="Task title"
        placeholder="What needs to be done?"
        error={errors.title?.message}
        {...register('title', { required: 'Title is required', minLength: { value: 3, message: 'At least 3 characters' } })}
      />

      {/* AI Panel — live feedback */}
      <AIInsightPanel
        analysis={aiAnalysis}
        isLoading={aiLoading}
        title={watchTitle}
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Add details, context, or acceptance criteria…"
        rows={3}
        {...register('description')}
      />

      {/* Row: Priority + Status */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Priority" {...register('priority')}>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>

        <Select label="Status" {...register('status')}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      </div>

      {/* Row: Category + Due date */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Category" {...register('category')}>
          <option value="">Auto (AI will assign)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>

        <Input
          label="Due date"
          type="datetime-local"
          {...register('due_date')}
        />
      </div>

      {/* Estimated time */}
      <Input
        label="Estimated time (minutes)"
        type="number"
        placeholder="e.g. 60"
        {...register('estimated_minutes', { min: { value: 1, message: 'Must be at least 1' } })}
        error={errors.estimated_minutes?.message}
      />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={creating || updating}
          className="flex-1"
        >
          {isEditing ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  )
}
