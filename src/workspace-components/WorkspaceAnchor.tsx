import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface WorkspaceAnchorProps {
  text?: string
  align?: 'left' | 'center'
}

export default function WorkspaceAnchor({
  align = 'left',
}: WorkspaceAnchorProps) {
  return (
    <Box sx={{ textAlign: align }}>
      <Typography
        sx={{
          fontSize: 15,
          fontWeight: 800,
          color: palette.textStrong,
          lineHeight: 1.3,
        }}
      >
        What is your objective today?
      </Typography>
    </Box>
  )
}
