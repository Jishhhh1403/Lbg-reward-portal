import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import RootEntryRoute from '../pages/RootEntryRoute'
import LoginPage from '../pages/LoginPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import SignUpPage from '../pages/SignUpPage'
import DashboardPage from '../pages/DashboardPage'
import LbgRewardsConvertPage from '../pages/LbgRewardsConvertPage'
import LbgRewardsSuccessPage from '../pages/LbgRewardsSuccessPage'

/**
 * Single source of truth for navigation.
 *
 * /                      -> deep-link entry (query params -> route state) -> /dashboard
 * /login|/forgot-password|/signup
 * /dashboard             -> main authenticated view
 * /lbg-rewards/convert   -> AlphaMedicol Points -> LBG Coins conversion
 * /lbg-rewards/success   -> transfer confirmation (+ back to Unified Rewards)
 */
export default function AppRoutes() {
  const location = useLocation()

  return (
    <Routes location={location}>
      <Route path="/" element={<RootEntryRoute />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/lbg-rewards/convert" element={<LbgRewardsConvertPage />} />
      <Route path="/lbg-rewards/success" element={<LbgRewardsSuccessPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
