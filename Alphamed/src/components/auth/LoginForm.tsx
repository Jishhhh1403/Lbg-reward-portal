import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import SocialLoginButtons from './SocialLoginButtons'

interface LoginFormValues {
  email: string
  password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function deriveNameFromEmail(email: string): string {
  const raw = email.split('@')[0] ?? ''
  const parts = raw.split(/[._-]+/).filter(Boolean)
  const pretty = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  return pretty || 'AlphaMedicol User'
}

/** Email + password sign-in. Persists am_customer_name / am_customer_email. */
export default function LoginForm() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { email: '', password: '' } })

  const onSubmit = async (values: LoginFormValues) => {
    await new Promise((r) => setTimeout(r, 500))
    localStorage.setItem('am_customer_email', values.email)
    localStorage.setItem('am_customer_name', deriveNameFromEmail(values.email))
    navigate('/dashboard', {
      state: { email: values.email, userName: deriveNameFromEmail(values.email) },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField
          label="Email address"
          type="email"
          fullWidth
          size="small"
          error={Boolean(errors.email)}
          helperText={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
          })}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          size="small"
          error={Boolean(errors.password)}
          helperText={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Minimum 6 characters' },
          })}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Stack>
      <SocialLoginButtons />
    </form>
  )
}
