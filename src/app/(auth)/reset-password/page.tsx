'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function ResetPasswordForm() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800 font-medium">Invalid reset link</p>
          <p className="text-xs text-red-700 mt-1">This link is missing a token. Please request a new one.</p>
        </div>
        <a href="/forgot-password" className="block text-sm text-blue-700 hover:underline">Request new link</a>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">Password updated</p>
          <p className="text-xs text-green-700 mt-1">Redirecting you to sign in…</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          placeholder="Repeat new password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? 'Updating…' : 'Set new password'}
      </button>

      <a href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">Back to sign in</a>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Winton Pre-School</h1>
          <p className="text-sm text-gray-500 mt-1">Set a new password</p>
        </div>
        <Suspense fallback={<div className="text-sm text-gray-400 text-center">Loading…</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
