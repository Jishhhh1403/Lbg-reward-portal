import { forwardRef } from 'react'
import { motion } from 'framer-motion'

interface OtpInputGroupProps {
  digits: string[]
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  handleChange: (index: number, value: string) => void
  handleKeyDown: (index: number, event: React.KeyboardEvent<HTMLInputElement>) => void
  handlePaste: (event: React.ClipboardEvent<HTMLInputElement>) => void
}

const OtpInputGroup = forwardRef<HTMLInputElement, OtpInputGroupProps>(
  ({ digits, inputRefs, handleChange, handleKeyDown, handlePaste }, _ref) => {
    return (
      <div className="flex justify-between gap-2" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <motion.input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            initial={false}
            whileFocus={{ scale: 1.05 }}
            className={`otp-input ${digit ? 'border-brand-600' : ''}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>
    )
  },
)

OtpInputGroup.displayName = 'OtpInputGroup'
export default OtpInputGroup
