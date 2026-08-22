import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import OtpInputGroup from '../forms/OtpInputGroup'

interface OtpStepProps {
  mobile: string
  otp: string[]
  isLoading: boolean
  error: string
  onOtpChange: (index: number, value: string) => void
  onOtpKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void
  onOtpPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
  onVerifyOtp: () => void
  onBackToMobile: () => void
}

const RESEND_SECONDS = 30

export default function OtpStep({
  mobile,
  otp,
  isLoading,
  error,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  onVerifyOtp,
  onBackToMobile,
}: OtpStepProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)

  const isComplete = useMemo(() => otp.every((d) => d !== ''), [otp])

  useEffect(() => {
    inputRefs.current[0]?.focus()
    const timer = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-5">
      <button
        onClick={onBackToMobile}
        className="-ml-1 flex items-center gap-1 rounded-lg p-1 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verify it&apos;s you</h1>
        <p className="mt-1 text-sm text-slate-500">
          We sent a code to{' '}
          <span className="font-semibold text-slate-700">
            {mobile.length === 10
              ? mobile.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
              : mobile || 'your phone'}
          </span>
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <OtpInputGroup
        digits={otp}
        inputRefs={inputRefs}
        handleChange={onOtpChange}
        handleKeyDown={onOtpKeyDown}
        handlePaste={onOtpPaste}
      />

      <button
        onClick={onVerifyOtp}
        disabled={isLoading || !isComplete}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verifying…
          </>
        ) : (
          'Verify code'
        )}
      </button>

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Didn&apos;t get it?</span>
        {resendIn > 0 ? (
          <span className="text-slate-400">Resend in {resendIn}s</span>
        ) : (
          <button onClick={() => setResendIn(RESEND_SECONDS)} className="font-semibold text-brand-700 hover:underline">
            Resend code
          </button>
        )}
      </div>
    </div>
  )
}
