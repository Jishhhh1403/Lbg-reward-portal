import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveHeadlineProps {
  eyebrow?: string
  title: string
}

export default function ObjectiveHeadline({ eyebrow, title }: ObjectiveHeadlineProps) {
  return (
    <Box sx={{ marginBottom: '16px' }}>
      {eyebrow ? (
        <Typography
          sx={{ fontSize: 14, fontWeight: 600, color: '#006a4d', marginBottom: '4px' }}
        >
          {eyebrow}
        </Typography>
      ) : null}
      <Typography
        sx={{ fontSize: 18, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}
      >
        {title}
      </Typography>
    </Box>
  )
}
