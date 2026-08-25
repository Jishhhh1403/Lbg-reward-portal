import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BadgeCheck, Check, ExternalLink, Mail, Phone, ShieldCheck } from 'lucide-react'
import type { BrandOption } from '../../types/rewards'
import BottomSheetModal from '../ui/BottomSheetModal'
import OtpInputGroup from '../forms/OtpInputGroup'

interface LocatePointsModalProps {
  isOpen: boolean
  brandOptions: BrandOption[]
  onClose: () => void
  onVerified: (brand: BrandOption) => void
}

type Step = 'form' | 'otp' | 'done'
type ContactMethod = 'email' | 'phone'

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/25'

export default function LocatePointsModal({ isOpen, brandOptions, onClose, onVerified }: LocatePointsModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [group, setGroup] = useState<string>('All')
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null)
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [contactValue, setContactValue] = useState('')
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const groups = useMemo(
    () => ['All', ...Array.from(new Set(brandOptions.map((b) => b.category)))],
    [brandOptions],
  )
  const filteredBrands = useMemo(
    () => brandOptions.filter((b) => group === 'All' || b.category === group),
    [brandOptions, group],
  )
  const selectedBrand = brandOptions.find((b) => b.id === selectedBrandId) ?? null

  useEffect(() => {
    if (!isOpen) return
    setStep('form')
    setDigits(['', '', '', ''])
    setError('')
    setSelectedBrandId(null)
    setContactValue('')
  }, [isOpen])

  const contactValid =
    contactMethod === 'email' ? /.+@.+\..+/.test(contactValue) : /^\d{10}$/.test(contactValue.replace(/\D/g, ''))
  const otpComplete = digits.every((d) => d !== '')

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value && index < digits.length - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const next = [...digits]
      next[index - 1] = ''
      setDigits(next)
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (!text) return
    const next = text.padEnd(4, '').split('').slice(0, 4)
    setDigits(next)
    inputRefs.current[Math.min(text.length, 3)]?.focus()
  }

  return (
    <BottomSheetModal isOpen={isOpen} onClose={onClose} title="Locate your points">
      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2">
        {(['form', 'otp', 'done'] as Step[]).map((s) => (
          <motion.span
            key={s}
            animate={{ scale: step === s ? 1 : 0.85, opacity: step === s ? 1 : 0.35 }}
            className={`h-1.5 flex-1 rounded-full ${step === s ? 'bg-brand-600' : 'bg-slate-300'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-800">
              Pick a partner brand and verify your contact details — we&apos;ll locate any points you hold there and
              pull them into your wallet.
            </p>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Category</p>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setGroup(g)
                      setSelectedBrandId(null)
                    }}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                      group === g
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Partner brand</p>
              {filteredBrands.length === 0 ? (
                <p className="rounded-xl border border-slate-200 bg-white py-6 text-center text-sm text-slate-400">
                  No brands in this category.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2.5">
                  {filteredBrands.map((brand, i) => (
                    <motion.button
                      key={brand.id}
                      type="button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedBrandId(brand.id)}
                      className={`relative flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition ${
                        selectedBrandId === brand.id
                          ? 'bg-brand-50 ring-2 ring-brand-600/25'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {selectedBrandId === brand.id && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600">
                          <Check size={10} className="text-white" />
                        </span>
                      )}
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                        />
                      ) : (
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-bold text-white"
                          style={{ backgroundColor: brand.color }}
                        >
                          {brand.logoText}
                        </span>
                      )}
                      <span className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-700">
                        {brand.name}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Verify via</p>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {(
                  [
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'phone', label: 'Phone', icon: Phone },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setContactMethod(id)
                      setContactValue('')
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                      contactMethod === id ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              <input
                className={`${inputClass} mt-2`}
                placeholder={contactMethod === 'email' ? 'name@example.com' : '07xxx xxxxxx'}
                value={contactValue}
                onChange={(e) =>
                  setContactValue(
                    contactMethod === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value,
                  )
                }
              />
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!selectedBrand || !contactValid}
              onClick={() => {
                setError('')
                setStep('otp')
                setTimeout(() => inputRefs.current[0]?.focus(), 250)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send verification code <ArrowRight size={15} />
            </motion.button>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-brand-700">
              <ShieldCheck size={16} />
              <p className="text-sm font-semibold">
                Code sent {contactMethod === 'email' ? 'to your email' : `to ${contactValue}`}
              </p>
            </div>
            <OtpInputGroup
              digits={digits}
              inputRefs={inputRefs}
              handleChange={handleChange}
              handleKeyDown={handleKeyDown}
              handlePaste={handlePaste}
            />
            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={!otpComplete}
              onClick={() => {
                if (otpComplete && selectedBrand) {
                  setStep('done')
                  onVerified(selectedBrand)
                } else {
                  setError('Enter the full code to continue.')
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition enabled:hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Verify &amp; link points <ArrowRight size={15} />
            </motion.button>
            <button
              onClick={() => setStep('form')}
              className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
            >
              Change details
            </button>
          </motion.div>
        )}

        {step === 'done' && selectedBrand && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="space-y-5 pb-2 pt-3 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.05 }}
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500"
            >
              <BadgeCheck size={34} />
            </motion.span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedBrand.name} linked</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                Continue in the partner app to confirm the exact balance you want to consolidate.
              </p>
            </div>
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.assign(selectedBrand.redirectUrl ?? `https://www.${selectedBrand.name.toLowerCase().replace(/[^a-z]/g, '')}.com`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
              >
                <ExternalLink size={15} /> Continue to partner app
              </motion.button>
              <button
                onClick={onClose}
                className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheetModal>
  )
}
