import { AnimatePresence, motion } from 'framer-motion'
import type { AppStep } from '../types/rewards'
import MobileStep from '../components/auth/MobileStep'
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
      {/* Decorative header */}
      <div className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-6 pb-16 pt-12 text-white">
        <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-10 right-10 h-28 w-28 rounded-full bg-white/5" />
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-black backdrop-blur">
            UR
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-100">Unified Rewards</p>
            <p className="text-xs text-brand-200">One wallet. Every brand.</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <motion.div
        initial={{ y: 36, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="no-scrollbar relative -mt-10 flex-1 overflow-y-auto rounded-t-3xl bg-white px-6 pb-8 pt-7 shadow-card"
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
              <MobileStep
                mobile={props.mobile}
                password={props.password}
                loginError={props.loginError}
                isLoading={props.isLoading}
                onMobileChange={props.onMobileChange}
                onPasswordChange={props.onPasswordChange}
                onSignInWithPassword={props.onSignInWithPassword}
                onOpenPasswordStep={props.onOpenPasswordStep}
                onOpenSignup={props.onOpenSignup}
              />
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
