import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:    null,
      isAuthenticated: false,
      loading: false,

      login: async (credentials) => {
        set({ loading: true })
        try {
          const { data } = await authAPI.login(credentials)
          localStorage.setItem('access_token',  data.access)
          localStorage.setItem('refresh_token', data.refresh)
          set({ user: data.user, isAuthenticated: true, loading: false })
          toast.success(`Welcome back, ${data.user.first_name || data.user.username}!`)
          return { success: true }
        } catch (err) {
          set({ loading: false })
          return { success: false, error: err.response?.data }
        }
      },

      register: async (userData) => {
        set({ loading: true })
        try {
          const { data } = await authAPI.register(userData)
          localStorage.setItem('access_token',  data.tokens.access)
          localStorage.setItem('refresh_token', data.tokens.refresh)
          set({ user: data.user, isAuthenticated: true, loading: false })
          toast.success('Account created! Welcome to TaskAI 🚀')
          return { success: true }
        } catch (err) {
          set({ loading: false })
          return { success: false, error: err.response?.data }
        }
      },

      logout: async () => {
        const refresh = localStorage.getItem('refresh_token')
        try { await authAPI.logout(refresh) } catch { /* silent */ }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, isAuthenticated: false })
        toast.success('Logged out successfully')
      },

      refreshProfile: async () => {
        try {
          const { data } = await authAPI.profile()
          set({ user: data })
        } catch { /* silent */ }
      },

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
