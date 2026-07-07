'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-900">Winton Pre-School</h1>
          <p className="text-sm text-gray-500 mt-1">Reset your password</p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">Check your email</p>
              <p className="text-xs text-green-700 mt-1">If an account exists for {email}, a reset link has been sent.</p>
            </div>
            <a href="/login" className="block text-sm text-blue-700 hover:underline">Back to sign in</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white font-medium py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <a href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-700">Back to sign in</a>
          </form>
        )}
      </div>
    </div>
  )
}
