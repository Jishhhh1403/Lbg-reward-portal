import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppStep, BrandOption, CustomerSummary, PointsProvider } from './types/rewards'
import type { PersonaOption } from './types/sdui'
import AuthPage from './pages/AuthPage'
import BankHomePage from './pages/BankHomePage'
import RewardsDashboardPage from './pages/RewardsDashboardPage'
import SplashPage from './pages/SplashPage'
import {
  fetchBrandOptions,
  fetchCustomerDashboardById,
  fetchEarnedRewardMapByBrand,
  loginWithPassword,
  setAuthToken,
  signupCustomer,
} from './services/rewardsApi'

const EMPTY_OTP = ['', '', '', '', '', '']

export default function App() {
  /* ---------------- step + auth state ---------------- */
  const [step, setStep] = useState<AppStep>('mobile')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState<string[]>([...EMPTY_OTP])
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [signupFlow, setSignupFlow] = useState(false)

  /* ---------------- session + dashboard state ---------------- */
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [userName, setUserName] = useState('')
  const [customer, setCustomer] = useState<CustomerSummary | null>(null)
  const [pointsByBrand, setPointsByBrand] = useState<PointsProvider[]>([])
  const [brands, setBrands] = useState<BrandOption[]>([])
  const [earnedRewardMap, setEarnedRewardMap] = useState<Record<string, string>>({})

  /* Auto-login to dashboard when ?view=dashboard is present */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('view') === 'dashboard') {
      const setup = async () => {
        setIsLoading(true)
        try {
          const summary: CustomerSummary = {
            customerId: 'customer_demo',
            userName: 'Demo User',
            phone: '',
            totalLbgCoins: 15000,
            totalBrandPoints: 0,
            brandsConnected: 3,
            tier: 'Gold',
            lastSyncedAt: new Date().toISOString(),
          }
          const brandOptions = await fetchBrandOptions()
          setCustomerId('customer_demo')
          setUserName('Demo User')
          setCustomer(summary)
          setPointsByBrand([])
          setBrands(brandOptions)
          setEarnedRewardMap({})
          setStep('dashboard')
        } finally {
          setIsLoading(false)
        }
      }
      void setup()
    }
  }, [])

  /* ---------------- auth handlers ---------------- */

  const handleMobileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMobile(event.target.value.replace(/\D/g, '').slice(0, 11))
    setLoginError('')
  }

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value)
    setLoginError('')
  }

  const handleOpenPasswordStep = () => {
    // Recovery flow: verify identity by OTP first, then re-enter password.
    setLoginError('')
    setSignupFlow(false)
    setOtp([...EMPTY_OTP])
    setStep('otp')
  }

  const handleOpenSignup = () => {
    setLoginError('')
    setSignupName('')
    setSignupEmail('')
    setSignupPhone('')
    setPassword('')
    setStep('signup')
  }

  const handleBackToMobile = () => {
    setLoginError('')
    setPassword('')
    setOtp([...EMPTY_OTP])
    setSignupFlow(false)
    setStep('mobile')
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    setOtp((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
    setLoginError('')
  }

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      setOtp((prev) => {
        const next = [...prev]
        next[index - 1] = ''
        return next
      })
    }
  }

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    setOtp(text.padEnd(6, '').split('').slice(0, 6))
  }

  const handleVerifyOtp = () => {
    if (!otp.every((d) => d !== '')) {
      setLoginError('Enter the full 6-digit code to continue.')
      return
    }
    setLoginError('')
    setStep('password')
  }

  const handleSignInWithPassword = async () => {
    await authenticate(mobile, password)
  }

  /** PasswordStep submit: finishes the post-signup password set or a recovery sign-in. */
  const handlePasswordSubmit = async () => {
    const phone = signupFlow && signupPhone ? signupPhone : mobile
    await authenticate(phone, password)
  }

  const handleSignupFieldChange = (field: 'name' | 'email' | 'phone' | 'password', value: string) => {
    setLoginError('')
    if (field === 'name') setSignupName(value)
    else if (field === 'email') setSignupEmail(value)
    else if (field === 'phone') setSignupPhone(value.replace(/\D/g, '').slice(0, 11))
    else setPassword(value)
  }

  const handleSubmitSignup = async () => {
    setIsLoading(true)
    setLoginError('')
    try {
      await signupCustomer({
        name: signupName,
        email: signupEmail,
        phone: signupPhone,
        password,
      })
      setMobile(signupPhone)
      setSignupFlow(true)
      setStep('password')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not create your account.')
    } finally {
      setIsLoading(false)
    }
  }

  const authenticate = async (phone: string, pass: string) => {
    setIsLoading(true)
    setLoginError('')
    try {
      const res = await loginWithPassword(phone, pass)
      setCustomerId(res.customerId)
      setUserName(res.userName)
      setMobile(res.phone)
      setSignupFlow(false)
      await loadDashboardData(res.customerId)
      setStep('splash')
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Persona quick-login: signs in as an intelligence-layer customer. The
   * wallet summary is derived from the persona profile; the rewards dashboard
   * then personalizes around it via the QUEST-UI middleware.
   */
  const handlePersonaLogin = async (persona: PersonaOption) => {
    setIsLoading(true)
    setLoginError('')
    try {
      const summary: CustomerSummary = {
        customerId: persona.id,
        userName: persona.name,
        phone: '',
        totalLbgCoins: persona.points,
        totalBrandPoints: 0,
        brandsConnected: 3,
        tier: persona.tier as CustomerSummary['tier'],
        lastSyncedAt: new Date().toISOString(),
      }
      const brandOptions = await fetchBrandOptions()
      setCustomerId(persona.id)
      setUserName(persona.name)
      setMobile('')
      setPassword('')
      setCustomer(summary)
      setPointsByBrand([])
      setBrands(brandOptions)
      setEarnedRewardMap({})
      setStep('home')
    } finally {
      setIsLoading(false)
    }
  }

  /* Splash shows for its full progress animation, then continues to home. */
  useEffect(() => {
    if (step !== 'splash') return
    const timer = window.setTimeout(() => setStep('home'), 3000)
    return () => window.clearTimeout(timer)
  }, [step])

  const handleSignOut = useCallback(() => {
    setAuthToken(null)
    setCustomerId(null)
    setUserName('')
    setCustomer(null)
    setPointsByBrand([])
    setBrands([])
    setEarnedRewardMap({})
    setPassword('')
    setOtp([...EMPTY_OTP])
    setSignupFlow(false)
    setLoginError('')
    setStep('mobile')
  }, [])

  /* ---------------- dashboard data ---------------- */

  const loadDashboardData = async (id?: string) => {
    const targetId = id ?? customerId
    if (!targetId) return
    if (targetId.startsWith('customer_')) {
      // Intelligence-layer persona session: the persona-derived summary is the
      // source of truth, so only refresh the brand catalogue.
      const brandOptions = await fetchBrandOptions()
      setBrands(brandOptions)
      return
    }
    try {
      const [summary, brandOptions, earned] = await Promise.all([
        fetchCustomerDashboardById(targetId),
        fetchBrandOptions(),
        fetchEarnedRewardMapByBrand(targetId),
      ])
      setCustomer(summary.customer)
      setPointsByBrand(summary.pointsByBrand)
      setBrands(brandOptions)
      setEarnedRewardMap(earned)
      if (!userName && summary.customer.userName) setUserName(summary.customer.userName)
    } catch (error) {
      console.warn('[App] Dashboard load fell back to demo data:', error)
    }
  }

  /* ---------------- render ---------------- */

  const pageKey = step === 'home' ? 'home' : step === 'dashboard' ? 'dashboard' : step === 'splash' ? 'splash' : 'auth'

  const isAuth = step === 'mobile' || step === 'otp' || step === 'password' || step === 'signup'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-800 via-brand-900 to-slate-900 sm:p-6">
      <div className="relative flex h-screen w-full max-w-[430px] flex-col overflow-hidden shadow-2xl sm:h-[min(920px,94vh)]">
        <div
          className={`absolute inset-0 z-0 ${isAuth ? 'bg-black text-white' : 'bg-white text-slate-900'} rounded-[2.25rem] ring-1 ring-white/10`}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={pageKey}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="h-full relative z-10"
          >
            {(step === 'mobile' || step === 'otp' || step === 'password' || step === 'signup') && (
              <div className="no-scrollbar h-full overflow-y-auto bg-transparent">
                <div className="h-full w-full px-0 py-0">
                  <AuthPage
                    step={step}
                    mobile={mobile}
                    password={password}
                    otp={otp}
                    signupName={signupName}
                    signupEmail={signupEmail}
                    signupPhone={signupPhone}
                    isLoading={isLoading}
                    loginError={loginError}
                    onMobileChange={handleMobileChange}
                    onPasswordChange={handlePasswordChange}
                    onOtpChange={handleOtpChange}
                    onOtpKeyDown={handleOtpKeyDown}
                    onOtpPaste={handleOtpPaste}
                    onVerifyOtp={handleVerifyOtp}
                    onSignInWithPassword={handleSignInWithPassword}
                    onPasswordSubmit={handlePasswordSubmit}
                    onOpenPasswordStep={handleOpenPasswordStep}
                    onOpenSignup={handleOpenSignup}
                    onBackToMobile={handleBackToMobile}
                    onSignupFieldChange={handleSignupFieldChange}
                    onSubmitSignup={handleSubmitSignup}
                    onPersonaLogin={handlePersonaLogin}
                  />
                </div>
              </div>
            )}

            {step === 'splash' && <SplashPage />}

            {step === 'home' && userName && (
              <BankHomePage
                userName={userName}
                onOpenRewards={() => {
                  void loadDashboardData()
                  setStep('dashboard')
                }}
                onSignOut={handleSignOut}
              />
            )}

            {step === 'dashboard' && customer && (
              <RewardsDashboardPage
                customer={customer}
                pointsByBrand={pointsByBrand}
                brands={brands}
                earnedRewardMap={earnedRewardMap}
                onBackToHome={() => setStep('home')}
                onRefresh={() => loadDashboardData()}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
