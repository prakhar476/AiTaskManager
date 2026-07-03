import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/Sidebar/Sidebar'

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
