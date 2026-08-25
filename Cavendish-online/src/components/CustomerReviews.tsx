import { Box, Stack, Typography } from '@mui/material'
import { Shell } from './ui'

const REVIEWS = [
  {
    title: 'Simple process',
    body: 'Really easy to set up cover online. The fixed fee made the monthly premiums noticeably cheaper than going direct.',
    name: 'Sarah',
    date: 'January 2026',
  },
  {
    title: 'Great value',
    body: 'Spoke to an adviser who talked me through my options without any pressure. Saved a good amount each month.',
    name: 'James',
    date: 'December 2025',
  },
  {
    title: 'Highly recommend',
    body: 'Everything was explained clearly and the policy was in place within days. Excellent service throughout.',
    name: 'Priya',
    date: 'December 2025',
  },
]

function Stars({ score }: { score: number }) {
  return (
      <Stack direction="row" spacing="2px">
      {[1, 2, 3, 4, 5].map((i) => (
        <Box key={i} sx={{ position: 'relative', width: 22, height: 22 }}>
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#dcdce6', clipPath: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)' }} />
          {i <= Math.round(score) && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#00b67a', clipPath: 'polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%)' }} />
          )}
        </Box>
      ))}
    </Stack>
  )
}

export default function CustomerReviews() {
  return (
    <Box component="section" sx={{ py: '40px', bgcolor: '#fff' }}>
      <Shell>
        <Typography component="h2" sx={{ color: '#191919', fontSize: { xs: 28, md: 36 }, fontWeight: 700, textAlign: 'center', mb: '34px' }}>
          What our customers say
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 5 }}
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            mb: '36px',
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Typography sx={{ color: '#191919', fontSize: 22, fontWeight: 700 }}>Excellent</Typography>
            <Stars score={4.5} />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography sx={{ color: '#191919', fontSize: 22, fontWeight: 700 }}>4.5</Typography>
            <Typography sx={{ color: '#706f6f', fontSize: 15 }}>out of 5</Typography>
          </Stack>
          <Box
            component="a"
            href="https://uk.trustpilot.com/review/cavendishonline.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              border: `2px solid #00b67a`,
              borderRadius: '6px',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ bgcolor: '#00b67a', px: '12px', py: '7px', display: 'flex' }}>
              <Box component="img" src="/images/logo__white-white.svg" alt="Trustpilot" sx={{ height: 17 }} />
            </Box>
            <Typography sx={{ color: '#191919', fontSize: 13, px: '14px', fontWeight: 700 }}>
              3089 reviews
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {REVIEWS.map((r) => (
            <Box
              key={r.name}
              sx={{
                flex: 1,
                bgcolor: '#fbf9f9',
                border: '2px solid #f2f2f2',
                borderRadius: '12px',
                p: '30px 34px',
              }}
            >
              <Stars score={5} />
              <Typography sx={{ color: '#191919', fontSize: 16, fontWeight: 700, mt: '14px', mb: '8px' }}>
                {r.title}
              </Typography>
              <Typography sx={{ color: '#706f6f', fontSize: 14, lineHeight: '24px', mb: '16px' }}>{r.body}</Typography>
              <Typography sx={{ color: '#670539', fontSize: 13, fontWeight: 700 }}>
                {r.name} <span style={{ color: '#aa8094', fontWeight: 400 }}>· {r.date}</span>
              </Typography>
            </Box>
          ))}
        </Stack>
      </Shell>
    </Box>
  )
}
