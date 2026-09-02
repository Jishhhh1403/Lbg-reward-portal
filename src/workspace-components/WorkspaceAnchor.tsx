import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface WorkspaceAnchorProps {
  text?: string
  align?: 'left' | 'center'
}

export default function WorkspaceAnchor({
  text = 'What are you looking for today?',
  align = 'left',
}: WorkspaceAnchorProps) {
  return (
    <Box sx={{ textAlign: align }}>
      <Typography
        sx={{
          fontSize: 20,
          fontWeight: 800,
          color: palette.textStrong,
          lineHeight: 1.3,
        }}
      >
        {text}
      </Typography>
    </Box>
  )
}
