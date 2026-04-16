// deterministic color from username
function colorFromName(name = '') {
  const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#14B8A6', '#8B5CF6', '#F97316', '#06B6D4']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name = '?', size = 'md' }) {
  const color = colorFromName(name)
  const initials = name.slice(0, 2).toUpperCase()
  const sizes = { xs: 'w-5 h-5 text-2xs', sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' }

  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center rounded-md font-semibold font-mono shrink-0`}
      style={{ background: `${color}20`, color }}
    >
      {initials}
    </span>
  )
}
