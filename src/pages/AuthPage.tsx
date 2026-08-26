import { AnimatePresence, motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import type { AppStep } from '../types/rewards'
import type { PersonaOption } from '../types/sdui'
import OtpStep from '../components/auth/OtpStep'
import PasswordStep from '../components/auth/PasswordStep'
import SignupStep from '../components/auth/SignupStep'

interface AuthPageProps {
  step: Extract<AppStep, 'mobile' | 'otp' | 'password' | 'signup'>
  mobile: string
  password: string
  otp: string[]
  signupName: string
  signupEmail: string
  signupPhone: string
  isLoading: boolean
  loginError: string
  onMobileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onOtpChange: (index: number, value: string) => void
  onOtpKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void
  onOtpPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
  onVerifyOtp: () => void
  onSignInWithPassword: () => void
  onPasswordSubmit: () => void
  onOpenPasswordStep: () => void
  onOpenSignup: () => void
  onBackToMobile: () => void
  onSignupFieldChange: (field: 'name' | 'email' | 'phone' | 'password', value: string) => void
  onSubmitSignup: () => void
  onPersonaLogin: (persona: PersonaOption) => void
}

const variants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
}

export default function AuthPage(props: AuthPageProps) {
  const { step } = props

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Dark header */}
      <div className="px-6 pb-6 pt-8 text-center relative">
        <h1 className="text-lg font-semibold text-white mt-5 ">Log on</h1>
          <div className="absolute right-6 top-6 h-9 w-9 rounded-full border border-white/30 bg-white/5 flex items-center justify-center mt-5">
            <Phone size={14} className="text-white/70" />
          </div>
      </div>

      {/* Card (dark) */}
      <motion.div
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="no-scrollbar relative -mt-4 flex-1 overflow-y-auto rounded-t-3xl bg-black px-6 pb-8 pt-4"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {step === 'mobile' && (
              <div className="max-w-lg mx-auto space-y-4">
                <div className="text-center">
                 
                  <p className="text-sm text-slate-300" style={{fontSize: '1rem'}}>Please enter your logon details.</p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    props.onSignInWithPassword()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <input
                      id="user"
                      type="text"
                      placeholder="User ID"
                      value={props.mobile}
                      onChange={props.onMobileChange}
                      className="w-full rounded-xl border border-slate-700 bg-transparent py-3 px-4 text-sm text-white placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  <div>
                    <input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={props.password}
                      onChange={props.onPasswordChange}
                      className="w-full rounded-xl border border-slate-700 bg-transparent py-3 px-4 text-sm text-white placeholder:text-slate-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800/60 py-3.5 text-sm font-semibold text-slate-300 disabled:cursor-not-allowed disabled:opacity-50" style={{fontSize: '1rem'}}
                  >
                    Continue
                  </button>
                </form>

                {props.loginError && (
                  <p className="text-sm text-red-400 text-center">{props.loginError}</p>
                )}

                <div className="pt-2 text-center text-sm text-slate-300" style={{fontSize: '1rem'}}>I've forgotten my logon details</div>

                <div className="h-6 sm:h-8" />
                <div className="mt-22 border-t border-slate-500 pt-6 text-center text-slate-300 space-y-4">
                  <h2 className="text-lg font-semibold text-slate-100">Not used Internet Banking with us before?</h2>
                  <div className="max-w-xl mx-auto text-sm text-slate-400 flex items-start gap-3">
                    {/* <Lock size={18} className="mt-1 text-lime-400 flex-shrink-0" /> */}
                    <p>If you bank with us, you can manage your accounts online. First, you'll need to create your logon details.</p>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={props.onOpenSignup}
                      className="mt-4 inline-block w-64 rounded-full bg-green-500 py-3 text-sm font-semibold text-black"
                    >
                      Create logon details
                    </button>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-500 pt-6 text-center text-slate-300 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-slate-400">Quick demo</p>
                  <p className="text-[11px] text-slate-500">Tap a persona to explore the rewards dashboard instantly.</p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {([
                      { id: 'p_high', name: 'High Earner', points: 28500, tier: 'Platinum' },
                      { id: 'p_mid', name: 'Active Saver', points: 9800, tier: 'Gold' },
                      { id: 'p_low', name: 'New Member', points: 1200, tier: 'Silver' },
                    ] as const).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => props.onPersonaLogin(p)}
                        className="rounded-lg border border-slate-600 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {step === 'otp' && (
              <OtpStep
                mobile={props.mobile}
                otp={props.otp}
                isLoading={props.isLoading}
                error={props.loginError}
                onOtpChange={props.onOtpChange}
                onOtpKeyDown={props.onOtpKeyDown}
                onOtpPaste={props.onOtpPaste}
                onVerifyOtp={props.onVerifyOtp}
                onBackToMobile={props.onBackToMobile}
              />
            )}
            {step === 'password' && (
              <PasswordStep
                mobile={props.mobile}
                password={props.password}
                isLoading={props.isLoading}
                error={props.loginError}
                submitLabel="Set password"
                onPasswordChange={props.onPasswordChange}
                onSubmit={props.onPasswordSubmit}
                onBack={props.onBackToMobile}
              />
            )}
            {step === 'signup' && (
              <SignupStep
                name={props.signupName}
                email={props.signupEmail}
                phone={props.signupPhone}
                password={props.password}
                isLoading={props.isLoading}
                error={props.loginError}
                onFieldChange={props.onSignupFieldChange}
                onSubmitSignup={props.onSubmitSignup}
                onBackToMobile={props.onBackToMobile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export type { AuthPageProps }
