import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import lloydsLogo from "../assets/Lloyd's bank logo.png"

export default function SplashPage() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let start: number | null = null
    const duration = 3000
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const elapsed = timestamp - start
      const pct = Math.min(100, Math.round((elapsed / duration) * 100))
      setProgress(pct)
      if (elapsed < duration) requestAnimationFrame(step)
    }
    const id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        bgcolor: '#000000',
        color: '#ffffff',
      }}
    >
      <Box
        sx={{
          bgcolor: '#ffffff',
          padding: 3,
          borderRadius: '12px',
          boxShadow: 3,
          width: '91.666667%',
          maxWidth: 512,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={lloydsLogo}
          alt="Lloyds"
          sx={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />
      </Box>

      <Box
        sx={{
          width: '91.666667%',
          maxWidth: 448,
          borderRadius: '999px',
          bgcolor: 'rgba(30, 41, 59, 0.4)',
          padding: '4px',
        }}
      >
        <Box
          sx={{
            height: 8,
            width: `${progress}%`,
            borderRadius: '999px',
            bgcolor: '#a3e635',
            transition: 'width 120ms linear',
          }}
        />
      </Box>
    </Box>
  )
}
