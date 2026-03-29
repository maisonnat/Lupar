interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  color?: string
}

export default function MetricCard({ label, value, icon, color = 'text-gray-900' }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{label}</p>
        <span className="text-gray-400">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
