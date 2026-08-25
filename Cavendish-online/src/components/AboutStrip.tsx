import { Box, Stack, Typography } from '@mui/material'
import { Kicker, PillButton, Shell } from './ui'

export default function AboutStrip() {
  return (
    <Box component="section" sx={{ pt: '48px', pb: '80px', bgcolor: '#fff' }}>
      <Shell>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 8 }} sx={{ alignItems: 'center' }}>
          <Stack sx={{ flex: 1 }}>
            <Kicker>About Cavendish Online</Kicker>
            <Typography
              component="h2"
              sx={{
                color: '#191919',
                fontSize: { xs: 26, md: 36 },
                lineHeight: { xs: 1.25, md: '40px' },
                fontWeight: 700,
                letterSpacing: '.71px',
                mb: '18px',
              }}
            >
              A Life insurance discount broker – providing lower premiums for our customers
            </Typography>
            <Typography sx={{ color: '#706f6f', fontSize: 16, lineHeight: '28px', mb: '26px' }}>
              We achieve these lower premiums by charging a small fixed fee or a reduced commission and have
              consistently been commended by consumer champions as a way to save money when buying life insurance.
            </Typography>
            <PillButton href="/about" sx={{ alignSelf: 'flex-start' }}>
              About Cavendish Online
            </PillButton>
          </Stack>

          <Box sx={{ flexBasis: { md: 400 }, flexGrow: 0, display: 'flex', justifyContent: 'center' }}>
            <Box
              component="img"
              src="/images/5_1_s.jpg"
              alt="About Cavendish Online"
              sx={{ width: '100%', maxWidth: 400, borderRadius: '12px' }}
            />
          </Box>
        </Stack>
      </Shell>
    </Box>
  )
}
