import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveExecutionHeaderProps {
  planLabel: string
  description: string
}

export default function ObjectiveExecutionHeader({ planLabel, description }: ObjectiveExecutionHeaderProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        bgcolor: '#f0fdf4',
        padding: '16px',
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: '#006a4d',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '4px',
        }}
      >
        {planLabel}
      </Typography>
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
        {description}
      </Typography>
    </Box>
  )
}
