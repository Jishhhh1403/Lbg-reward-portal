import { Eye, EyeOff, Loader2, Phone, Lock, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fetchPersonaOptions } from '../../services/experienceApi'
import type { PersonaOption } from '../../types/sdui'

interface MobileStepProps {
  mobile: string
  password: string
  loginError: string
  isLoading: boolean
  onMobileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onSignInWithPassword: () => void
  onOpenPasswordStep: () => void
  onOpenSignup: () => void
  onPersonaLogin: (persona: PersonaOption) => void
}

export default function MobileStep({
  mobile,
  password,
  loginError,
  isLoading,
  onMobileChange,
  onPasswordChange,
  onSignInWithPassword,
  onOpenPasswordStep,
  onOpenSignup,
  onPersonaLogin,
}: MobileStepProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [personas, setPersonas] = useState<PersonaOption[]>([])

  useEffect(() => {
    let cancelled = false
    fetchPersonaOptions().then((options) => {
      if (!cancelled && options) setPersonas(options)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = mobile.length === 10 && password.length > 0 && !isLoading

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to your rewards account</p>
      </div>

      {loginError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {loginError}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit) onSignInWithPassword()
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="mobile" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number
          </label>
          <div className="relative">
            <Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="mobile"
              type="tel"
              inputMode="numeric"
              autoComplete="username"
              placeholder="07xxx xxxxxx"
              value={mobile}
              onChange={onMobileChange}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25"
            />
          </div>
          {mobile.length > 0 && mobile.length !== 10 && (
            <p className="mt-1 text-xs text-slate-500">{10 - mobile.length} more digit(s) needed</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
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
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="flex items-center justify-between pt-1 text-sm">
        <button onClick={onOpenPasswordStep} className="font-medium text-brand-700 hover:underline">
          Forgot password?
        </button>
        <button onClick={onOpenSignup} className="font-semibold text-brand-700 hover:underline">
          Create account
        </button>
      </div>

      {personas.length > 0 && (
        <div className="pt-3">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <Sparkles size={13} className="text-brand-600" />
            Demo personas
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="mt-2 text-center text-xs text-slate-500">
            Sign in as an intelligence-layer persona — the rewards portal personalizes around their behaviour.
          </p>
          <div className="mt-3 grid gap-2">
            {personas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                disabled={isLoading}
                onClick={() => onPersonaLogin(persona)}
                className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-2.5 text-left transition enabled:hover:border-brand-300 enabled:hover:bg-brand-100/70 disabled:opacity-50"
              >
                <span>
                  <span className="block text-sm font-semibold text-brand-900">{persona.name}</span>
                  <span className="block text-xs text-slate-500">{persona.tier} member</span>
                </span>
                <span className="text-sm font-bold text-brand-700">
                  {persona.points.toLocaleString()} pts
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
