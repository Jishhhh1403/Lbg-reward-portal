import { Box, Stack, Typography } from '@mui/material'
import { PillButton, Shell } from './ui'

export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        mt: { xs: '-40px', md: '-72px' },
        pt: { xs: '70px', md: '110px' },
        pb: { xs: '40px', md: '30px' },
        minHeight: { md: 550 },
        backgroundImage: 'url(/images/carousel__home.svg)',
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'center -110px',
        backgroundSize: '3000px auto',
      }}
    >
      <Shell>
        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          spacing={{ xs: 4, md: 6 }}
          sx={{ alignItems: 'center' }}
        >
          <Stack sx={{ flexBasis: { md: 515 }, flexGrow: 1 }}>
            <Typography
              sx={{
                color: '#670539',
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.28px',
                textTransform: 'uppercase',
                mb: '10px',
              }}
            >
              Life Insurance
            </Typography>
            <Typography
              component="h1"
              sx={{
                color: '#191919',
                fontSize: { xs: 30, sm: 38, md: 44 },
                lineHeight: { xs: 1.25, md: '56px' },
                fontWeight: 700,
                letterSpacing: '.5px',
                mb: '18px',
              }}
            >
              We’re committed to providing our lowest possible premiums
            </Typography>
            <Typography sx={{ color: '#000', fontSize: 16, lineHeight: '28px', mb: '26px' }}>
              When you buy online, we aim to achieve these low premiums by charging a small, fixed fee of £25 or a
              reduced commission.
            </Typography>
            <PillButton href="#/policy" sx={{ alignSelf: 'flex-start' }}>
              More details
            </PillButton>

            <Box
              component="a"
              href="https://uk.trustpilot.com/review/cavendishonline.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                mt: '34px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                textDecoration: 'none',
                alignSelf: 'flex-start',
              }}
            >
              <Typography sx={{ color: '#191919', fontSize: 18 }}>
                Excellent
              </Typography>
              <Box component="img" src="/images/star_5.svg" alt="Our Trustpilot rating" sx={{ height: 22 }} />
              <Typography sx={{ color: '#191919', fontSize: 14 }}>
                3089 reviews on
              </Typography>
              <Box component="img" src="/images/logo__green-black.svg" alt="Trustpilot" sx={{ height: 20 }} />
            </Box>
          </Stack>

          <Box
            sx={{
              flexBasis: { md: 620 },
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src="/images/11_1_s.png"
              alt="We’re committed to providing our lowest possible premiums"
              sx={{ width: '100%', maxWidth: 531, height: 'auto', maxHeight: { md: 500 } }}
            />
          </Box>
        </Stack>
      </Shell>
    </Box>
  )
}
