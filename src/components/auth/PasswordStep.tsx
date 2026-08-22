import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from 'lucide-react'

interface PasswordStepProps {
  mobile: string
  password: string
  isLoading: boolean
  error: string
  submitLabel?: string
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: () => void
  onBack: () => void
}

export default function PasswordStep({
  mobile,
  password,
  isLoading,
  error,
  submitLabel = 'Continue',
  onPasswordChange,
  onSubmit,
  onBack,
}: PasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="-ml-1 flex items-center gap-1 rounded-lg p-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Enter password</h1>
        <p className="mt-1 text-sm text-slate-500">
          For account ending{' '}
          <span className="font-semibold text-slate-700">{mobile.slice(-4) || '••••'}</span>
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!isLoading && password.length > 0) onSubmit()
        }}
        className="space-y-4"
      >
        <div className="relative">
          <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            autoFocus
            autoComplete={submitLabel === 'Set password' ? 'new-password' : 'current-password'}
            placeholder="Password"
            value={password}
            onChange={onPasswordChange}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-700"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading || password.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Please wait…
            </>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  )
}
