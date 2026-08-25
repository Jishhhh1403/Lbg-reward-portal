import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import LanguageIcon from '@mui/icons-material/Language'

/** Visual-only social sign-in options (no OAuth wired). */
export default function SocialLoginButtons() {
  return (
    <>
      <Divider sx={{ my: 2.5 }}>
        <Box component="span" sx={{ fontSize: 12, color: 'text.secondary' }}>
          or continue with
        </Box>
      </Divider>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LanguageIcon />}
          sx={{ borderColor: '#dbe3ec', color: 'text.primary' }}
        >
          Google
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={
            <Box component="span" aria-hidden sx={{ fontSize: 18, lineHeight: 1 }}>
              
            </Box>
          }
          sx={{ borderColor: '#dbe3ec', color: 'text.primary' }}
        >
          Apple
        </Button>
      </Box>
    </>
  )
}
