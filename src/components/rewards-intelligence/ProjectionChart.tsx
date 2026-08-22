import { useId } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface ProjectionPoint {
  year: string
  value: number
}

interface ProjectionChartProps {
  title?: string
  data?: ProjectionPoint[]
  growthLabel?: string
}

export default function ProjectionChart({
  title = 'Value Projection',
  data = [],
  growthLabel = 'Projected Growth',
}: ProjectionChartProps) {
  const gradientId = useId()
  const width = 300
  const height = 110
  const paddingY = 10

  const points = data.length > 0 ? data : [{ year: '—', value: 0 }]
  const max = Math.max(...points.map((p) => p.value), 1)
  const min = Math.min(...points.map((p) => p.value), 0)
  const range = max - min || 1

  const coords = points.map((p, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * width,
    y: height - paddingY - ((p.value - min) / range) * (height - paddingY * 2),
  }))

  // Smooth cubic path through all points
  const linePath = coords.reduce((path, c, i, arr) => {
    if (i === 0) return `M ${c.x},${c.y}`
    const prev = arr[i - 1]
    const cx = (prev.x + c.x) / 2
    return `${path} C ${cx},${prev.y} ${cx},${c.y} ${c.x},${c.y}`
  }, '')
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`

  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-card">
      <div className="mb-2 flex items-center gap-1.5">
        <TrendingUp size={15} className="text-sky-600" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none" role="img">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#006a4d" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#006a4d" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="#f1f5f9" strokeWidth="1" />
          ))}
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: 0.3 }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="#006a4d"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />
        </svg>
        <div className="mt-1 flex justify-between px-0.5">
          {points.map((p) => (
            <span key={p.year} className="text-[10px] font-medium text-slate-400">
              {p.year}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-1 text-center text-[11px] font-medium text-slate-400">{growthLabel}</p>
    </div>
  )
}
