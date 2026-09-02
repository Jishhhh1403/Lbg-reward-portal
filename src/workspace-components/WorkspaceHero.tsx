import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface WorkspaceHeroProps {
  label?: string
}

export default function WorkspaceHero({ label = 'your Workspace' }: WorkspaceHeroProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '999px',
          bgcolor: palette.brand,
          boxShadow: `0 0 0 4px ${palette.brandSoft}`,
          flexShrink: 0,
        }}
      />
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: palette.brand,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}
