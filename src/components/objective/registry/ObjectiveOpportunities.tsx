import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveOpportunityItem {
  id: string
  title: string
  description: string
  partner: string
  estimatedValue: string
}

interface ObjectiveOpportunitiesProps {
  items: ObjectiveOpportunityItem[]
}

export default function ObjectiveOpportunities({ items }: ObjectiveOpportunitiesProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((opp) => (
        <Box
          key={opp.id}
          sx={{
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            padding: '14px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {opp.title}
            </Typography>
            <Box
              sx={{
                borderRadius: '8px',
                bgcolor: '#fdf9ef',
                paddingX: '8px',
                paddingY: '2px',
                fontSize: 11,
                fontWeight: 700,
                color: '#a98a41',
              }}
            >
              {opp.estimatedValue}
            </Box>
          </Box>
          <Typography
            sx={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: '4px' }}
          >
            {opp.description}
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{opp.partner}</Typography>
        </Box>
      ))}
    </Box>
  )
}
