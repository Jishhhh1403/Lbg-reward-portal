import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AuthScreenLayout from '../components/layout/AuthScreenLayout'

interface SignUpValues {
  fullName: string
  email: string
  phone: string
  password: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignUpPage() {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>()

  const onSubmit = async (values: SignUpValues) => {
    await new Promise((r) => setTimeout(r, 500))
    localStorage.setItem('am_customer_name', values.fullName)
    localStorage.setItem('am_customer_email', values.email)
    const digits = values.phone.replace(/\D/g, '').slice(-10)
    if (digits.length === 10) {
      localStorage.setItem('am_customer_phone', digits)
    }
    navigate('/dashboard', {
      state: { email: values.email, userName: values.fullName },
    })
  }

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Book appointments and convert your rewards in one place."
      footer={
        <Typography variant="body2" color="text.secondary">
          Already registered?{' '}
          <Link component={RouterLink} to="/login" fontWeight={700}>
            Sign in
          </Link>
        </Typography>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={2}>
          <TextField
            label="Full name"
            size="small"
            fullWidth
            error={Boolean(errors.fullName)}
            helperText={errors.fullName?.message}
            {...register('fullName', { required: 'Name is required' })}
          />
          <TextField
            label="Email address"
            type="email"
            size="small"
            fullWidth
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email' },
            })}
          />
          <TextField
            label="Phone number"
            type="tel"
            size="small"
            fullWidth
            error={Boolean(errors.phone)}
            helperText={errors.phone?.message}
            {...register('phone', {
              required: 'Phone is required',
              minLength: { value: 10, message: 'Enter 10 digits' },
            })}
          />
          <TextField
            label="Password"
            type="password"
            size="small"
            fullWidth
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' },
            })}
          />
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        </Stack>
      </form>
    </AuthScreenLayout>
  )
}
