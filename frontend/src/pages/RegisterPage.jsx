import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Sparkles, Mail, Lock, User } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const { register: registerUser, loading } = useAuthStore()
  const [serverError, setServerError] = useState('')

  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    const payload = {
      username:   data.username,
      email:      data.email,
      password:   data.password,
      password2:  data.password2,
      first_name: data.first_name,
      last_name:  data.last_name,
    }
    const result = await registerUser(payload)
    if (!result.success) {
      const errData = result.error
      const msg = errData?.email?.[0] || errData?.username?.[0] || errData?.password?.[0] || errData?.detail || 'Registration failed.'
      setServerError(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary-500/20 border border-primary-500/30 flex items-center justify-center">
            <Sparkles size={16} className="text-primary-400" />
          </div>
          <span className="text-xl font-bold text-white">TaskAI</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1 text-center">Create account</h1>
        <p className="text-gray-500 text-sm mb-8 text-center">Start managing tasks smarter</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Alice"
              {...register('first_name')}
            />
            <Input
              label="Last name"
              placeholder="Smith"
              {...register('last_name')}
            />
          </div>

          <Input
            label="Username"
            placeholder="alicesmith"
            icon={User}
            error={errors.username?.message}
            {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'At least 3 characters' } })}
          />

          <Input
            label="Email"
            type="email"
            placeholder="alice@example.com"
            icon={Mail}
            error={errors.email?.message}
            {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'At least 8 characters' } })}
          />

          <Input
            label="Confirm password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            error={errors.password2?.message}
            {...register('password2', {
              required: 'Please confirm your password',
              validate: (v) => v === password || 'Passwords do not match',
            })}
          />

          {serverError && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {serverError}
            </p>
          )}

          <Button type="submit" variant="primary" loading={loading} className="w-full" size="lg">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
