import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'

/** Rewards screen header: back arrow · title · notification bell. */
export default function RewardsHeader({ title }: { title: string }) {
  const navigate = useNavigate()

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        bgcolor: 'rgba(244,247,251,.94)',
        backdropFilter: 'blur(8px)',
        px: 2.5,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        paddingTop: '50px',
      }}
    >
      <IconButton
        aria-label="Back"
        onClick={() => navigate('/dashboard')}
        sx={{
          mr: 2,
          bgcolor: '#fff',
          boxShadow: '0 4px 14px -6px rgba(13,40,80,.3)',
          '&:hover': { bgcolor: '#fff' },
        }}
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 15 }} />
      </IconButton>
      <Typography fontWeight={800} fontSize={16} sx={{ flex: 1, textAlign: 'center' }}>
        {title}
      </Typography>
      <IconButton
        aria-label="Notifications"
        sx={{
          bgcolor: '#fff',
          boxShadow: '0 4px 14px -6px rgba(13,40,80,.3)',
          '&:hover': { bgcolor: '#fff' },
        }}
      >
        <NotificationsNoneOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  )
}
