export function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface gap-4">
      <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-ink">No room selected</p>
        <p className="text-xs text-ink-muted mt-1">Pick a room from the sidebar or create a new one</p>
      </div>
    </div>
  )
}
