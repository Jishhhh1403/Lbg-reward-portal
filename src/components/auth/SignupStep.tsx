import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface SignupStepProps {
  name: string
  email: string
  phone: string
  password: string
  isLoading: boolean
  error: string
  onFieldChange: (field: 'name' | 'email' | 'phone' | 'password', value: string) => void
  onSubmitSignup: () => void
  onBackToMobile: () => void
}

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25'

export default function SignupStep({
  name,
  email,
  phone,
  password,
  isLoading,
  error,
  onFieldChange,
  onSubmitSignup,
  onBackToMobile,
}: SignupStepProps) {
  const [touched, setTouched] = useState(false)
  const valid =
    name.trim().length >= 2 && /.+@.+\..+/.test(email) && phone.length === 10 && password.length >= 8

  return (
    <div className="space-y-5">
      <button
        onClick={onBackToMobile}
        className="-ml-1 flex items-center gap-1 rounded-lg p-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back to sign in
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
        <p className="mt-1 text-sm text-slate-500">Join Unified Rewards in under a minute</p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          setTouched(true)
          if (valid && !isLoading) onSubmitSignup()
        }}
        className="space-y-3.5"
      >
        <input
          className={inputClass}
          placeholder="Full name"
          autoComplete="name"
          value={name}
          onChange={(e) => onFieldChange('name', e.target.value)}
        />
        <input
          className={inputClass}
          type="email"
          placeholder="Email address"
          autoComplete="email"
          value={email}
          onChange={(e) => onFieldChange('email', e.target.value)}
        />
        <input
          className={inputClass}
          type="tel"
          inputMode="numeric"
          placeholder="Phone number (10 digits)"
          value={phone}
          onChange={(e) => onFieldChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
        />
        <div>
          <input
            className={inputClass}
            type="password"
            placeholder="Password (min. 8 characters)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => onFieldChange('password', e.target.value)}
          />
          {touched && password.length > 0 && password.length < 8 && (
            <p className="mt-1 text-xs text-slate-500">Password must be at least 8 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (touched && !valid)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating account…
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      <p className="px-2 text-center text-xs leading-relaxed text-slate-400">
        By continuing you agree to the Unified Rewards terms and privacy policy.
      </p>
    </div>
  )
}
