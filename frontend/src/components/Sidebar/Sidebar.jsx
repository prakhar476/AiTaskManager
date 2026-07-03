import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CheckSquare, BarChart3, User,
  LogOut, Sparkles, Brain, ChevronRight
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { cn, initials } from '@/utils/helpers'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks'     },
  { to: '/insights',  icon: Brain,           label: 'AI Insights'},
  { to: '/profile',   icon: User,            label: 'Profile'   },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-surface-card border-r border-surface-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <Sparkles size={15} className="text-primary-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">TaskAI</h1>
            <p className="text-[10px] text-gray-500">Powered by NLP</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
              isActive
                ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                : 'text-gray-500 hover:text-gray-200 hover:bg-surface-hover'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-gray-300'} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-primary-400/60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-surface-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-hover">
          <div className="w-7 h-7 rounded-lg bg-primary-500/30 flex items-center justify-center text-xs font-bold text-primary-300 flex-shrink-0">
            {initials(user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'U')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">
              {user?.first_name || user?.username}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-150"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  )
}
