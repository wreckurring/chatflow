export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs text-ink-muted font-medium tracking-wide uppercase">{label}</label>}
      <input
        className={`bg-surface-2 border ${error ? 'border-danger' : 'border-border'} text-ink placeholder-ink-faint rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
