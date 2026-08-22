import { motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  Gift,
  Landmark,
  LogOut,
  MoreHorizontal,
  PieChart,
  QrCode,
  Sparkles,
} from 'lucide-react'
import { formatCurrencyGBP } from '../utils/format'

interface BankHomePageProps {
  userName: string
  onOpenRewards: () => void
  onSignOut: () => void
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
}

const recentTx = [
  { id: 'r1', label: 'Tesco Stores', detail: 'Groceries · Today', amount: -23.4 },
  { id: 'r2', label: 'Salary', detail: 'Income · Yesterday', amount: 2450.0 },
  { id: 'r3', label: 'Costa Coffee', detail: 'Dining · Mon', amount: -3.85 },
]

export default function BankHomePage({ userName, onOpenRewards, onSignOut }: BankHomePageProps) {
  const firstName = userName.split(/\s+/)[0] ?? userName

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="no-scrollbar h-full overflow-y-auto bg-slate-100 pb-8"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-5 pt-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-sm font-bold backdrop-blur">
              {userName
                .split(/\s+/)
                .map((p) => p.charAt(0))
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </span>
            <div>
              <p className="text-xs text-brand-100">Good morning</p>
              <p className="text-base font-semibold">{firstName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="rounded-full p-2 transition hover:bg-white/15" aria-label="Notifications">
              <Bell size={19} />
              <span className="sr-only">Notifications</span>
            </button>
            <button onClick={onSignOut} className="rounded-full p-2 transition hover:bg-white/15" aria-label="Sign out">
              <LogOut size={19} />
            </button>
          </div>
        </div>

        <motion.div variants={item} className="mt-5 rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-100">Everyday Spend · •• 4821</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight">{formatCurrencyGBP(3184.62)}</p>
          <div className="mt-4 flex gap-2.5">
            {[
              { icon: ArrowUpRight, label: 'Pay' },
              { icon: ArrowDownLeft, label: 'Request' },
              { icon: QrCode, label: 'Scan' },
              { icon: Gift, label: 'Rewards', highlight: true },
            ].map(({ icon: Icon, label, highlight }) => (
              <button
                key={label}
                onClick={highlight ? onOpenRewards : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-[11px] font-semibold transition ${
                  highlight ? 'bg-gold-400 text-brand-900 hover:bg-gold-300' : 'bg-white/15 hover:bg-white/25'
                }`}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Rounded bottom edge into content */}
        <div className="h-6" />
      </div>
      <div className="-mt-6 rounded-t-3xl bg-slate-100 pt-5" />

      <div className="space-y-5 px-5">
        {/* Rewards spotlight */}
        <motion.button
          variants={item}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenRewards}
          className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-4 text-left shadow-card"
        >
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-gold-400/20" />
          <Sparkles size={16} className="text-gold-300" />
          <p className="mt-2 text-lg font-bold text-white">
            You have <span className="text-gold-300">12,480 LBG coins</span> waiting
          </p>
          <p className="mt-0.5 text-xs text-brand-100">Consolidated from 6 brands · Gold tier</p>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition group-hover:bg-white/25">
            Open rewards <ChevronRight size={13} />
          </span>
        </motion.button>

        {/* Quick actions */}
        <motion.section variants={item}>
          <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-700">Quick actions</h2>
          <div className="grid grid-cols-4 gap-2.5">
            {[
              { icon: Gift, label: 'Rewards', action: onOpenRewards },
              { icon: CreditCard, label: 'Cards' },
              { icon: Landmark, label: 'Accounts' },
              { icon: PieChart, label: 'Insights' },
              { icon: ArrowUpRight, label: 'Send' },
              { icon: QrCode, label: 'Payee' },
              { icon: MoreHorizontal, label: 'More' },
            ].map(({ icon: Icon, label, action }) => (
              <motion.button
                key={label}
                variants={item}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={action}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 shadow-card"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon size={17} />
                </span>
                <span className="text-[11px] font-medium text-slate-600">{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Recent transactions */}
        <motion.section variants={item}>
          <div className="mb-2.5 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-slate-700">Recent transactions</h2>
            <button className="text-xs font-semibold text-brand-700 hover:underline">View all</button>
          </div>
          <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white shadow-card">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{tx.label}</p>
                  <p className="text-xs text-slate-400">{tx.detail}</p>
                </div>
                <p className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {formatCurrencyGBP(tx.amount)}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  )
}
