import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import AboutStrip from './components/AboutStrip'
import CustomerReviews from './components/CustomerReviews'
import ExpertReviews from './components/ExpertReviews'
import WhyChoose from './components/WhyChoose'
import LatestNews from './components/LatestNews'
import Team from './components/Team'
import PolicyPage from './components/PolicyPage'
import CheckoutPage from './components/CheckoutPage'
import PaymentSuccessPage from './components/PaymentSuccessPage'
import {
  CriticalIllnessStrip,
  IncomeProtectionStrip,
  LifeInsuranceStrip,
} from './components/DoYouNeed'
import { Disclaimer, Newsletter } from './components/FooterExtras'
import Footer from './components/Footer'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function App() {
  const hash = useHashRoute()
  const isCheckout = hash.startsWith('#/checkout')
  const isPolicy = hash.startsWith('#/policy')
  const isSuccess = hash.startsWith('#/success')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [isPolicy, isCheckout, isSuccess])

  if (isCheckout) {
    return <CheckoutPage key={window.location.search} />
  }

  if (isSuccess) {
    return <PaymentSuccessPage />
  }

  if (isPolicy) {
    return (
      <>
        <Navbar />
        <main>
          <PolicyPage />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Services />
        <AboutStrip />
        <CustomerReviews />
        <ExpertReviews />
        <WhyChoose />
        <LatestNews />
        <Team />
        <LifeInsuranceStrip />
        <IncomeProtectionStrip />
        <CriticalIllnessStrip />
        <Disclaimer />
      </main>
      <Newsletter />
      <Footer />
    </>
  )
}
