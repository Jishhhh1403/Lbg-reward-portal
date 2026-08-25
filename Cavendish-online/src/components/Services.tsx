import { Box, Button, Chip, Container, Grid, Paper, Stack, Typography } from '@mui/material'
import { ArrowRight, ShieldCheck, Star, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(160deg, #f2f8ee 0%, #ffffff 55%, #eef6ea 100%)',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Grid container spacing={6} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={3}>
              <Chip
                icon={<ShieldCheck size={15} />}
                label="FCA authorised & regulated · Ref 469385"
                sx={{ alignSelf: 'flex-start', bgcolor: '#e5f2df', color: '#25622f', fontWeight: 600 }}
              />
              <Typography variant="h1" sx={{ fontSize: { xs: 34, md: 50 }, lineHeight: 1.08 }}>
                Discount investment &amp; pension advice that pays you back
              </Typography>
              <Typography sx={{ fontSize: 17, lineHeight: 1.65, color: 'text.secondary', maxWidth: 540 }}>
                Cavendish Online helps you invest, save for retirement and protect your family — with heavily reduced
                initial and ongoing charges across the whole of the market.
              </Typography>
              <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} sx={{ px: 3, py: 1.5 }}>
                  Get a quote
                </Button>
                <Button variant="outlined" size="large" sx={{ px: 3, py: 1.5, borderColor: 'primary.main', color: 'primary.dark' }}>
                  Speak to an expert
                </Button>
              </Stack>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Star size={14} color="#a16207" /> No advice fee on investments — you keep more of your money.
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ position: 'relative', height: 360 }}>
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  inset: '24px 24px 0 auto',
                  width: '82%',
                  height: 300,
                  borderRadius: '24px',
                  background: 'linear-gradient(150deg, #2f7a3d 0%, #57a05f 60%, #8bc34a 100%)',
                  p: 3,
                  color: '#fff',
                }}
              >
                <Typography sx={{ opacity: 0.85, fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Your portfolio
                </Typography>
                <Typography variant="h3" sx={{ mt: 1, fontSize: 34 }}>
                  £48,250.60
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <TrendingUp size={16} />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>+£1,284 this year</Typography>
                </Box>
                <Stack spacing={1.25} sx={{ mt: 3 }}>
                  {[
                    { name: 'Global Equities', pct: 62 },
                    { name: 'Bonds', pct: 26 },
                    { name: 'Cash', pct: 12 },
                  ].map((row) => (
                    <Box key={row.name}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, mb: 0.5 }}>
                        <span>{row.name}</span>
                        <span>{row.pct}%</span>
                      </Box>
                      <Box sx={{ height: 6, borderRadius: 99, bgcolor: 'rgba(255,255,255,0.25)' }}>
                        <Box sx={{ width: `${row.pct}%`, height: '100%', borderRadius: 99, bgcolor: '#d9f2c8' }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: 230,
                  borderRadius: '18px',
                  p: 2,
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
                  Annual management charge
                </Typography>
                <Typography sx={{ fontSize: 30, fontWeight: 800, color: 'primary.dark', my: 0.5 }}>
                  0.19%*
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  Typical fund charge through Cavendish vs 0.75% elsewhere.
                </Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
