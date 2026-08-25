import { Box, Stack, Typography } from '@mui/material'
import { LinkArrow, PillButton, Shell } from './ui'

const NEWS = [
  { title: 'What Happens to Life Insurance When a Mortgage Is Paid Off?', href: '/news/what-happens-to-life-insurance-when-a-mortgage-is-paid-off', read: 3 },
  { title: 'Joint Life Insurance: Pros & Cons', href: '/news/joint-life-insurance-pros-cons', read: 4 },
  { title: 'Do I Need Extra Protection if I Have Life Insurance?', href: '/news/do-i-need-extra-protection-if-i-have-life-insurance', read: 3 },
  { title: 'How to Get Cheap Joint Life Insurance', href: '/news/how-to-get-cheap-joint-life-insurance', read: 4 },
]

export default function LatestNews() {
  return (
    <Box component="section" sx={{ position: 'relative', py: '80px', bgcolor: '#fff' }}>
      <Box
        aria-hidden
        component="img"
        src="/images/2_81_f.png"
        alt=""
        sx={{
          position: 'absolute',
          left: '-40px',
          bottom: '-70px',
          width: 260,
          display: { xs: 'none', lg: 'block' },
          pointerEvents: 'none',
        }}
      />
      <Shell>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 4, md: 6 }}>
          <Box sx={{ flexBasis: { md: '33%' }, flexShrink: 0 }}>
            <Typography component="h3" sx={{ color: '#840544', fontSize: { xs: 26, md: 30 }, fontWeight: 700 }}>
              Latest news
            </Typography>
          </Box>

          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              {NEWS.slice(0, 2).map((n) => (
                <Box
                  key={n.title}
                  component="a"
                  href={n.href}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: '#fbf9f9',
                    border: '2px solid #f2f2f2',
                    borderRadius: '12px',
                    padding: '34px 36px 28px',
                    textDecoration: 'none',
                    transition: 'transform .25s ease',
                    '&:hover': { transform: 'translateY(-10px)' },
                  }}
                >
                  <Typography
                    sx={{
                      color: '#191919',
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: '27px',
                      mb: '22px',
                    }}
                  >
                    {n.title}
                  </Typography>
                  <LinkArrow href={n.href}>{n.read} minute read</LinkArrow>
                </Box>
              ))}
            </Stack>

            <PillButton href="/news" sx={{ alignSelf: 'flex-start' }}>
              See all news
            </PillButton>
          </Stack>
        </Stack>
      </Shell>
    </Box>
  )
}
