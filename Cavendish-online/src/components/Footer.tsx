import { Box, Stack, Typography } from '@mui/material'
import { Shell } from './ui'

function LinkedinIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

function TwitterIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M23 4.94c-.81.36-1.68.6-2.6.71a4.53 4.53 0 0 0 1.99-2.5c-.87.52-1.84.9-2.87 1.1A4.51 4.51 0 0 0 11.8 8.4c0 .35.04.7.11 1.03A12.8 12.8 0 0 1 2.58 4.6a4.51 4.51 0 0 0 1.4 6.02 4.49 4.49 0 0 1-2.05-.56v.06a4.51 4.51 0 0 0 3.62 4.42c-.38.1-.78.16-1.19.16-.29 0-.57-.03-.85-.08a4.52 4.52 0 0 0 4.21 3.13A9.05 9.05 0 0 1 1 19.54a12.77 12.77 0 0 0 6.92 2.03c8.3 0 12.85-6.88 12.85-12.85l-.01-.58A9.2 9.2 0 0 0 23 4.94z" />
    </svg>
  )
}

const EXPLORE_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Life Insurance', href: '/life-insurance' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Life Insurance News', href: '/news' },
  { label: 'FAQs', href: '/faqs' },
]

const COMPANY_LINKS = [
  { label: 'Terms & Conditions', href: '/terms-and-conditions' },
  { label: 'Privacy Policy', href: '/privacy-notice' },
  { label: 'Cookies Policy', href: '/cookie-policy' },
  { label: 'Careers', href: '/careers' },
  { label: 'Feedback & Complaints', href: '/feedback-complaints' },
]

const headingSx = {
  color: '#191919',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  mb: '12px',
}

function LinkColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <Box component="nav" aria-label={title}>
      <Typography sx={headingSx}>{title}</Typography>
      <Stack spacing="2px">
        {links.map((l) => (
          <Box
            key={l.label}
            component="a"
            href={l.href}
            sx={{
              color: '#5f5b66',
              fontSize: 13.5,
              fontWeight: 500,
              textDecoration: 'none',
              py: '4px',
              width: 'fit-content',
              transition: 'color .15s ease',
              '&:hover': { color: '#840544', textDecoration: 'underline' },
            }}
          >
            {l.label}
          </Box>
        ))}
      </Stack>
    </Box>
  )
}

export default function Footer() {
  return (
    <footer>
      <Box
        sx={{
          position: 'relative',
          bgcolor: '#f8f7f9',
          borderTop: '1px solid #eae7eb',
          pt: '44px',
          pb: { xs: '120px', sm: '110px' },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 110,
            backgroundImage: 'url(/images/footer.svg)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center bottom',
            backgroundSize: '3000px auto',
            pointerEvents: 'none',
          },
        }}
      >
        <Shell sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              display: 'grid',
              gap: { xs: '32px', md: '40px' },
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: '1.5fr 1fr 1fr 1.25fr',
              },
            }}
          >
            <Box>
              <Box component="a" href="/" aria-label="Cavendish Online home" sx={{ display: 'inline-block', mb: '14px' }}>
                <Box
                  component="img"
                  src="/images/cavendish_footer_logo.png"
                  alt="Cavendish Online"
                  sx={{ width: 120, height: 'auto' }}
                />
              </Box>

              <Typography sx={{ color: '#706f6f', fontSize: 13.5, lineHeight: '22px', mb: '18px', maxWidth: 300 }}>
                Fee-reduced life insurance, critical illness and income protection — honest advice without the
                commission.
              </Typography>

              <Box
                component="a"
                href="https://uk.trustpilot.com/review/cavendishonline.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  border: '1px solid #00b67a',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ bgcolor: '#00b67a', px: '10px', py: '6px', display: 'flex' }}>
                  <Box component="img" src="/images/logo__white-white.svg" alt="Trustpilot" sx={{ height: 15 }} />
                </Box>
                <Typography sx={{ color: '#191919', fontSize: 12, px: '10px', fontWeight: 600 }}>
                  Excellent · 3089 reviews
                </Typography>
              </Box>
            </Box>

            <LinkColumn title="Explore" links={EXPLORE_LINKS} />

            <LinkColumn title="Company & Legal" links={COMPANY_LINKS} />

            <Box
              sx={{
                borderTop: { xs: '1px solid #eae7eb', sm: '1px solid #eae7eb', md: 'none' },
                borderLeft: { md: '1px solid #eae7eb' },
                pl: { md: '40px' },
                pt: { xs: '28px', md: 0 },
              }}
            >
              <Typography id="footer-help" sx={headingSx}>
                We're here to help
              </Typography>
              <Typography sx={{ color: '#706f6f', fontSize: 13.5, lineHeight: '21px', mb: '10px' }}>
                Our friendly team are on hand to provide any help you may need.
              </Typography>
              <Box
                component="a"
                href="tel:03456442540"
                sx={{
                  display: 'inline-block',
                  color: '#840544',
                  fontSize: { xs: 24, md: 26 },
                  fontWeight: 700,
                  textDecoration: 'none',
                  mb: '6px',
                  '&:hover': { color: '#aa8094' },
                }}
              >
                03456 442 540
              </Box>
              <Typography sx={{ color: '#706f6f', fontSize: 13 }}>Monday to Friday, 9am – 5.30pm</Typography>

              <Stack direction="row" spacing="10px" sx={{ mt: '16px' }}>
                {[
                  { label: 'LinkedIn', href: 'https://uk.linkedin.com/company/cavendish-online', icon: <LinkedinIcon /> },
                  { label: 'Twitter', href: 'https://www.twitter.com/cavendishonline', icon: <TwitterIcon /> },
                ].map((s) => (
                  <Box
                    key={s.label}
                    component="a"
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      border: '1px solid #ddd8de',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#670539',
                      bgcolor: 'transparent',
                      transition: 'all .15s ease',
                      '&:hover': { bgcolor: '#fff', borderColor: '#aa8094' },
                    }}
                  >
                    {s.icon}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Shell>
      </Box>

      <Box sx={{ bgcolor: '#f0eef1', py: '18px' }}>
        <Shell>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: '6px', md: '24px' }}
            sx={{ justifyContent: 'space-between' }}
          >
            <Typography sx={{ color: '#85818c', fontSize: 12, lineHeight: '20px', maxWidth: 720 }}>
              © 2026 Cavendish Online, part of Lloyds Banking Group, is authorised & regulated by the Financial Conduct
              Authority (Ref 469385). Registered in England No. 04045709.
            </Typography>
            <Typography sx={{ color: '#85818c', fontSize: 12, lineHeight: '20px', whiteSpace: { md: 'nowrap' } }}>
              Registered Office: Cavendish Online, 234 High Street, Exeter, EX4 3NL
            </Typography>
          </Stack>
        </Shell>
      </Box>
    </footer>
  )
}
