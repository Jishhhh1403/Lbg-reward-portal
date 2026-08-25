import { Link as RouterLink } from 'react-router-dom'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import AuthScreenLayout from '../components/layout/AuthScreenLayout'
import LoginForm from '../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthScreenLayout
      title="Welcome back"
      subtitle="Sign in to manage your medical services and rewards."
      footer={
        <Typography variant="body2" color="text.secondary">
          New to AlphaMedicol?{' '}
          <Link component={RouterLink} to="/signup" fontWeight={700}>
            Create an account
          </Link>
        </Typography>
      }
    >
      <LoginForm />
      <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
        <Link component={RouterLink} to="/forgot-password" fontWeight={600}>
          Forgot password?
        </Link>
      </Typography>
    </AuthScreenLayout>
  )
}
