import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksAPI, categoriesAPI, tagsAPI } from '@/services/api'
import toast from 'react-hot-toast'
import useTaskStore from '@/store/taskStore'

// ── Keys ─────────────────────────────────────────────────────────────────────
export const KEYS = {
  tasks:      (filters) => ['tasks', filters],
  task:       (id)      => ['tasks', id],
  stats:      ()        => ['tasks', 'stats'],
  categories: ()        => ['categories'],
  tags:       ()        => ['tags'],
}

// ── Tasks list ────────────────────────────────────────────────────────────────
export function useTasks(extraParams = {}) {
  const { filters, sortBy, sortOrder } = useTaskStore()

  const params = {}
  if (filters.status)   params.status   = filters.status
  if (filters.priority) params.priority = filters.priority
  if (filters.category) params.category = filters.category
  if (filters.search)   params.search   = filters.search
  if (filters.is_overdue) params.is_overdue = filters.is_overdue
  params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy
  Object.assign(params, extraParams)

  return useQuery({
    queryKey: KEYS.tasks(params),
    queryFn:  () => tasksAPI.list(params).then((r) => r.data),
    retry: false,
    refetchOnWindowFocus: false,
  })
}

// ── Single task ───────────────────────────────────────────────────────────────
export function useTask(id) {
  return useQuery({
    queryKey: KEYS.task(id),
    queryFn:  () => tasksAPI.get(id).then((r) => r.data),
    enabled:  !!id,
  })
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export function useTaskStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => tasksAPI.stats().then((r) => r.data),
    staleTime: 1000 * 60,
    retry: false,          // ← add this
    refetchOnWindowFocus: false,
  })
}

// ── Create ────────────────────────────────────────────────────────────────────
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => tasksAPI.create(data).then((r) => r.data),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task created — AI is analyzing it…')
    },
  })
}

// ── Update ────────────────────────────────────────────────────────────────────
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => tasksAPI.update(id, data).then((r) => r.data),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.setQueryData(KEYS.task(task.id), task)
      toast.success('Task updated')
    },
  })
}

// ── Delete ────────────────────────────────────────────────────────────────────
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => tasksAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
  })
}

// ── Bulk update ───────────────────────────────────────────────────────────────
export function useBulkUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => tasksAPI.bulkUpdate(data).then((r) => r.data),
    onSuccess: ({ updated }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`${updated} tasks updated`)
    },
  })
}

// ── Categories ────────────────────────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: KEYS.categories(),
    queryFn:  () => categoriesAPI.list().then((r) => r.data.results ?? r.data),
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

// ── Tags ──────────────────────────────────────────────────────────────────────
export function useTags() {
  return useQuery({
    queryKey: KEYS.tags(),
    queryFn:  () => tagsAPI.list().then((r) => r.data.results ?? r.data),
    staleTime: 1000 * 60 * 10,
    retry: false,
    refetchOnWindowFocus: false,
  })
}
