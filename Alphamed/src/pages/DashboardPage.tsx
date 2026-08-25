import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import CoronavirusIcon from '@mui/icons-material/Coronavirus'
import DescriptionIcon from '@mui/icons-material/Description'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import EmergencyIcon from '@mui/icons-material/Emergency'
import EventAvailableIcon from '@mui/icons-material/EventAvailable'
import FolderSharedIcon from '@mui/icons-material/FolderShared'
import GavelIcon from '@mui/icons-material/Gavel'
import HomeIcon from '@mui/icons-material/Home'
import LocalHospitalIcon from '@mui/icons-material/LocalHospital'
import MenuIcon from '@mui/icons-material/Menu'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PersonIcon from '@mui/icons-material/Person'
import SupportAgentIcon from '@mui/icons-material/SupportAgent'
import { fetchLinkedCustomerSummaryByEmail } from '../services/lbgRewardsApi'
import { BrandMark } from '../components/layout/AuthScreenLayout'
import type {
  ConvertRouteState,
  DashboardRouteState,
} from '../types'

interface ServiceItem {
  label: string
  icon: ReactNode
  tint: string
}

interface AppointmentItem {
  title: string
  person: string
  date: string
  time: string
  location: string
  status: 'Confirmed' | 'Ready' | 'Scheduled'
}

const SERVICES: ServiceItem[] = [
  { label: 'Drivers Medicals', icon: <DirectionsCarIcon />, tint: '#e3f2fd' },
  { label: 'Ambulance Services', icon: <EmergencyIcon />, tint: '#ffebee' },
  { label: 'Medico-Legal Reports', icon: <GavelIcon />, tint: '#ede7f6' },
  { label: 'Covid Testing', icon: <CoronavirusIcon />, tint: '#e0f2f1' },
  { label: 'Medical Assessment', icon: <MonitorHeartIcon />, tint: '#fff8e1' },
  { label: 'My Reports', icon: <DescriptionIcon />, tint: '#e8f5e9' },
]

const APPOINTMENTS: Record<'testing' | 'assessment' | 'reports', AppointmentItem[]> = {
  testing: [
    {
      title: 'Blood Panel & Vitals',
      person: 'Dr. James Wilson',
      date: '15 Aug 2026',
      time: '09:30',
      location: 'AlphaMedicol Clinic · Room 204',
      status: 'Confirmed',
    },
    {
      title: 'Covid PCR Test',
      person: 'Dr. Priya Nair',
      date: '22 Aug 2026',
      time: '11:00',
      location: 'Drive-through Testing Bay 2',
      status: 'Scheduled',
    },
  ],
  assessment: [
    {
      title: 'Drivers Medical Assessment',
      person: 'Dr. James Wilson',
      date: '15 Aug 2026',
      time: '09:30',
      location: 'AlphaMedicol Clinic · Room 204',
      status: 'Confirmed',
    },
    {
      title: 'Occupational Health Review',
      person: 'Dr. Hannah Lee',
      date: '29 Aug 2026',
      time: '14:15',
      location: 'Video Consultation',
      status: 'Scheduled',
    },
  ],
  reports: [
    {
      title: 'Chest X-Ray Report',
      person: 'Radiology Dept.',
      date: '12 Aug 2026',
      time: '—',
      location: 'Available in My Reports',
      status: 'Ready',
    },
    {
      title: 'Full Blood Count Results',
      person: 'Dr. James Wilson',
      date: '18 Aug 2026',
      time: '—',
      location: 'Pending review',
      status: 'Scheduled',
    },
  ],
}

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: <HomeIcon /> },
  { key: 'appointments', label: 'Appointments', icon: <CalendarMonthIcon /> },
  { key: 'reports', label: 'Reports', icon: <FolderSharedIcon /> },
  { key: 'support', label: 'Support', icon: <SupportAgentIcon /> },
  { key: 'profile', label: 'Profile', icon: <PersonIcon /> },
] as const

type NavKey = (typeof NAV_ITEMS)[number]['key']

type AppointmentTab = 'testing' | 'assessment' | 'reports'

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state ?? {}) as DashboardRouteState

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<NavKey>('home')
  const [tab, setTab] = useState<AppointmentTab>('testing')
  const [rewardsLoading, setRewardsLoading] = useState(false)
  const [lookupError, setLookupError] = useState(false)

  const userName = routeState.userName ?? readStored('am_customer_name') ?? 'Alex Morgan'
  const userEmail = routeState.email ?? readStored('am_customer_email') ?? ''

  const appointments = useMemo(() => APPOINTMENTS[tab], [tab])

  /** Journey B: drawer -> Rewards -> lookup -> convert screen. */
  const handleRewardsClick = async () => {
    setDrawerOpen(false)
    if (!userEmail || rewardsLoading) {
      if (!userEmail) setLookupError(true)
      return
    }
    setRewardsLoading(true)
    try {
      const summary = await fetchLinkedCustomerSummaryByEmail(userEmail)
      const state: ConvertRouteState = {
        email: userEmail,
        points: summary.alphamedicolPoints,
        userName,
        hasLinkedAccount: summary.hasAccount,
      }
      navigate('/lbg-rewards/convert', { state })
    } catch {
      setLookupError(true)
    } finally {
      setRewardsLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100%', pb: 9 }}>
      {/* ---------- Header ---------- */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          bgcolor: 'rgba(244,247,251,.94)',
          backdropFilter: 'blur(8px)',
          px: 1.5,
          py: 1.25,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IconButton
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          sx={{
            bgcolor: '#fff',
            boxShadow: '0 4px 14px -6px rgba(13,40,80,.35)',
            '&:hover': { bgcolor: '#fff' },
          }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mr: 5,
          }}
        >
          <BrandMark size={26} />
          <Typography fontWeight={800} fontSize={17} letterSpacing={0.2}>
            AlphaMedicol
          </Typography>
        </Box>
      </Box>

      <Box className="page-body" sx={{ pt: 0.5 }}>
        {/* ---------- Greeting ---------- */}
        <Typography className="am-rise" variant="h5" fontWeight={800}>
          Hello, {userName.split(' ')[0]}
          <Box component="span" sx={{ ml: 0.5 }} aria-hidden>
            👋
          </Box>
        </Typography>
        <Typography className="am-rise am-rise-1" variant="body2" color="text.secondary">
          Your health, organised. Here's today at a glance.
        </Typography>

        {/* ---------- Hero banner ---------- */}
        <Box
          className="hero-banner am-rise am-rise-2"
          sx={{
            mt: 2,
            borderRadius: 5,
            p: 2.75,
            minHeight: 168,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div className="hero-blob" style={{ width: 130, height: 130, right: -34, top: -44, background: 'rgba(255,255,255,.14)' }} />
          <div className="hero-blob" style={{ width: 74, height: 74, right: 52, bottom: -28, background: 'rgba(255,255,255,.12)' }} />
          <div className="hero-blob" style={{ width: 40, height: 40, right: 118, top: 34, background: 'rgba(38,169,224,.55)' }} />
          <LocalHospitalIcon sx={{ position: 'absolute', right: 18, bottom: 14, fontSize: 64, color: 'rgba(255,255,255,.16)' }} />

          <Box sx={{ maxWidth: '72%' }}>
            <Chip
              size="small"
              label="TRUSTED SINCE 1998"
              sx={{
                bgcolor: 'rgba(255,255,255,.18)',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '.08em',
                fontSize: 10,
                mb: 1,
              }}
            />
            <Typography variant="h6" fontWeight={800} lineHeight={1.25} color="#fff">
              Quality Medical Services You Can Trust
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setTab('assessment')}
            sx={{
              alignSelf: 'flex-start',
              mt: 1.5,
              bgcolor: '#fff',
              color: '#0d47a1',
              fontWeight: 700,
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            Book Appointment
          </Button>
        </Box>

        {/* ---------- Services grid ---------- */}
        <Typography className="section-title" sx={{ display: 'block', mt: 3, mb: 1 }}>
          Our Services
        </Typography>
        <Box
          className="am-rise am-rise-3"
          sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}
        >
          {SERVICES.map((service) => (
            <Box
              key={service.label}
              sx={{
                bgcolor: '#fff',
                borderRadius: 4,
                p: 1.25,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'transform .18s ease, box-shadow .18s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 22px -12px rgba(13,40,80,.4)',
                },
              }}
            >
              <Avatar
                variant="rounded"
                sx={{
                  mx: 'auto',
                  mb: 0.75,
                  width: 42,
                  height: 42,
                  borderRadius: 2.5,
                  bgcolor: service.tint,
                  color: '#0d47a1',
                }}
              >
                {service.icon}
              </Avatar>
              <Typography fontSize={10.5} fontWeight={600} lineHeight={1.25} color="text.primary">
                {service.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ---------- Upcoming appointments ---------- */}
        <Box className="am-rise am-rise-4" sx={{ mt: 3 }}>
          <Typography className="section-title" sx={{ display: 'block', mb: 1 }}>
            Upcoming Appointments
          </Typography>
          <Tabs
            value={tab}
            onChange={(_, value: AppointmentTab) => setTab(value)}
            variant="fullWidth"
            sx={{
              minHeight: 36,
              bgcolor: '#fff',
              borderRadius: 3,
              p: 0.5,
              boxShadow: 'inset 0 0 0 1px #e6edf5',
              '& .MuiTab-root': {
                minHeight: 32,
                fontSize: 12.5,
                fontWeight: 700,
                borderRadius: 2,
              },
            }}
          >
            <Tab value="testing" label="Testing" />
            <Tab value="assessment" label="Assessment" />
            <Tab value="reports" label="Reports" />
          </Tabs>

          <Box sx={{ display: 'grid', gap: 1.25, mt: 1.5 }}>
            {appointments.map((appointment) => (
              <AppointmentCard
                key={`${appointment.title}-${appointment.date}`}
                appointment={appointment}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ---------- Drawer menu ---------- */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 264,
            borderTopRightRadius: 22,
            borderBottomRightRadius: 22,
          },
        }}
      >
        <Box sx={{ p: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <BrandMark />
          <Box>
            <Typography fontWeight={800}>AlphaMedicol</Typography>
            <Typography fontSize={11.5} color="text.secondary" noWrap maxWidth={170}>
              {userName}
            </Typography>
          </Box>
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.key}
              selected={activeNav === item.key}
              onClick={() => {
                setActiveNav(item.key)
                setDrawerOpen(false)
              }}
              sx={{ borderRadius: 2.5, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 38 }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
              />
            </ListItemButton>
          ))}

          <Divider sx={{ my: 1 }} />

          <ListItemButton
            onClick={handleRewardsClick}
            disabled={rewardsLoading}
            sx={{
              borderRadius: 2.5,
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
              '&.Mui-disabled': { color: 'rgba(255,255,255,.7)', bgcolor: 'primary.light' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
              {rewardsLoading ? (
                <CircularProgress size={20} sx={{ color: 'inherit' }} />
              ) : (
                <CardGiftcardIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={rewardsLoading ? 'Checking rewards…' : 'Rewards'}
              secondary={rewardsLoading ? undefined : 'Convert points to LBG Coins'}
              secondaryTypographyProps={{ color: 'rgba(255,255,255,.78)', fontSize: 11.5 }}
              primaryTypographyProps={{ fontWeight: 700, fontSize: 14 }}
            />
          </ListItemButton>
        </List>
      </Drawer>

      {/* ---------- Bottom navigation ---------- */}
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1100,
          bgcolor: '#fff',
          borderTop: '1px solid #e6edf5',
          px: { xs: 1, sm: 0 },
          pb: 0.75,
          pt: 0.5,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(5, 1fr)',
            sm: `repeat(5, minmax(0, 120px))`,
          },
          justifyContent: 'center',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <BottomNavItem
            key={item.key}
            active={activeNav === item.key}
            icon={item.icon}
            label={item.label}
            onClick={() => setActiveNav(item.key)}
          />
        ))}
      </Box>

      {/* ---------- Lookup failure notice ---------- */}
      <Snackbar
        open={lookupError}
        autoHideDuration={3500}
        onClose={() => setLookupError(false)}
        message="We couldn't verify your LBG account. Please try again."
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: 68 }}
      />
    </Box>
  )
}

function AppointmentCard({ appointment }: { appointment: AppointmentItem }) {
  const initials = appointment.person
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 4,
        p: 1.75,
        display: 'flex',
        gap: 1.5,
        alignItems: 'center',
        boxShadow: '0 8px 20px -16px rgba(13,40,80,.45)',
      }}
    >
      <Avatar
        sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 700, fontSize: 14 }}
      >
        {initials}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontSize={13.5} fontWeight={700} noWrap>
          {appointment.title}
        </Typography>
        <Typography fontSize={12} color="text.secondary" noWrap>
          {appointment.person} · {appointment.date} · {appointment.time}
        </Typography>
        <Typography fontSize={11} color="text.secondary" noWrap>
          {appointment.location}
        </Typography>
      </Box>
      <Chip
        size="small"
        icon={<EventAvailableIcon sx={{ fontSize: 13 }} />}
        label={appointment.status}
        sx={{
          height: 24,
          fontSize: 10.5,
          fontWeight: 700,
          bgcolor: appointment.status === 'Confirmed' ? '#e8f5e9' : '#f1f5f9',
          color: appointment.status === 'Confirmed' ? '#2e7d32' : '#546e7a',
          '& .MuiChip-icon': { color: 'inherit' },
        }}
      />
    </Box>
  )
}

function BottomNavItem(props: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      onClick={props.onClick}
      sx={{
        appearance: 'none',
        border: 0,
        background: 'none',
        py: 0.75,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
        cursor: 'pointer',
        color: props.active ? 'primary.main' : '#8a99ab',
      }}
    >
      {props.icon}
      <Typography fontSize={9.5} fontWeight={props.active ? 700 : 500} lineHeight={1}>
        {props.label}
      </Typography>
    </Box>
  )
}
