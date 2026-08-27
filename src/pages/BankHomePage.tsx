import { motion } from 'framer-motion'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import ButtonBase from '@mui/material/ButtonBase'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  Gift,
  HandCoins,
  Home,
  Landmark,
  LogOut,
  MoreHorizontal,
  PieChart,
  QrCode,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { formatCurrencyGBP } from '../utils/format'
import { shadows } from '../theme'

interface BankHomePageProps {
  userName: string
  onOpenRewards: () => void
  onSignOut: () => void
}

const MotionBox = motion.create(Box)
const MotionButton = motion.create(ButtonBase)

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const recentTx = [
  { id: 'r1', label: 'Supermarket', detail: 'Groceries · Today', amount: -23.4 },
  { id: 'r2', label: 'Salary', detail: 'Income · Yesterday', amount: 2450.0 },
  { id: 'r3', label: 'Coffee Shop', detail: 'Dining · Mon', amount: -3.85 },
]

/* Profile photos live in src/assets/customers, named after the customer's first name
   (e.g. "Alex.jpeg" for "Alex Morgan"). Drop in a new file per customer and
   it is picked up automatically; otherwise the avatar falls back to initials. */
const PROFILE_PHOTOS = import.meta.glob<string>('../assets/customers/*.{jpeg,jpg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function getProfilePhoto(userName: string): string | undefined {
  const firstName = userName.trim().split(/\s+/)[0]?.toLowerCase()
  if (!firstName) return undefined
  const entry = Object.entries(PROFILE_PHOTOS).find(([path]) => {
    const fileName = path.split('/').pop() ?? ''
    const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase()
    return baseName === firstName
  })
  return entry?.[1]
}

export default function BankHomePage({ userName, onOpenRewards, onSignOut }: BankHomePageProps) {
  const firstName = userName.split(/\s+/)[0] ?? userName
  const profilePhoto = getProfilePhoto(userName)

  return (
    <MotionBox
      variants={container}
      initial="hidden"
      animate="visible"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#f1f5f9',
        color: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <Box
        className="no-scrollbar"
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 4 }}
      >
      {/* Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'linear-gradient(to bottom right, #045a42, #006a4d, #238762)',
          padding: '24px 20px 0',
          color: '#ffffff',
          
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' , marginTop: 3}}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={profilePhoto}
              alt={userName}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: 14,
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                '& .MuiAvatar-img': { objectFit: 'cover' },
              }}
            >
              {userName
                .split(/\s+/)
                .map((p) => p.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 16, color: '#d7ece2' }}>Good morning, {firstName}</Typography>
              {/* <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{firstName}</Typography> */}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconButton
              aria-label="Notifications"
              sx={{
                color: 'inherit',
                borderRadius: '999px',
                padding: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            >
              <Bell size={19} />
              <Box component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
                Notifications
              </Box>
            </IconButton>
            <IconButton
              onClick={onSignOut}
              aria-label="Sign out"
              sx={{
                color: 'inherit',
                borderRadius: '999px',
                padding: 1,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            >
              <LogOut size={19} />
            </IconButton>
          </Box>
        </Box>

        <MotionBox
          variants={item}
          sx={{
            marginTop: '20px',
            borderRadius: '16px',
            bgcolor: 'rgba(255,255,255,0.12)',
            padding: 2,
            backdropFilter: 'blur(4px)',
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#ffffff',
            }}
          >
            LLOYDS ACCOUNT
          </Typography>
          <Typography sx={{fontSize: 12,}}>11-01-23 | 45832378</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ marginTop: '6px', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {formatCurrencyGBP(3184.62)}
              </Typography>
              <Typography sx={{ marginTop: '2px', fontSize: 12, color: '#d7ece2' }}>Available balance</Typography>
            </Box>
            <Box
              component="button"
              sx={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '999px',
                border: '1px solid rgba(255,255,255,0.35)',
                background: 'transparent',
                cursor: 'pointer',
                marginLeft: '12px',
                paddingLeft: '12px',
                paddingRight: '12px',
                paddingTop: '6px',
                paddingBottom: '6px',
                fontSize: 12,
                fontWeight: 600,
                color: '#ffffff',
                fontFamily: 'inherit',
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
            >
              View account <ChevronRight size={13} />
            </Box>
          </Box>
          {/* <Box sx={{ marginTop: 2, display: 'flex', gap: '10px' , border: '1px solid red'}}>
            {[
              { icon: ArrowUpRight, label: 'Pay' },
              { icon: ArrowDownLeft, label: 'Request' },
              { icon: QrCode, label: 'Scan' },
              { icon: Gift, label: 'Rewards', highlight: true },
            ].map(({ icon: Icon, label, highlight }) => (
              <MotionButton
                key={label}
                disableRipple
                onClick={highlight ? onOpenRewards : undefined}
                sx={[
                  {
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    borderRadius: '12px',
                    paddingTop: '10px',
                    paddingBottom: '10px',
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'inherit',
                  },
                  highlight
                    ? { bgcolor: '#ddbe72', '&:hover': { bgcolor: '#ecd9a8' } }
                    : { bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } },
                ]}
              >
                <Icon size={17} />
                {label}
              </MotionButton>
            ))}
          </Box> */}
        </MotionBox>

        {/* Rounded bottom edge into content */}
        <Box sx={{ height: 24 }} />
      </Box>
      <Box
        sx={{
          marginTop: -3,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: '#f1f5f9',
          paddingTop: 2.5,
        }}
      />

      <Box sx={{ paddingX: 2.5}}>
        {/* Rewards spotlight */}
        {/* <MotionButton
          variants={item}
          whileTap={{ scale: 0.98 }}
          disableRipple
          onClick={onOpenRewards}
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '16px',
            background: 'linear-gradient(to right, #064836, #006a4d)',
            padding: 2,
            textAlign: 'left',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: shadows.card,
            marginBottom: '20px',
            '&:hover .spotlight-pill': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -32,
              top: -40,
              height: 128,
              width: 128,
              borderRadius: '999px',
              bgcolor: 'rgba(221,190,114,0.2)',
              pointerEvents: 'none',
            }}
          />
          <Sparkles size={16} color="#ecd9a8" />
          <Typography sx={{ marginTop: '8px', fontSize: 18, fontWeight: 700, color: '#ffffff' }}>
            You have{' '}
            <Box component="span" sx={{ color: '#ecd9a8' }}>
              12,480 LBG coins
            </Box>{' '}
            waiting
          </Typography>
          <Typography sx={{ marginTop: '2px', fontSize: 12, color: '#d7ece2' }}>
            Consolidated from 6 brands · Gold tier
          </Typography>
          <Box
            className="spotlight-pill"
            component="span"
            sx={{
              marginTop: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '999px',
              bgcolor: 'rgba(255,255,255,0.15)',
              paddingLeft: '12px',
              paddingRight: '12px',
              paddingTop: '6px',
              paddingBottom: '6px',
              fontSize: 12,
              fontWeight: 600,
              color: '#ffffff',
              transition: 'background-color 0.2s',
            }}
          >
            Open rewards <ChevronRight size={13} />
          </Box>
        </MotionButton> */}

        {/* Quick actions */}
        <MotionBox variants={item}>
          <Typography sx={{ marginBottom: '10px', paddingX: '4px', fontSize: 14, fontWeight: 600, color: '#334155', marginTop: '20px' }}>
            Quick actions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
            {[
              
              { icon: CreditCard, label: 'Cards' },
              { icon: Landmark, label: 'Accounts' },
              { icon: PieChart, label: 'Insights' },
              { icon: ArrowUpRight, label: 'Send' },
              { icon: QrCode, label: 'Payee' },
              { icon: Receipt, label: 'Pay a bill' },
              { icon: Gift, label: 'Rewards', action: onOpenRewards },
              { icon: MoreHorizontal, label: 'More' },
            ].map(({ icon: Icon, label, action }) => (
              <MotionButton
                key={label}
                variants={item}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                disableRipple
                onClick={action}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '16px',
                  bgcolor: '#ffffff',
                  padding: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: shadows.card,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    bgcolor: '#eef7f3',
                    color: '#045a42',
                  }}
                >
                  <Icon size={17} />
                </Box>
                <Typography sx={{ fontSize: 11, fontWeight: 500, color: '#475569' }}>{label}</Typography>
              </MotionButton>
            ))}
          </Box>
        </MotionBox>

        {/* Recent transactions */}
        <MotionBox variants={item} sx={{ marginTop: '20px' }}>
          <Box sx={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingX: '4px' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Recent transactions</Typography>
            <Box
              component="button"
              sx={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: '#045a42',
                fontFamily: 'inherit',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              View all
            </Box>
          </Box>
          <Box
            sx={{
              overflow: 'hidden',
              borderRadius: '16px',
              bgcolor: '#ffffff',
              boxShadow: shadows.card,
            }}
          >
            {recentTx.map((tx, i) => (
              <Box
                key={tx.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingX: 2,
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  ...(i > 0 && { borderTop: '1px solid #e2e8f0' }),
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    height: 36,
                    width: 36,
                    flexShrink: 0,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '999px',
                    ...(tx.amount > 0
                      ? { bgcolor: '#ecfdf5', color: '#059669' }
                      : { bgcolor: '#f1f5f9', color: '#64748b' }),
                  }}
                >
                  {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#0f172a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.label}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{tx.detail}</Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tx.amount > 0 ? '#059669' : '#0f172a',
                  }}
                >
                  {formatCurrencyGBP(tx.amount)}
                </Typography>
              </Box>
            ))}
          </Box>
        </MotionBox>
      </Box>
      </Box>

      {/* Bottom navigation (fixed for this page) */}
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          borderTop: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          backdropFilter: 'blur(8px)',
          paddingX: 1,
          paddingTop: 0.5,
          paddingBottom: 2,
        }}
      >
        {(
          [
            { id: 'home', label: 'Home', icon: Home },
            { id: 'loans', label: 'Loans', icon: HandCoins },
            { id: 'investment', label: 'Investment', icon: TrendingUp },
            { id: 'insurance', label: 'Insurance', icon: ShieldCheck },
          ] as const
        ).map(({ id, label, icon: Icon }) => {
          const active = id === 'home'
          return (
            <ButtonBase
              key={id}
              disableRipple
              sx={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                paddingTop: '10px',
                paddingBottom: '2px',
                borderRadius: 0,
              }}
            >
              {active && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 3,
                    borderRadius: '999px',
                    bgcolor: '#006a4d',
                  }}
                />
              )}
              <Icon size={19} color={active ? '#045a42' : '#94a3b8'} />
              <Typography sx={{ fontSize: 11, fontWeight: 500, color: active ? '#045a42' : '#94a3b8' }}>
                {label}
              </Typography>
            </ButtonBase>
          )
        })}
      </Box>
    </MotionBox>
  )
}
