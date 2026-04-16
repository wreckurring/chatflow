import { useState } from 'react'
import { login, register } from '../api/auth'
import { useAuth } from '../store/authStore'
import { Button } from '../components/shared/Button'
import { Input } from '../components/shared/Input'

export function AuthPage() {
  const { signIn } = useAuth()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = tab === 'login'
        ? await login({ username: form.username, password: form.password })
        : await register({ username: form.username, email: form.email, password: form.password, displayName: form.displayName || undefined })
      signIn(data)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-surface">
      {/* subtle grid bg */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20x%3D%220.5%22%20y%3D%220.5%22%20width%3D%2239%22%20height%3D%2239%22%20stroke%3D%22%2327272F%22%20stroke-opacity%3D%220.5%22/%3E%3C/svg%3E')] opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-md bg-accent-subtle border border-accent/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <span className="text-ink font-semibold tracking-tight text-lg">chatflow</span>
          </div>
          <p className="text-ink-muted text-xs">real-time messaging, minimal by design</p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-border rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-surface-2 rounded-lg p-1">
            {['login', 'register'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${
                  tab === t ? 'bg-surface-3 text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="mohit"
              value={form.username}
              onChange={set('username')}
              required
              autoFocus
            />

            {tab === 'register' && (
              <>
                <Input
                  label="Email"
                  type="email"
                  placeholder="mohit@example.com"
                  value={form.email}
                  onChange={set('email')}
                  required
                />
                <Input
                  label="Display name"
                  placeholder="Mohit Kumar  (optional)"
                  value={form.displayName}
                  onChange={set('displayName')}
                />
              </>
            )}

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />

            {error && (
              <p className="text-xs text-danger bg-danger-subtle border border-danger/20 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              {tab === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-2xs text-ink-faint mt-5">
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setTab(t => t === 'login' ? 'register' : 'login'); setError('') }} className="text-ink-muted hover:text-ink transition-colors underline-offset-2 hover:underline">
            {tab === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
