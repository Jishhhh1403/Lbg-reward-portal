import { Box, Stack, Typography } from '@mui/material'
import { Shell } from './ui'

const QUOTES = [
  {
    quote:
      'Cavendish Online has been my top life insurance pick for years, and has consistently offered good prices during this time. It pioneered giving up all its commission in return for a one-off fee for online applications and can make it over 50% cheaper than most full-commission brokers.',
    author: 'Martin Lewis',
    role: 'Money Saving Expert',
  },
  {
    quote:
      'The most sensible option for buying term assurance. The best deals are usually via discount brokers who waive all commission and simply charge a one-off fee.',
    author: 'Justin Modray',
    role: 'Candid Financial Advisor',
    source: 'Candid Money',
  },
  {
    quote:
      'Set up term life insurance if you have a family to support: buy it through a discount broker, such as Cavendish Online, rather than a traditional broker. The savings are immense.',
    author: 'Andrew Oxlade',
    role: 'Executive Head of Personal Finance',
    source: 'The Telegraph',
    sourceHref: 'https://www.telegraph.co.uk/',
  },
]

export default function ExpertReviews() {
  return (
    <Box component="section" sx={{ py: '40px', pb: '80px', bgcolor: '#fff' }}>
      <Shell>
        <Typography component="h2" sx={{ color: '#191919', fontSize: { xs: 28, md: 36 }, fontWeight: 700, textAlign: 'center', mb: '40px' }}>
          What the experts say
        </Typography>

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ alignItems: 'stretch' }}>
          {QUOTES.map((q) => (
            <Box
              key={q.author}
              sx={{
                flex: 1,
                position: 'relative',
                bgcolor: '#fbf9f9',
                borderRadius: '12px',
                padding: { xs: '56px 28px 27px', lg: '66px 44px 27px' },
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: 'absolute',
                  top: 18,
                  left: 28,
                  color: '#840544',
                  fontSize: 72,
                  lineHeight: 1,
                  fontWeight: 700,
                  opacity: 0.9,
                }}
              >
                “
              </Box>
              <Typography sx={{ color: '#4c4d4e', fontSize: 15, lineHeight: '26px', mb: '20px' }}>
                {q.quote}
              </Typography>
              <Typography sx={{ color: '#4c4d4e', fontSize: 16, fontWeight: 700 }}>{q.author}</Typography>
              <Typography sx={{ color: '#670539', fontSize: 14, fontWeight: 700 }}>{q.role}</Typography>
              {q.source &&
                (q.sourceHref ? (
                  <Box
                    component="a"
                    href={q.sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ color: '#aa8094', fontSize: 14, textDecoration: 'underline' }}
                  >
                    {q.source}
                  </Box>
                ) : (
                  <Typography sx={{ color: '#706f6f', fontSize: 14 }}>{q.source}</Typography>
                ))}
            </Box>
          ))}
        </Stack>
      </Shell>
    </Box>
  )
}
