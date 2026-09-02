import Box from '@mui/material/Box'
import { palette } from './types'

interface WorkspaceBackgroundProps {
  /** URL of the background image. When omitted a brand gradient is shown. */
  image?: string
  /** Optional caption/hint shown overlaid on the band. */
  hint?: string
  /** Height of the decorative band in px (regular mode only). */
  height?: number
  /** Fill the parent container as a full-bleed screen background (screen 1a). */
  fill?: boolean
}

export default function WorkspaceBackground({
  image,
  hint,
  height = 120,
  fill = false,
}: WorkspaceBackgroundProps) {
  const backgroundImage = image ? `url(${image})` : undefined

  if (fill) {
    return (
      <Box
        aria-hidden="true"
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          backgroundImage: backgroundImage
            ? backgroundImage
            : `linear-gradient(135deg, ${palette.brand} 0%, ${palette.brandDark} 100%)`,
          backgroundPosition: 'center top',
          backgroundSize: 'cover',
        }}
      >
        {/* Soft white fade at the top so the controls stay legible over art. */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0) 62%)',
          }}
        />
        {hint ? (
          <Box
sx={{
            position: 'absolute',
            zIndex: 1,
            top: 0,
            margin: '12px 14px',
            padding: '4px 10px',
            borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.9)',
            color: palette.brandDark,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
          >
            {hint}
          </Box>
        ) : null}
      </Box>
    )
  }

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'relative',
        height,
        flexShrink: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundImage: backgroundImage
          ? `${backgroundImage}, linear-gradient(135deg, ${palette.brand} 0%, ${palette.brandDark} 100%)`
          : `linear-gradient(135deg, ${palette.brand} 0%, ${palette.brandDark} 100%)`,
        backgroundPosition: 'center',
        backgroundSize: backgroundImage ? 'cover, cover' : 'cover',
        backgroundBlendMode: backgroundImage ? 'multiply' : undefined,
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 0,
      }}
    >
      {hint ? (
        <Box
          sx={{
            margin: '12px 14px',
            padding: '4px 10px',
            borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.9)',
            color: palette.brandDark,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {hint}
        </Box>
      ) : null}
    </Box>
  )
}