export function EmptyState({ onToggleSidebar }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-surface gap-4">
      {/* Mobile: show hamburger to open sidebar */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden absolute top-3 left-4 text-ink-muted hover:text-ink transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>

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
