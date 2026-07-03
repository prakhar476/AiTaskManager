import { create } from 'zustand'

const useTaskStore = create((set, get) => ({
  // ── Filter / View State ──────────────────────────────────────────────────
  filters: {
    status:   '',
    priority: '',
    category: '',
    search:   '',
    due_before: '',
    is_overdue: '',
  },
  view:       'board',   // 'board' | 'list' | 'calendar'
  sortBy:     'priority',
  sortOrder:  'asc',

  // ── Selected tasks (for bulk ops) ────────────────────────────────────────
  selectedIds: new Set(),

  // ── Active task for detail panel ─────────────────────────────────────────
  activeTaskId: null,

  // ── AI panel open ────────────────────────────────────────────────────────
  aiPanelOpen: false,
  aiAnalysis:  null,

  // ── Actions ──────────────────────────────────────────────────────────────
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  clearFilters: () =>
    set({ filters: { status: '', priority: '', category: '', search: '', due_before: '', is_overdue: '' } }),

  setView:    (view)    => set({ view }),
  setSortBy:  (sortBy)  => set({ sortBy }),

  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedIds: next }
    }),

  clearSelected: () => set({ selectedIds: new Set() }),

  selectAll: (ids) => set({ selectedIds: new Set(ids) }),

  setActiveTask: (id)  => set({ activeTaskId: id }),
  closeTask:     ()    => set({ activeTaskId: null }),

  openAIPanel:  (analysis) => set({ aiPanelOpen: true, aiAnalysis: analysis }),
  closeAIPanel: ()          => set({ aiPanelOpen: false, aiAnalysis: null }),
}))

export default useTaskStore
