import type { Dress } from '../types'
import { dressSubtitle, money } from '../utils/dresses'
import { DressImage } from './DressImage'

export function DressCard({
  dress,
  onAsk,
  onRent,
}: {
  dress: Dress
  onAsk: (dressId: string) => void
  onRent: (dressId: string) => void
}) {
  return (
    <article className="dress-card">
      <DressImage dress={dress} />
      <div className="dress-card-body">
        <div>
          <div className="dress-card-topline">
            <span>{dress.size}</span>
            <span>{money(dress.rentalPrice)}</span>
          </div>
          <h2>{dress.name}</h2>
          <p>{dressSubtitle(dress) || 'Statement dress rental'}</p>
        </div>
        <div className="dress-footer">
          <button className="secondary" onClick={() => onAsk(dress.id)} type="button">
            Ask
          </button>
          <button onClick={() => onRent(dress.id)} type="button">
            Rent now
          </button>
        </div>
      </div>
    </article>
  )
}
