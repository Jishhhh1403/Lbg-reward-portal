import { Box, Typography } from '@mui/material'
import { Shell } from './ui'

export function Disclaimer() {
  return (
    <Box component="section" sx={{ py: '40px', bgcolor: '#fff' }}>
      <Shell>
        <Typography
          sx={{
            maxWidth: 980,
            mx: 'auto',
            color: '#670539',
            fontSize: 18,
            fontWeight: 700,
            lineHeight: '32px',
          }}
        >
          The insurance products offered by Cavendish Online have no cash-in value at any time. If you stop paying your
          premiums your cover will stop, your policy will end, and you will receive no benefit. If you have not claimed
          before the end of your chosen policy term, the policy will end, and no benefit will be paid. If you are facing
          financial difficulty, please contact your insurer before cancelling your policy or letting it lapse. They may
          have options available that means you don't have to lose the plan.
        </Typography>
      </Shell>
    </Box>
  )
}

export function Newsletter() {
  return (
    <Box component="section" sx={{ bgcolor: '#f2f2f2', py: '48px', mt: '80px' }}>
      <Shell>
        <Box sx={{ maxWidth: 705, mx: 'auto', textAlign: 'center' }}>
          <Typography component="h5" sx={{ color: '#670539', fontSize: { xs: 22, md: 28 }, fontWeight: 700, mb: '22px' }}>
            Sign up to our newsletter
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => e.preventDefault()}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: '12px',
              justifyContent: 'center',
            }}
          >
            <Box
              component="input"
              type="email"
              placeholder="Email Address"
              aria-label="Email Address"
              sx={{
                flex: 1,
                border: 'none',
                borderRadius: '150px',
                padding: '18px 33px 15px',
                fontFamily: 'inherit',
                fontSize: 15,
                outline: 'none',
                '&:focus': { boxShadow: 'inset 0 0 0 2px #aa8094' },
              }}
            />
            <Box
              component="button"
              type="submit"
              sx={{
                cursor: 'pointer',
                bgcolor: '#840544',
                color: '#fff',
                border: '2px solid #670539',
                borderRadius: '150px',
                padding: '16px 40px 14px',
                fontFamily: 'inherit',
                fontSize: 14,
                fontWeight: 700,
                textTransform: 'uppercase',
                transition: 'all .15s ease',
                '&:hover': { bgcolor: 'transparent', color: '#670539' },
              }}
            >
              Sign up now
            </Box>
          </Box>
        </Box>
      </Shell>
    </Box>
  )
}
