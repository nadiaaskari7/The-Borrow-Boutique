import type { Dress } from '../types'
import { DressCard } from './DressCard'

export function DressGrid({
  dresses,
  emptyMessage = 'No dresses match that size yet.',
  onAsk,
  onOpen,
  onRent,
}: {
  dresses: Dress[]
  emptyMessage?: string
  onAsk: (dressId: string) => void
  onOpen: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  if (!dresses.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <section className="dress-grid">
      {dresses.map((dress) => (
        <DressCard dress={dress} key={dress.id} onAsk={onAsk} onOpen={onOpen} onRent={onRent} />
      ))}
    </section>
  )
}
