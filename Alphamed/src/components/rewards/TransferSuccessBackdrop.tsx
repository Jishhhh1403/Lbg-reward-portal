import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'

/**
 * Full-screen confirmation shown between "Convert" tap and routing to
 * the success page — pulsing rings, floating coin and sweeping progress.
 */
export default function TransferSuccessBackdrop() {
  return (
    <div className="transfer-backdrop">
      <Box sx={{ textAlign: 'center', color: '#fff', px: 5 }}>
        <Box sx={{ position: 'relative', width: 96, height: 96, mx: 'auto' }}>
          {[0, 1].map((index) => (
            <span
              key={index}
              className={`am-pulse-ring${index === 1 ? ' am-pulse-ring-delay' : ''}`}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,.55)',
              }}
            />
          ))}
          <Box
            className="am-pop"
            sx={{
              position: 'absolute',
              inset: 12,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#42a5f5,#1565c0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 14px 34px -10px rgba(66,165,245,.8)',
            }}
          >
            <LocalHospitalIcon sx={{ fontSize: 34 }} />
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={800} mt={2.5}>
          Transferring…
        </Typography>
        <Typography variant="body2" color="rgba(255,255,255,.85)" mt={0.5}>
          Sending points to your LBG account
        </Typography>

        <Box
          sx={{
            mt: 2.5,
            height: 4,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,.18)',
            overflow: 'hidden',
          }}
        >
          <div
            className="am-progress-sweep"
            style={{
              width: '28%',
              height: '100%',
              borderRadius: 2,
              background:
                'linear-gradient(90deg,rgba(255,255,255,0),#ffffff)',
            }}
          />
        </Box>

        <Box className="am-float-up" sx={{ mt: 2, fontSize: 22 }}>
          🪙
        </Box>
      </Box>
    </div>
  )
}
