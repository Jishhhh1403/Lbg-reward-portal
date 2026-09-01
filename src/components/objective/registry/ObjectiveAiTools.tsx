import Box from '@mui/material/Box'

interface ObjectiveAiToolsProps {
  tools: string[]
}

export default function ObjectiveAiTools({ tools }: ObjectiveAiToolsProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
      {tools.map((tool) => (
        <Box
          key={tool}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
            padding: '10px 6px',
            fontSize: 11,
            fontWeight: 600,
            color: '#475569',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': { bgcolor: '#f0fdf4', borderColor: '#006a4d', color: '#006a4d' },
          }}
        >
          {tool}
        </Box>
      ))}
    </Box>
  )
}
