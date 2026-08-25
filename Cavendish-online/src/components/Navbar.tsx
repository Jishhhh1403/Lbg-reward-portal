import { useState } from 'react'
import { AppBar, Box, Button, Drawer, IconButton, List, ListItem, Stack } from '@mui/material'
import { Menu as MenuIcon, X } from 'lucide-react'

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: 'Home', href: '/' },
  { label: 'Our Services', href: '/our-services' },
  { label: 'Life Insurance', href: '/how-to-apply#quote-apply-online' },
  { label: 'Income Protection', href: '/income-protection' },
  { label: 'About Us', href: '/about' },
  { label: 'Latest News', href: '/news' },
  { label: 'Contact Us', href: '/contact' },
]

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <AppBar
      position="relative"
      elevation={0}
      sx={{ bgcolor: '#840544', zIndex: 40 }}
    >
      <Box
        component="div"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: { xs: 135, md: 120 },
          px: { xs: '20px', md: '32px' },
          py: '16px',
        }}
      >
        <Box
          component="a"
          href="/"
          aria-label="Cavendish Online home"
          sx={{ display: 'inline-flex', flexShrink: 0 }}
        >
          <Box
            component="img"
            src="/images/logo-white.svg"
            alt="Cavendish Online"
            sx={{ width: { xs: 130, md: 149 }, height: 'auto', display: 'block' }}
          />
        </Box>

        <Button
          startIcon={<MenuIcon size={18} />}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          sx={{
            flexShrink: 0,
            ml: 'auto',
            color: '#fff',
            border: '2px solid rgba(255,255,255,.7)',
            borderRadius: '150px',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 13,
            minHeight: 44,
          }}
        >
          Menu
        </Button>
      </Box>

      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '-20px',
          height: 60,
          backgroundImage: 'url(/images/nav.svg)',
          backgroundRepeat: 'repeat-x',
          backgroundSize: 'auto 100%',
          pointerEvents: 'none',
          zIndex: 1,
          
        }}
      />

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 300, p: '20px' , marginTop: '20px'}}>
          <Stack direction="row" sx={{ mb: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box component="img" src="/images/cavendish_footer_logo.png" alt="Cavendish" sx={{ width: 100 }} />
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X />
            </IconButton>
          </Stack>
          <List>
            {NAV_ITEMS.map((item) => (
              <ListItem key={item.label} disablePadding>
                <Box
                  component="a"
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  sx={{
                    display: 'block',
                    width: '100%',
                    py: '11px',
                    color: '#191919',
                    fontSize: 15,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    borderBottom: '1px solid #f2f2f2',
                  }}
                >
                  {item.label}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  )
}
