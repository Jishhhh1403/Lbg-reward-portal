import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveEvidenceProps {
  title: string
  summary: string
  factors: string[]
}

export default function ObjectiveEvidence({ title, summary, factors }: ObjectiveEvidenceProps) {
  return (
    <Box
      sx={{
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        padding: '16px',
      }}
    >
      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
        {summary}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {factors.map((f, i) => (
          <Box key={i} sx={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '999px',
                bgcolor: '#006a4d',
                marginTop: '6px',
                flexShrink: 0,
              }}
            />
            <Typography sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{f}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
