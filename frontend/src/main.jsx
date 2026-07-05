import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

// Wake up Render backend immediately on app load
setTimeout(() => {
  fetch('https://aitaskmanager-backend.onrender.com/api/docs/', {
    method: 'GET',
    mode: 'no-cors'
  }).catch(() => {})
}, 100)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min
      retry:                false,
      refetchOnWindowFocus: false,
      throwOnError:         false,
    },
    mutations: {
      throwOnError: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#16162a',
            color: '#e2e8f0',
            border: '1px solid #2a2a45',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>
)
