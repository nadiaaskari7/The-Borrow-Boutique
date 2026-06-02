export function Notice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  if (!message) return null

  return (
    <div className="notice" role="status">
      <span>{message}</span>
      <button onClick={onDismiss} type="button" aria-label="Dismiss notification">
        x
      </button>
    </div>
  )
}
