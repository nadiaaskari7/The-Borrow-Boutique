import type { Dress } from '../types'
import { money } from '../utils/dresses'
import { DressImage } from './DressImage'

export function DressCard({
  dress,
  onOpen,
}: {
  dress: Dress
  onOpen: (dressId: string) => void
}) {
  return (
    <article className="dress-card" onClick={() => onOpen(dress.id)}>
      <div className="dress-card-image-wrap">
        <DressImage dress={dress} />
        {dress.isNew && <span className="dress-badge">New in</span>}
      </div>
      <div className="dress-card-body">
        <h2>{dress.name}</h2>
        <p>{money(dress.rentalPrice)}</p>
      </div>
    </article>
  )
}
