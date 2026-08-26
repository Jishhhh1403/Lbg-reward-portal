import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import AuthScreenLayout from '../components/layout/AuthScreenLayout'

interface ForgotValues {
  email: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>()

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500))
    setSent(true)
  }

  return (
    <AuthScreenLayout
      title="Reset password"
      subtitle="Enter your email and we'll send reset instructions."
      footer={
        <Typography variant="body2" color="text.secondary">
          <Link
            component={RouterLink}
            to="/login"
            fontWeight={700}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <ArrowBackIosNewIcon sx={{ fontSize: 11 }} /> Back to sign in
          </Link>
        </Typography>
      }
    >
      {sent ? (
        <Alert severity="success" variant="outlined">
          If an account exists for that email, reset instructions are on the way.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
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
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </Stack>
        </form>
      )}
    </AuthScreenLayout>
  )
}
