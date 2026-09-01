import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveSummaryCardProps {
  summary: string
}

export default function ObjectiveSummaryCard({ summary }: ObjectiveSummaryCardProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        bgcolor: '#f8fafc',
        border: '1px solid #e2e8f0',
        padding: '16px',
      }}
    >
      <Typography sx={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
        {summary}
      </Typography>
    </Box>
  )
}
