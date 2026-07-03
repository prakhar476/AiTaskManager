import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { User, Mail, Lock, Brain, Save, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import useAuthStore from '@/store/authStore'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'
import { initials } from '@/utils/helpers'

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const [saving, setSaving]  = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      first_name:              user?.first_name || '',
      last_name:               user?.last_name  || '',
      bio:                     user?.bio        || '',
      ai_suggestions_enabled:  user?.ai_suggestions_enabled ?? true,
      default_priority_model:  user?.default_priority_model || 'balanced',
    },
  })

  const { register: regPw, handleSubmit: handlePwSubmit, reset: resetPw, watch,
    formState: { errors: pwErrors } } = useForm()
  const newPass = watch('new_password')

  const onSaveProfile = async (data) => {
    setSaving(true)
    try {
      const { data: updated } = await authAPI.updateProfile(data)
      updateUser(updated)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const onChangePassword = async (data) => {
    setPwSaving(true)
    try {
      await authAPI.changePassword(data)
      toast.success('Password changed successfully')
      resetPw()
    } catch (err) {
      const msg = err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Failed to change password'
      toast.error(msg)
    } finally {
      setPwSaving(false)
    }
  }

  const TABS = [
    { key: 'profile',   label: 'Profile',   icon: User },
    { key: 'ai',        label: 'AI Settings', icon: Brain },
    { key: 'security',  label: 'Security',  icon: Shield },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center text-xl font-bold text-primary-300">
          {initials(user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username || 'U')}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-hover border border-surface-border rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-surface-card text-gray-200 shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        {/* Profile tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit(onSaveProfile)} className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <User size={14} className="text-gray-500" /> Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First name" {...register('first_name')} />
              <Input label="Last name"  {...register('last_name')} />
            </div>
            <Input
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              icon={Mail}
              hint="Email cannot be changed"
            />
            <Textarea
              label="Bio"
              placeholder="Tell us about yourself…"
              rows={3}
              {...register('bio', { maxLength: { value: 500, message: 'Max 500 characters' } })}
              error={errors.bio?.message}
            />
            <Button type="submit" variant="primary" loading={saving} icon={Save}>
              Save changes
            </Button>
          </form>
        )}

        {/* AI Settings tab */}
        {activeTab === 'ai' && (
          <form onSubmit={handleSubmit(onSaveProfile)} className="card p-6 space-y-5">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Brain size={14} className="text-primary-400" /> AI Preferences
            </h2>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-hover border border-surface-border">
              <div>
                <p className="text-sm font-medium text-gray-200">AI Suggestions</p>
                <p className="text-xs text-gray-500 mt-0.5">Enable live NLP analysis as you type</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  {...register('ai_suggestions_enabled')}
                  defaultChecked={user?.ai_suggestions_enabled}
                />
                <div className="w-9 h-5 bg-surface-border peer-focus:ring-2 peer-focus:ring-primary-500/30 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500" />
              </label>
            </div>

            <Select
              label="Default Priority Model"
              {...register('default_priority_model')}
            >
              <option value="urgent">Urgent First — prioritise by urgency signals</option>
              <option value="balanced">Balanced — mix of urgency and deadline</option>
              <option value="deadline">Deadline-Based — sort by due date</option>
            </Select>

            <div className="p-4 rounded-xl bg-primary-500/5 border border-primary-500/15">
              <p className="text-xs text-gray-400 leading-relaxed">
                <span className="font-semibold text-primary-400">How AI works:</span>{' '}
                TaskAI uses spaCy NLP to extract keywords, detect urgency signals, and
                match your task to categories. Priority scoring combines keyword signals,
                deadline proximity, and your preference model.
              </p>
            </div>

            <Button type="submit" variant="primary" loading={saving} icon={Save}>
              Save preferences
            </Button>
          </form>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <form onSubmit={handlePwSubmit(onChangePassword)} className="card p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Lock size={14} className="text-gray-500" /> Change Password
            </h2>
            <Input
              label="Current password"
              type="password"
              icon={Lock}
              error={pwErrors.old_password?.message}
              {...regPw('old_password', { required: 'Current password is required' })}
            />
            <Input
              label="New password"
              type="password"
              icon={Lock}
              error={pwErrors.new_password?.message}
              {...regPw('new_password', {
                required: 'New password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
            <Input
              label="Confirm new password"
              type="password"
              icon={Lock}
              error={pwErrors.confirm?.message}
              {...regPw('confirm', {
                required: 'Please confirm',
                validate: (v) => v === newPass || 'Passwords do not match',
              })}
            />
            <Button type="submit" variant="primary" loading={pwSaving} icon={Shield}>
              Update password
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
