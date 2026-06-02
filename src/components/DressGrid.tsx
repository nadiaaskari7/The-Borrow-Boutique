import type { Dress } from '../types'
import { DressCard } from './DressCard'

export function DressGrid({
  dresses,
  emptyMessage = 'No dresses match that size yet.',
  onOpen,
}: {
  dresses: Dress[]
  emptyMessage?: string
  onOpen: (dressId: string) => void
}) {
  if (!dresses.length) {
    return <p className="empty-state">{emptyMessage}</p>
  }

  return (
    <section className="dress-grid">
      {dresses.map((dress) => (
        <DressCard dress={dress} key={dress.id} onOpen={onOpen} />
      ))}
    </section>
  )
}
