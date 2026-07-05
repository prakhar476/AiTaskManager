import axios from 'axios'
import toast from 'react-hot-toast'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://aitaskmanager-backend.onrender.com/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/login'
      }
    }

    // Don't show toast for 404s or background AI/stats queries
    const url = original?.url || ''
    const is404 = error.response?.status === 404
    const isBackground = url.includes('/ai/') || url.includes('/stats/') || url.includes('/insights/')
    const is401 = error.response?.status === 401

    if (!is401 && !is404 && !isBackground) {
      const message = error.response?.data?.detail
        || error.response?.data?.message
        || error.response?.data?.error
        || 'Something went wrong'
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

// ── Auth endpoints ────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)        => api.post('/auth/register/', data),
  login:    (data)        => api.post('/auth/login/', data),
  logout:   (refresh)     => api.post('/auth/logout/', { refresh }),
  profile:  ()            => api.get('/auth/profile/'),
  updateProfile: (data)   => api.patch('/auth/profile/', data),
  changePassword: (data)  => api.put('/auth/change-password/', data),
}

// ── Task endpoints ────────────────────────────────────────────────────────────
export const tasksAPI = {
  list:        (params)   => api.get('/tasks/', { params }),
  create:      (data)     => api.post('/tasks/', data),
  get:         (id)       => api.get(`/tasks/${id}/`),
  update:      (id, data) => api.patch(`/tasks/${id}/`, data),
  delete:      (id)       => api.delete(`/tasks/${id}/`),
  bulkUpdate:  (data)     => api.post('/tasks/bulk_update/', data),
  stats:       ()         => api.get('/tasks/stats/'),
  addComment:  (id, data) => api.post(`/tasks/${id}/add_comment/`, data),
  activity:    (id)       => api.get(`/tasks/${id}/activity/`),
  reprocessAI: (id)       => api.post(`/tasks/${id}/reprocess_ai/`),
}

// ── Category & Tag endpoints ──────────────────────────────────────────────────
export const categoriesAPI = {
  list:   ()          => api.get('/tasks/categories/'),
  create: (data)      => api.post('/tasks/categories/', data),
  update: (id, data)  => api.patch(`/tasks/categories/${id}/`, data),
  delete: (id)        => api.delete(`/tasks/categories/${id}/`),
}

export const tagsAPI = {
  list:   ()          => api.get('/tasks/tags/'),
  create: (data)      => api.post('/tasks/tags/', data),
  delete: (id)        => api.delete(`/tasks/tags/${id}/`),
}

// ── AI endpoints ──────────────────────────────────────────────────────────────
export const aiAPI = {
  analyze:     (data) => api.post('/ai/analyze/', data),
  suggestions: (data) => api.post('/ai/suggestions/', data),
  insights:    ()     => api.get('/ai/insights/'),
  batchAnalyze:(data) => api.post('/ai/batch-analyze/', data),
}

export default api
