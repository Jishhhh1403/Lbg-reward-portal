import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { palette } from './types'

interface WorkshopTextboxProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export default function WorkshopTextbox({
  label = 'Objective',
  placeholder = 'e.g. I want to redeem my points for the best value',
  value,
  onChange,
}: WorkshopTextboxProps) {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 700,
          color: palette.textMuted,
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
        rows={3}
        sx={{
          width: '100%',
          resize: 'none',
          borderRadius: '12px',
          border: `1.5px solid ${palette.border}`,
          padding: '12px 14px',
          fontSize: 14,
          fontFamily: 'inherit',
          color: palette.textStrong,
          bgcolor: palette.surface,
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
          '&:focus': { borderColor: palette.brand, boxShadow: `0 0 0 3px rgba(0,106,77,0.1)` },
          '&::placeholder': { color: palette.textFaint },
        }}
      />
    </Box>
  )
}
