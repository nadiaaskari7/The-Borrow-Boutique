import type { Dress } from '../types'
import { dressSubtitle, money } from '../utils/dresses'
import { DressImage } from './DressImage'

export function DressCard({
  dress,
  onAsk,
  onOpen,
  onRent,
}: {
  dress: Dress
  onAsk: (dressId: string) => void
  onOpen: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  return (
    <article className="dress-card" onClick={() => onOpen(dress.id)}>
      <div className="dress-card-image-wrap">
        <DressImage dress={dress} />
        {dress.isNew && <span className="dress-badge">New in</span>}
      </div>
      <div className="dress-card-body">
        <div>
          <div className="dress-card-topline">
            <span>{dress.sizes.join(' / ')}</span>
            <span>{money(dress.rentalPrice)}</span>
          </div>
          <h2>{dress.name}</h2>
          <p>{dressSubtitle(dress) || 'Statement dress rental'}</p>
        </div>
        <div className="dress-footer">
          <button
            className="secondary"
            onClick={(event) => {
              event.stopPropagation()
              onAsk(dress.id)
            }}
            type="button"
          >
            Ask
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation()
              onRent(dress.id)
            }}
            type="button"
          >
            Rent now
          </button>
        </div>
      </div>
    </article>
  )
}
