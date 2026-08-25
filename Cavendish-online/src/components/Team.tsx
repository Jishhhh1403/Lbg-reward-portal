import { Box, Stack, Typography } from '@mui/material'
import { Shell } from './ui'

const TABS = [
  'All Team Members',
  'Directors & Management',
  'Business Development',
  'Insurance Advisers',
  'Protection Consultants',
  'Business Support',
]

const MEMBERS = [
  { img: '/images/3_1_s.png', name: 'John Nelmes', role: 'Head of Cavendish Online Distribution' },
  { img: '/images/3_120_s.png', name: 'Andy Scott', role: 'Technical Manager' },
  { img: '/images/3_2_s.png', name: 'Anthony Stephens', role: 'Senior Manager, Operations' },
  { img: '/images/3_5_s.png', name: 'Laurence Grantham', role: 'Assistant Business Support Manager' },
  { img: '/images/3_4_s.png', name: 'Luke Barber', role: 'Product Owner' },
  { img: '/images/3_24_s.png', name: 'David Vickery', role: 'Assistant Business Development Manager' },
  { img: '/images/3_41_s.png', name: 'Melody Woods', role: 'Assistant Technology Support Manager' },
  { img: '/images/3_11_s.png', name: 'Allan May', role: 'People & Culture Manager' },
]

export default function Team() {
  return (
    <Box component="section" sx={{ py: '80px', bgcolor: '#fff' }}>
      <Shell>
        <Typography component="h2" sx={{ color: '#191919', fontSize: { xs: 28, md: 36 }, fontWeight: 700, textAlign: 'center', mb: '30px' }}>
          Meet the team
        </Typography>

        <Stack
          direction="row"
          sx={{
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            mb: '44px',
            maxWidth: 900,
            mx: 'auto',
          }}
        >
          {TABS.map((t, i) => (
            <Box
              key={t}
              component="a"
              href="#team"
              onClick={(e) => e.preventDefault()}
              sx={{
                bgcolor: i === 0 ? '#fbf9f9' : '#fff',
                border: '2px solid #f2f2f2',
                borderRadius: '100px',
                color: '#670539',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'uppercase',
                textDecoration: 'none',
                padding: '14px 26px 12px',
              }}
            >
              {t}
            </Box>
          ))}
        </Stack>

        <Stack direction="row" sx={{ flexWrap: 'wrap', justifyContent: 'center', gap: '34px 24px' }}>
          {MEMBERS.map((m) => (
            <Box key={m.name} sx={{ width: 190, textAlign: 'center' }}>
              <Box
                component="img"
                src={m.img}
                alt={m.name}
                sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '50%', mb: '12px' }}
              />
              <Typography sx={{ color: '#191919', fontSize: 16, fontWeight: 700 }}>{m.name}</Typography>
              <Typography sx={{ color: '#706f6f', fontSize: 13, lineHeight: '20px' }}>{m.role}</Typography>
            </Box>
          ))}
        </Stack>
      </Shell>
    </Box>
  )
}
