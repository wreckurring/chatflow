export function TypingIndicator({ typists }) {
  if (typists.length === 0) return <div className="h-5" />

  const names = typists.map(t => t.displayName || t.username)
  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : `${names[0]} and ${names.length - 1} others are typing`

  return (
    <div className="flex items-center gap-2 px-5 h-5">
      <div className="flex gap-0.5 items-center">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-ink-muted animate-pulse-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <span className="text-2xs text-ink-muted italic">{label}</span>
    </div>
  )
}
