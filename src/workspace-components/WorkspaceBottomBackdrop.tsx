import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import { SCREEN_BACKGROUNDS } from '../assets/screen-backgrounds'

interface WorkspaceBottomBackdropProps {
  /** Screen-background folder whose art backs the bottom of the workspace. */
  folderKey: string | null
  /** Bump to force a fresh random pick (incremented each time the modal opens). */
  nonce: number
}

/**
 * Bottom artwork layer of the workspace modal. Picks one image at random from
 * the folder matching the active screen and paints it across the bottom strip —
 * clearly visible, with only a thin fade at its very top edge so it eases into
 * the plain content above. The progress bar is laid over it by the parent.
 */
export default function WorkspaceBottomBackdrop({
  folderKey,
  nonce,
}: WorkspaceBottomBackdropProps) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const urls = folderKey ? SCREEN_BACKGROUNDS[folderKey] : undefined
    if (!urls || urls.length === 0) {
      setUrl(null)
      return
    }
    setUrl(urls[Math.floor(Math.random() * urls.length)])
  }, [folderKey, nonce])

  if (!url) return null

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <img
        src={url}
        alt=""
        draggable={false}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'bottom center',
        }}
      />
      {/* Only the very top edge eases off — the rest of the art stays crisp. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 10%)',
        }}
      />
    </Box>
  )
}