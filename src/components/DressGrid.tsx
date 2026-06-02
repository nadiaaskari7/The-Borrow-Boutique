import type { Dress } from '../types'
import { DressCard } from './DressCard'

export function DressGrid({
  dresses,
  onAsk,
  onRent,
}: {
  dresses: Dress[]
  onAsk: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  if (!dresses.length) {
    return <p className="empty-state">No dresses match that size yet.</p>
  }

  return (
    <section className="dress-grid">
      {dresses.map((dress) => (
        <DressCard dress={dress} key={dress.id} onAsk={onAsk} onRent={onRent} />
      ))}
    </section>
  )
}
