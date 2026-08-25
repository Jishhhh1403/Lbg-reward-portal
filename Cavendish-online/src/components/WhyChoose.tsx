import { Box, Stack, Typography } from '@mui/material'
import { Shell } from './ui'

const ITEMS = [
  { title: 'Quality', text: 'Products from leading life insurers' },
  { title: 'Value', text: 'Providing our lowest possible premiums' },
  { title: 'Transparency', text: 'Our fees and commission are upfront and clear' },
]

export default function WhyChoose() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        py: { xs: '60px', md: '80px' },
        background: 'linear-gradient(179deg,#fdfafd 0,#fbf0f8 100%)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -18,
          left: 0,
          right: 0,
          height: 90,
          backgroundImage: 'url(/images/flexible--left-top.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center top',
          backgroundSize: '3000px auto',
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -18,
          left: 0,
          right: 0,
          height: 90,
          backgroundImage: 'url(/images/flexible--left-bottom.svg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center bottom',
          backgroundSize: '3000px auto',
          pointerEvents: 'none',
        },
      }}
    >
      <Shell>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 5, md: 6 }}>
          <Box sx={{ flexBasis: { md: 295 }, flexShrink: 0 }}>
            <Typography
              component="h3"
              sx={{ color: '#840544', fontSize: { xs: 26, md: 30 }, fontWeight: 700, lineHeight: 1.3 }}
            >
              Why Choose Cavendish Online?
            </Typography>
          </Box>

          <Stack
            component="ol"
            direction={{ xs: 'column', md: 'row' }}
            spacing={{ xs: 4, md: 0 }}
            sx={{ flex: 1, m: 0, p: 0, listStyle: 'none' }}
          >
            {ITEMS.map((item, i) => (
              <Stack key={item.title} sx={{ flex: 1, flexDirection: 'column', alignItems: { xs: 'flex-start' } }}>
                <Box
                  aria-hidden
                  sx={{
                    width: 52,
                    height: 52,
                    mb: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#840544',
                    color: '#fff',
                    fontSize: 22,
                    fontWeight: 700,
                    borderRadius: '50%',
                  }}
                >
                  {i + 1}
                </Box>
                <Typography component="h4" sx={{ color: '#670539', fontSize: 17, fontWeight: 700, mb: '8px' }}>
                  {item.title}
                </Typography>
                <Typography sx={{ color: '#706f6f', fontSize: 15, lineHeight: '25px', maxWidth: 250 }}>
                  {item.text}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Shell>
    </Box>
  )
}
