import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface ObjectiveInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export default function ObjectiveInput({
  label = 'Enter Objective',
  placeholder = 'e.g. I want to redeem my points for the best value',
  value,
  onChange,
}: ObjectiveInputProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '4px',
        }}
      >
        Hi, what are you looking for today?
      </Typography>
      <Typography
        sx={{ fontSize: 13, color: '#64748b', marginBottom: '16px' }}
      >
        Tell us your goal and we will find the best way to help you achieve it.
      </Typography>

      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
          marginBottom: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </Typography>
      <Box
        component="textarea"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        sx={{
          width: '100%',
          resize: 'none',
          borderRadius: '12px',
          border: '1.5px solid #e2e8f0',
          padding: '12px 14px',
          fontSize: 14,
          fontFamily: 'inherit',
          color: '#0f172a',
          bgcolor: '#ffffff',
          outline: 'none',
          transition: 'border-color 0.2s',
          '&:focus': { borderColor: '#006a4d', boxShadow: '0 0 0 3px rgba(0,106,77,0.1)' },
          '&::placeholder': { color: '#94a3b8' },
          boxSizing: 'border-box',
        }}
      />
    </Box>
  )
}
